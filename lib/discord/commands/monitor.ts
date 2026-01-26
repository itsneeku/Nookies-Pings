import { Result } from "better-result";
import {
  type APIApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { stores } from "@/monitor/stores";

const command = stores.reduce(
  (acc, store) =>
    acc.addSubcommandGroup(
      Object.values(store.monitors).reduce(
        (g, monitor) =>
          g.addSubcommand(
            monitor.subcommand.data
              .addChannelOption((o) =>
                o
                  .setName("channel")
                  .setDescription("Notification Channel")
                  .setRequired(true)
                  .addChannelTypes(ChannelType.GuildText),
              )
              .addRoleOption((o) =>
                o.setName("role").setDescription("Notification Role").setRequired(true),
              ),
          ),
        new SlashCommandSubcommandGroupBuilder()
          .setName(store.name)
          .setDescription(store.description),
      ),
    ) as SlashCommandBuilder,
  new SlashCommandBuilder().setName("monitor").setDescription("Monitor a website"),
);

const execute = async (interaction: APIApplicationCommandInteraction, env: Env) => {
  const cmd =
    interaction.data.type === ApplicationCommandType.ChatInput
      ? interaction.data.options?.[0]
      : undefined;
  const subcommand =
    cmd?.type === ApplicationCommandOptionType.SubcommandGroup ? cmd.options?.[0] : undefined;

  if (!subcommand) {
    return Result.err({
      op: "[execute] command structure",
      cause: "Invalid command structure",
    });
  }

  const store = stores.find((m) => m.name === cmd?.name);
  const monitor = store?.monitors.find((m) => m.subcommand.data.name === subcommand.name);

  if (!store || !monitor) {
    return Result.err({
      op: "[execute] find monitor",
      cause: "Monitor not found",
    });
  }

  const options = Object.fromEntries((subcommand.options || []).map((o: any) => [o.name, o.value]));
  const upsertResult = await monitor.subcommand.handler(options, env);

  await env.DO.getByName(env.WS_SERVER_ID).broadcast({
    store: store.name,
    monitor: monitor.name,
    message: upsertResult,
  });

  return Result.ok("Monitor created/updated successfully");
};

export default { command, execute };
