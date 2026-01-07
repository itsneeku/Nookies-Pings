import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MonitorForm } from "./form.ts";

const data = new SlashCommandBuilder()
  .setName("monitor")
  .setDescription("Start monitoring a product page");

const execute = async (interaction: ChatInputCommandInteraction) => {
  new MonitorForm().start(interaction);
};

export const monitor: Command = { data, execute };
