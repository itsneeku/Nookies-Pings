import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { buildMonitorContainer } from "./builders.ts";
import { handleInteraction } from "./handlers.ts";

const data = new SlashCommandBuilder()
  .setName("monitor")
  .setDescription("Start monitoring a product page");

async function execute(interaction: ChatInputCommandInteraction) {
  const state: ScrapeJobForm = {};

  const reply = await interaction.reply({
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    components: [buildMonitorContainer(state)],
    withResponse: true,
  });

  const container = reply.resource?.message as Message;

  const collector = container?.createMessageComponentCollector({
    filter: (i) => i.user.id === interaction.user.id,
    time: 15 * 60 * 1000,
  });

  collector?.on("collect", async (i) => {
    const result = await handleInteraction({ i, state } as FormInteraction);
    if (result.isErr()) {
      console.error(
        "[Bot] Error collecting /monitor interaction:",
        result.error,
      );
    }
  });
}

export const monitor = { data, execute };
