import { Result } from "better-result";
import { Cron } from "croner";
import {
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataBasicOption,
  InteractionType,
  APIInteractionResponse,
} from "discord.js";
import { D1Result, SQLiteTableWithColumns } from "drizzle-orm/d1";
import PQueue from "p-queue";

import { DatabaseError, DiscordError } from "@/lib/errors";
import { Database } from "@/monitor/db";

declare global {
  interface Store {
    store: string;
    description: string;
    monitors: StoreMonitorsMap;
  }

  interface StoreMonitorsMap {
    [key: string]: Monitor;
  }

  interface Monitor {
    cron: string;
    name: string;
    table: SQLiteTableWithColumns<any>;
    subcommand: MonitorSubcommand;
    createJobs?: JobCreator;
  }

  type JobCreator = (db: Database, jobs: Map<string, Cron>, queue: PQueue) => Promise<void>;

  interface MonitorSubcommand {
    data: SlashCommandSubcommandBuilder;
    handler: (
      options: {
        [k: string]: string | number | boolean;
      },
      env: Env,
    ) => Promise<TableRow[]>;
  }

  interface Product {
    sku: string;
    url: string;
    title: string;
    inStock: boolean;
    price?: number;
    image?: string;
  }

  interface ProductMonitorResult {
    products: Product[];
  }

  interface SearchMonitorResult {
    newProducts: Product[];
  }

  type CommandExecutor = (
    data: APIApplicationCommandInteraction,
    env: Env,
  ) => Promise<APIInteractionResponse | void>;

  interface WebSocketPayload {
    store: string;
    monitor: string;
    message: TableRow[];
  }

  interface JobData {
    store: string;
    monitor: string;
    sku?: string;
    url?: string;
    products?: unknown[];
    [key: string]: unknown;
  }

  interface PythonScriptResult {
    products?: Product[];
    newProducts?: Product[];
    internal_sku?: string;
    [key: string]: unknown;
  }

  interface TableRow {
    id: number;
    [key: string]: unknown;
  }

  interface ProductJob {
    channel: string;
    role: string;
    sku?: string;
    url?: string;
    active?: number;
  }

  interface SearchJob {
    channel: string;
    role: string;
    url: string;
  }

  interface ProductRow extends TableRow {
    sku?: string;
    url?: string;
    title?: string;
    inStock?: number;
    price?: number;
    image?: string;
    active?: number;
  }

  interface SearchRow extends TableRow {
    url?: string;
  }
}
