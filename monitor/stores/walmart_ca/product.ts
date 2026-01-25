import { Result } from "better-result";
import { Cron } from "croner";
import { SlashCommandSubcommandBuilder } from "discord.js";
import { type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import PQueue from "p-queue";

import { notify } from "@/lib/discord/notify";
import { WalmartCAProductTable as table } from "@/lib/drizzle/schema";
import { Database } from "@/monitor/db";
import { pyScrape } from "@/monitor/py";

import { PRODUCT_CONFIG, STORE } from "./index";

const cron = PRODUCT_CONFIG.cron;
const name = PRODUCT_CONFIG.name;

const subcommand: MonitorSubcommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName(name)
    .setDescription("Monitor a product SKU")
    .addStringOption((o) => o.setName("sku").setDescription("Product SKU").setRequired(true)),

  handler: async (opts, env) => {
    const values: InferInsertModel<typeof table> = {
      sku: opts.sku as string,
      url: PRODUCT_CONFIG.urlTemplate(opts.sku as string),
      active: 1,
      channel: opts.channel as string,
      role: opts.role as string,
    };

    return await drizzle(env.DB)
      .insert(table)
      .values(values)
      .onConflictDoUpdate({ target: table.sku, set: values })
      .returning()
      .all();
  },
};

export const createJobs = async (db: Database, jobs: Map<string, Cron>, queue: PQueue) => {
  const rows = db.getData(STORE, PRODUCT_CONFIG.name);

  for (const row of rows as ProductRow[]) {
    if (!row.active) continue;

    const key = `${PRODUCT_CONFIG.keyPrefix}_${row.id}`;

    const job = new Cron(cron, async () => {
      await queue.add(
        async () => {
          const result = await Result.gen(async function* () {
            const scrapeResult = pyScrape({
              store: STORE,
              monitor: PRODUCT_CONFIG.name,
              sku: row.sku as string,
            });

            if (scrapeResult.isErr()) {
              return Result.err(scrapeResult.error);
            }

            const products = scrapeResult.value.products;
            if (!products || products.length === 0) return Result.ok(void 0);
            const productResult = products[0]!;

            const prevInStock = row.inStock === 1;
            const currInStock = productResult.inStock;
            const shouldNotify = (!prevInStock && currInStock) || row.price !== productResult.price;

            if (shouldNotify) {
              const notifyResult = await notify(productResult, row);
              if (notifyResult.isErr()) {
                return Result.err(notifyResult.error);
              }
            }

            const upsertResult = await db.upsertRow(STORE, PRODUCT_CONFIG.name, {
              id: row.id,
              inStock: currInStock ? 1 : 0,
              price: productResult.price,
              title: productResult.title,
              image: productResult.image,
            } as TableRow);

            if (upsertResult.isErr()) {
              return Result.err(upsertResult.error);
            }

            return Result.ok(void 0);
          });

          if (result.isErr()) {
            console.error(
              `[${PRODUCT_CONFIG.logPrefix}] Error for ${row.sku}:`,
              result.error.message,
            );
          }
        },
        { timeout: 60000 },
      );
    });

    jobs.set(key, job);
  }
};

export default {
  cron,
  name,
  table,
  subcommand,
  createJobs,
} satisfies Monitor;
