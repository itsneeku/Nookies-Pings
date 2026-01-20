import { Job } from "bullmq";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  APIInteractionResponse,
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteractionData,
  SlashCommandStringOption,
  SlashCommandSubcommandGroupBuilder,
  APIApplicationCommandInteractionDataSubcommandGroupOption,
} from "discord.js";

declare global {
  interface Monitor {
    group: SlashCommandSubcommandGroupBuilder;
    output: any;
  }

  interface MonitorJobTableRow extends MonitorInput {
    id: number;
    previousResult: ScrapedProduct | null;
    updated_at: number;
  }

  interface MonitorInput {
    store: string;
    method: string;
    channel: string;
    role: string;
    cron: string;
    custom: {
      [key: string]: any;
    };
  }

  interface ScrapedProduct {
    sku: string;
    url: string;
    title: string;
    inStock: boolean;
    price?: number;
    image?: string;
    shouldNotify?: boolean;
  }

  interface Command {
    name: string;
    data: () => Promise<SlashCommandBuilder>;
    // | SlashCommandSubcommandsOnlyBuilder
    // | SlashCommandOptionsOnlyBuilder;
    execute: (data: APIApplicationCommandInteraction, env: Env) => Promise<any>;
  }
}
