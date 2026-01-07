import { Job } from "bullmq";
import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  SelectMenuComponentOptionData,
  SlashCommandBuilder,
  Snowflake,
} from "discord.js";

declare global {
  interface FormInteraction {
    i: MessageComponentInteraction;
    state: ScrapeJobForm;
  }

  interface ScrapeJobForm extends Partial<ScrapeJobData> {
    customSchedules: SelectMenuComponentOptionData[];
    loading?: boolean;
  }

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
    data: any;
  }

  interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }

  interface ScrapingModule {
    config: any;
    output: any;
  }
}
