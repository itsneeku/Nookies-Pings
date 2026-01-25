import { SlashCommandSubcommandBuilder } from "discord.js";
import { type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { EBGamesCASearchTable as table } from "@/lib/drizzle/schema";

const cron = "*/5 * * * *";
const name = "search";

const subcommand: MonitorSubcommand = {
  data: new SlashCommandSubcommandBuilder()
    .setName(name)
    .setDescription("Monitor a search URL")
    .addStringOption((o) => o.setName("url").setDescription("Search URL").setRequired(true)),

  handler: async (opts, env) => {
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

export default { cron, name, table, subcommand } satisfies Monitor;
