import { Cron } from "croner";
import { SlashCommandSubcommandBuilder } from "discord.js";
import { type InferInsertModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { notify } from "@/lib/discord/notify";
import { WalmartCAProductTable as table } from "@/lib/drizzle/schema";
import { pyRun } from "@/monitor/py";

import store from "./";

const cron = "*/1 * * * *";
const name = "product";

const createJob: JobCreator = (db, rowId, queue) => {
  return new Cron(cron, async () => {
    await queue.add(async () => {
      const prev = db.local.select().from(table).where(eq(table.id, rowId)).get()!;
      const scrapeResult = await pyRun<{
        title: string;
        inStock: number;
        price: number;
        image: string;
      }>({
        store: store.name,
        monitor: name,
        sku: prev.sku,
      });

      if (scrapeResult.isErr()) return console.log(scrapeResult.error);

      const result = scrapeResult.unwrap();
      const newRow = {
        ...prev,
        ...result,
      };

      const backInStock = !prev.inStock && result.inStock;
      const priceDropped = prev.price && prev.price > result.price && result.inStock;
      if (backInStock || priceDropped) await notify(newRow);

      for (const key of Object.keys(newRow) as (keyof typeof newRow)[])
        if (newRow[key] !== prev[key]) return await db.upsert(table, [newRow]);
    });
  });
};

const initJobs: JobsInitializer = async (db, jobs, queue) => {
  const rows = await db.local.select({ id: table.id }).from(table);
  for (const row of rows) {
    const job = createJob(db, row.id, queue);
    jobs.get(table._.name)!.set(row.id, job);
  }
};

const subcommand: MonitorSubcommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName(name)
    .setDescription("Monitor a product SKU")
    .addStringOption((o) => o.setName("sku").setDescription("Product SKU").setRequired(true)),

  handler: async (opts, env) => {
    const values: InferInsertModel<typeof table> = {
      sku: opts.sku as string,
      url: `https://www.walmart.ca/en/ip/${opts.sku as string}`,
      active: 1,
      channel: opts.channel as string,
      role: opts.role as string,
    };

    return await drizzle(env.DB)
      .insert(table)
      .values(values)
      .onConflictDoUpdate({ target: table.sku, set: values })
      .returning();
  },
};

export default {
  cron,
  name,
  table,
  subcommand,
  initJobs,
  createJob,
} satisfies Monitor;

export { createJob };
