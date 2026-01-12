import { Job } from "bullmq";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

declare global {
  type JobType = "product" | "search";

  interface MonitorJobData {
    store: string;
    method: JobType;
    sku: string;
    cron: string;
    maxPrice?: number;
    channelId: string;
    roleId: string;
    previousResult?: ScrapedProduct;
  }

  interface ScrapedProduct {
    sku: string;
    url: string;
    title: string;
    inStock: boolean;
    price?: number;
    image?: string;
  }

  interface Command {
    data:
      | SlashCommandBuilder
      | SlashCommandSubcommandsOnlyBuilder
      | SlashCommandOptionsOnlyBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }
}
