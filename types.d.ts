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
import { SQLiteTableWithColumns as sqliteTable } from "drizzle-orm/sqlite-core";
import PQueue from "p-queue";

import * as schema from "@/lib/drizzle/schema";
import { Database } from "@/monitor/db";

declare global {
  interface Store {
    name: string;
    description: string;
    monitors: Monitor[];
  }

  interface Monitor {
    cron: string;
    name: string;
    table: SQLiteTableWithColumns;
    subcommand: MonitorSubcommand;
    initJobs: JobsInitializer;
    createJob: JobCreator;
  }

  interface MonitorSubcommand {
    data: SlashCommandSubcommandBuilder;
    handler: (
      options: {
        [k: string]: string | number | boolean;
      },
      env: Env,
    ) => Promise<any[]>;
  }

  type JobsInitializer = (
    db: Database,
    jobs: Map<string, Map<number, Cron>>,
    queue: PQueue,
  ) => Promise<void>;

  type JobCreator = (db: Database, rowId: number, queue: PQueue) => Cron;

  interface NotificationProduct {
    title: string;
    sku: string;
    url: string;
    price: number;
    image: string;
    channel: string;
    role: string;
  }

  type CommandExecutor = (
    data: APIApplicationCommandInteraction,
    env: Env,
  ) => Promise<APIInteractionResponse | void>;

  interface WebSocketPayload {
    store: string;
    monitor: string;
    message: any[];
  }

  interface JobData {
    store: string;
    monitor: string;
    [key: string]: unknown;
  }
}
