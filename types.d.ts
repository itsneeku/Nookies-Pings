import { Job } from "bullmq";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  APIInteractionResponse,
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionData,
} from "discord.js";

declare global {
  type JobType = "product" | "search";

  interface MonitorJobTableRow extends MonitorJobData {
    id: number;
    updated_at: number;
    previousResult: string | null; // TODO always string, even in MonitorJobData. Parse when required.
  }

  interface MonitorJobData {
    store: string;
    method: JobType;
    sku: string;
    cron: string;
    maxPrice: number;
    channelId: string;
    roleId: string;
    previousResult: ScrapedProduct | null;
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
    execute: (data: APIApplicationCommandInteraction, env: Env) => Promise<any>;
  }
}
