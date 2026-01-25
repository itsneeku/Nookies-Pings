import { Result } from "better-result";
import { Cron } from "croner";
import { SlashCommandSubcommandBuilder } from "discord.js";
import { type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import PQueue from "p-queue";

import { notifyNewProduct } from "@/lib/discord/notify";
import { WalmartCASearchTable as table } from "@/lib/drizzle/schema";
import { Database } from "@/monitor/db";
import { pyScrape } from "@/monitor/py";

import { SEARCH_CONFIG, STORE, PRODUCT_CONFIG } from "./index";

const cron = SEARCH_CONFIG.cron;
const name = SEARCH_CONFIG.name;

const subcommand: MonitorSubcommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName(name)
    .setDescription("Monitor a search URL")
    .addStringOption((o) => o.setName("url").setDescription("Search URL").setRequired(true)),

  handler: async (opts: { [k: string]: string | number | boolean }, env: Env) => {
    const values: InferInsertModel<typeof table> = {
      url: opts.url as string,
      channel: opts.channel as string,
      role: opts.role as string,
    };

    await drizzle(env.DB)
      .insert(table)
      .values(values)
      .onConflictDoUpdate({ target: table.url, set: values })
      .returning()
      .all();
  },
};

export const createJobs = async (db: Database, jobs: Map<string, Cron>, queue: PQueue) => {
  const rows = db.getData(STORE, SEARCH_CONFIG.name);

  for (const row of rows) {
    const key = `${SEARCH_CONFIG.keyPrefix}_${row.id}`;

    const job = new Cron(cron, async () => {
      await queue.add(
        async () => {
          const result = await Result.gen(async function* () {
            const scrapeResult = pyScrape({
              store: STORE,

              monitor: SEARCH_CONFIG.name,
              url: row.url as string,
            });

            if (scrapeResult.isErr()) {
              return Result.err(scrapeResult.error);
            }

            if (!scrapeResult.value.newProducts) return Result.ok(void 0);

            for (const product of scrapeResult.value.newProducts) {
              const existsResult = await db.exists(`${STORE}_product`, {
                sku: product.sku,
              });

              if (existsResult.isErr()) {
                return Result.err(existsResult.error);
              }

              if (existsResult.value) continue;

              const insertResult = await db.insertRow(STORE, PRODUCT_CONFIG.name, {
                sku: product.sku,
                url: product.url,
                title: product.title,
                inStock: product.inStock ? 1 : 0,
                price: product.price,
                image: product.image,
                active: 0,
                channel: row.channel,
                role: row.role,
              } as Omit<TableRow, "id">);

              if (insertResult.isErr()) {
                return Result.err(insertResult.error);
              }

              const notifyResult = await notifyNewProduct(product, row);
              if (notifyResult.isErr()) {
                return Result.err(notifyResult.error);
              }
            }

            return Result.ok(void 0);
          });

          if (result.isErr()) {
            console.error(
              `[${SEARCH_CONFIG.logPrefix}] Error for ${row.url}:`,
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
