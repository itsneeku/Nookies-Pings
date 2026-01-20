import {
  SlashCommandBuilder,
  ChannelType,
  ApplicationCommandType,
  SlashCommandSubcommandBuilder,
  ApplicationCommandOptionType,
} from "discord.js";
import { updateInteraction } from "./";
import fs from "node:fs";

const getMonitors = async () => {
  try {
    const monitors: Monitor[] = [];
    const monitorFolders = fs
      .readdirSync("monitors", { withFileTypes: true })
      .filter((f) => f.isDirectory())
      .map((f) => f.name);

    for (const monitorFolder of monitorFolders) {
      const configPath = `${process.cwd()}/monitors/${monitorFolder}/config.ts`;
      const { group, output } = await import(configPath);
      monitors.push({ group, output });
    }
    return monitors;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

class CustomCommandBuilder extends SlashCommandBuilder {
  addMonitors(monitors?: Monitor[]) {
    for (const monitor of monitors || []) {
      monitor.group.options.forEach((s: SlashCommandSubcommandBuilder) =>
        s
          .addChannelOption((o) =>
            o
              .setName("channel")
              .setDescription("Notification Channel")
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText),
          )
          .addRoleOption((o) =>
            o
              .setName("role")
              .setDescription("Notification Role")
              .setRequired(true),
          )
          .addStringOption((o) =>
            o.setName("cron").setDescription("Custom cron pattern"),
          ),
      );
      this.addSubcommandGroup(monitor.group);
    }
    return this;
  }
}

const pop = (opts: any[], name: string) => {
  const option = opts.findIndex((o) => o.name === name);
  if (option === -1) return undefined;
  return opts.splice(
    opts.findIndex((o) => o.name === name),
    1,
  )[0]?.value;
};

export default {
  name: "monitor",
  data: async () =>
    new CustomCommandBuilder()
      .setName("monitor")
      .setDescription("Monitor a website")
      .addMonitors(await getMonitors()),

  execute: async (interaction, env) => {
    if (interaction.data.type !== ApplicationCommandType.ChatInput) return;
    const cmd = interaction.data.options?.[0]!;
    if (cmd.type !== ApplicationCommandOptionType.SubcommandGroup) return;

    const options = cmd.options?.[0]?.options || [];

    const input: MonitorInput = {
      store: cmd.name,
      method: cmd.options?.[0]?.name!,
      channel: pop(options, "channel") as string,
      role: pop(options, "role") as string,
      cron: (pop(options, "cron") as string) || "*/1 * * * *",
      custom: Object.fromEntries(options.map((o) => [o.name, o.value])),
    };

    const result = await env.DB.prepare(
      `INSERT INTO jobs (store, method, channel, role, cron, custom, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(store, method, custom) DO UPDATE SET
         channel = excluded.channel,
         role = excluded.role,
         cron = excluded.cron,
         updated_at = excluded.updated_at
       RETURNING *`,
    )
      .bind(
        input.store,
        input.method,
        input.channel,
        input.role,
        input.cron,
        JSON.stringify(input.custom),
        Math.floor(Date.now() / 1000),
      )
      .first();

    await updateInteraction(interaction, env, {
      content: JSON.stringify(result, null, 2),
    });
    await env.DO.getByName(":3").broadcast(result);
  },
} satisfies Command;
