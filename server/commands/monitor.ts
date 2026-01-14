import {
  SlashCommandBuilder,
  ChannelType,
  ApplicationCommandType,
} from "discord.js";
import { upsertJob } from "server/d1";
import { updateInteraction } from "server/discord";
import fs from "node:fs";

const ID = {
  STORE: "store",
  SKU: "sku",
  MAX_PRICE: "max_price",
  CRON: "cron",
  CHANNEL: "channel",
  ROLE: "role",
} as const;

const getOption = (name: string, options: any[]) =>
  options.find((o) => o.name === name)?.value;

const stores = fs
  .readdirSync("scrapers")
  .filter((f) => f.endsWith(".py") && !f.startsWith("_"))
  .map((f) => f.replace(/\.py$/, ""));

export default {
  data: new SlashCommandBuilder()
    .setName("monitor")
    .setDescription("Monitor a product")
    .addStringOption((o) =>
      o
        .setName(ID.STORE)
        .setDescription("Store Name")
        .setChoices(stores.map((store) => ({ name: store, value: store })))
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName(ID.SKU).setDescription("Product SKU").setRequired(true)
    )
    .addChannelOption((o) =>
      o
        .setName(ID.CHANNEL)
        .setDescription("Notification Channel")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addRoleOption((o) =>
      o.setName(ID.ROLE).setDescription("Notification Role").setRequired(true)
    )
    .addNumberOption((o) =>
      o.setName(ID.MAX_PRICE).setDescription("Maximum Price")
    )
    .addStringOption((o) =>
      o.setName(ID.CRON).setDescription("Custom cron pattern")
    ),

  execute: async (interaction, env) => {
    if (interaction.data.type !== ApplicationCommandType.ChatInput) return;

    const options = interaction.data.options || [];
    const input: MonitorJobData = {
      store: getOption(ID.STORE, options) as string,
      method: "product" as const,
      sku: getOption(ID.SKU, options) as string,
      cron: (getOption(ID.CRON, options) as string) || "*/1 * * * *",
      maxPrice: (getOption(ID.MAX_PRICE, options) as number) || 0,
      channelId: getOption(ID.CHANNEL, options) as string,
      roleId: getOption(ID.ROLE, options) as string,
      previousResult: null,
    };

    const result = await upsertJob(env.DB, input);
    await updateInteraction(interaction, env, {
      content: JSON.stringify(result, null, 2),
    });
    await env.DO.getByName(":3").broadcast(result);
  },
} satisfies Command;
