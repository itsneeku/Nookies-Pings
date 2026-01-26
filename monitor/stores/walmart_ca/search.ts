import { Cron } from "croner";
import { SlashCommandSubcommandBuilder } from "discord.js";
import { eq, type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { notify } from "@/lib/discord/notify";
import { WalmartCAProductTable, WalmartCASearchTable as table } from "@/lib/drizzle/schema";
import { pyRun } from "@/monitor/py";

import store from "./";

const cron = "*/5 * * * *";
const name = "search";

const createJob: JobCreator = (db, rowId, queue) => {
  return new Cron(cron, async () => {
    await queue.add(async () => {
      const prev = db.local.select().from(table).where(eq(table.id, rowId)).get()!;
      const scrapeResult = await pyRun<
        {
          sku: string;
          url: string;
          title: string;
          inStock: number;
          price: number;
          image: string;
        }[]
      >({
        store: store.name,
        monitor: name,
        url: prev.url,
      });

      if (scrapeResult.isErr()) return console.log(scrapeResult.error);

      const results = scrapeResult.unwrap();
      const existingSKUs = new Set(
        db.local
          .select({ sku: WalmartCAProductTable.sku })
          .from(WalmartCAProductTable)
          .all()
          .map((p) => p.sku),
      );

      const newProducts = results
        .filter((p) => !existingSKUs.has(p.sku))
        .map((product) => ({
          ...product,
          channel: prev.channel,
          role: prev.role,
          active: 0,
        }));
      newProducts.forEach((p) => notify(p));

      await db.upsert(WalmartCAProductTable, newProducts); // InferInsertModel<typeof WalmartCAProductTable>
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
    .setDescription("Monitor a search URL")
    .addStringOption((o) => o.setName("url").setDescription("Search URL").setRequired(true)),

  handler: async (opts: { [k: string]: string | number | boolean }, env: Env) => {
    const values: InferInsertModel<typeof table> = {
      url: opts.url as string,
      channel: opts.channel as string,
      role: opts.role as string,
    };

    return await drizzle(env.DB)
      .insert(table)
      .values(values)
      .onConflictDoUpdate({ target: table.url, set: values })
      .returning()
      .all();
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
