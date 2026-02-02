import { Result } from "better-result";
import {
  SlashCommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandBuilder,
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataBasicOption,
  InteractionType,
  APIInteractionResponse,
  type APIMessage,
} from "discord.js";
import { InferSelectModel } from "drizzle-orm";
import { SQLiteTableWithColumns } from "drizzle-orm/d1";
import {
  SQLiteTableWithColumns as sqliteTable,
  type InferInsertModel,
} from "drizzle-orm/sqlite-core";

import type { ScheduledJob, Scheduler } from "@/lib/scheduler";

import { Database } from "@/lib/db";
import * as schema from "@/lib/drizzle/schema";

declare global {
  interface Store {
    name: string;
    description: string;
    monitors: Monitor[];
  }

  interface Monitor {
    config: MonitorConfig;
    run: MonitorRunner;
    customJobCreator?: MonitorJobCreator;
  }

  interface MonitorConfig {
    store: string;
    type: string;
    description: string;
    cron: string;
    input: MonitorInput;
  }

  interface MonitorInput {
    [key: string]: {
      description: string;
      type: "string" | "number";
      unique?: boolean;
      required?: boolean;
    };
  }

  type MonitorRunner = (prevData: any, input: any) => Promise<Result<MonitorRunOk, PyRunError>>;

  type MonitorJobCreator = (rows: { id: number }[]) => MonitorJob[];

  type MonitorJob = { id: number; run: MonitorRunner };

  interface MonitorRunOk {
    notify: boolean;
    data: any;
  }

  interface PyRunError {
    output?: string;
    logs?: string;
    exitCode?: number;
    error?: unknown;
  }

  // interface MonitorSubcommand {
  //   data: SlashCommandSubcommandBuilder;
  //   handler: (
  //     options: {
  //       [k: string]: string | number | boolean;
  //     },
  //     env: Env,
  //   ) => Promise<InferInsertModel<SQLiteTableWithColumns<any>>[]>;
  // }

  // type JobsInitializer = (scheduler: Scheduler) => Promise<void>;

  // type JobCreator = (scheduler: Scheduler, rowId: number) => ScheduledJob;

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
    message: InferSelectModel<typeof schema.table>[];
  }

  interface PyInput {
    store: string;
    type: string;
    [key: string]: unknown;
  }
}
