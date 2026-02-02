import { Result } from "better-result";
import {
  type APIApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandNumberOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { drizzle } from "drizzle-orm/d1";

import { uniqueUpsertConfig } from "@/lib/drizzle/helpers";
import { table } from "@/lib/drizzle/schema";
import { stores } from "@/monitor/stores";

const command = new SlashCommandBuilder()
  .setName("monitor")
  .setDescription("Monitor a website")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

// Subcommand groups for each store
for (const store of stores) {
  const group = new SlashCommandSubcommandGroupBuilder()
    .setName(store.name)
    .setDescription(store.description);

  // Subcommands for each monitor in the store
  for (const monitor of Object.values(store.monitors)) {
    const subcommand = new SlashCommandSubcommandBuilder()
      .setName(monitor.config.type)
      .setDescription(monitor.config.description);

    // Custom input options
    for (const [inputName, inputConfig] of Object.entries(monitor.config.input)) {
      const option =
        inputConfig.type === "string"
          ? new SlashCommandStringOption()
          : inputConfig.type === "number"
            ? new SlashCommandNumberOption()
            : undefined;

      if (!option) continue;

      option
        .setName(inputName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase())
        .setDescription(inputConfig.description)
        .setRequired(!!inputConfig.required);

      subcommand.options.push(option);
    }

    // Default output options
    subcommand
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Notification Channel")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText),
      )
      .addRoleOption((option) =>
        option.setName("role").setDescription("Notification Role").setRequired(true),
      );

    group.addSubcommand(subcommand);
  }

  command.addSubcommandGroup(group);
}

const execute = async (interaction: APIApplicationCommandInteraction, env: Env) => {
  const cmd =
    interaction.data.type === ApplicationCommandType.ChatInput
      ? interaction.data.options?.[0]
      : undefined;
  const subcommand =
    cmd?.type === ApplicationCommandOptionType.SubcommandGroup ? cmd.options?.[0] : undefined;
  if (!subcommand) return Result.err("Unknown subcommand");

  const store = stores.find((m) => m.name === cmd?.name);
  const monitor = store?.monitors.find((m) => m.config.type === subcommand.name);
  if (!store || !monitor) return Result.err("Monitor not found");

  const options = Object.fromEntries((subcommand.options || []).map((o: any) => [o.name, o.value]));

  const channel = options.channel;
  const role = options.role;
  const input = Object.fromEntries(
    Object.entries(options)
      .map(([key, value]) => [
        key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()),
        value,
      ])
      .filter(([key]) => Object.keys(monitor.config.input).includes(key as string)),
  );
  const inputUnique = Object.fromEntries(
    Object.entries(input).filter(([key, _]) => monitor.config.input[key]?.unique),
  );

  const row = {
    store: monitor.config.store,
    type: monitor.config.type,
    input,
    inputUnique,
    channel,
    role,
    active: 1,
  };

  const result = await drizzle(env.DB)
    .insert(table)
    .values(row)
    .onConflictDoUpdate(uniqueUpsertConfig)
    .returning();

  await env.DO.getByName(env.WS_SERVER_ID).broadcast({
    store: store.name,
    monitor: monitor.config.type,
    message: result,
  });

  return Result.ok("Monitor created/updated successfully");
};

export default { command, execute };
