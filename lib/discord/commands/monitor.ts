import { Result } from "better-result";
import {
  type APIApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

import { DiscordError } from "@/lib/errors";
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
          .setName(store.store)
          .setDescription(store.description),
      ),
    ) as SlashCommandBuilder,
  new SlashCommandBuilder().setName("monitor").setDescription("Monitor a website"),
);

const execute = async (interaction: APIApplicationCommandInteraction, env: Env) => {
  const cmd = interaction.data.type === ApplicationCommandType.ChatInput ? interaction.data.options?.[0] : undefined;
  const subcommand = cmd?.type === ApplicationCommandOptionType.SubcommandGroup ? cmd.options?.[0] : undefined;

  if (!subcommand) {
    return Result.err(
      new DiscordError({
        operation: "execute command",
        cause: "Invalid command structure",
      }),
    );
  }

  const store = stores.find((m) => m.store === cmd?.name);
  const storeMonitor = store?.monitors[subcommand.name];

  if (!store || !storeMonitor) {
    return Result.err(
      new DiscordError({
        operation: "execute command",
        cause: "Monitor not found",
      }),
    );
  }

  const options = Object.fromEntries((subcommand.options || []).map((o: any) => [o.name, o.value]));
  const upsertResult = await storeMonitor.subcommand.handler(options, env);

  await env.DO.getByName(env.WS_SERVER_ID).broadcast({
    store: store.store,
    monitor: storeMonitor.name,
    message: upsertResult,
  });

  return Result.ok("Monitor created/updated successfully");
};

export default { command, execute };
