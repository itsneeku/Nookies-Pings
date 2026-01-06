import { Job } from "bullmq";
import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  SlashCommandBuilder,
  Snowflake,
} from "discord.js";

declare global {
  interface FormInteraction {
    i: MessageComponentInteraction;
    state: ScrapeJobForm;
  }

  interface ScrapeJobForm extends Partial<ScrapeJobData> {}

  interface ScrapeJobData {
    url: string;
    module: string;
    channelId: Snowflake;
    roleId: Snowflake;
    cron: string;
    // maxPrice?: number
  }

  interface ResultJobData {
    scrapeJob: Job<ScrapeJobData>;

    name: string;
    url: string;
    sku: string;
    inStock: boolean;

    price?: number;
    img?: string;
  }

  interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }
}
