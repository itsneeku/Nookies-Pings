import { Database as BunDatabase } from "bun:sqlite";
import Cloudflare from "cloudflare";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";

import * as schema from "@/lib/drizzle/schema";
import { stores } from "@/monitor/stores";

export class Database {
  local: ReturnType<typeof drizzle<typeof schema>>;
  remote: ReturnType<typeof drizzleProxy<typeof schema>>;

  constructor() {
    const db = new BunDatabase(":memory:");
    const { CF_TOKEN, CF_ACC_ID, CF_DB_ID } = process.env;

    const cf = new Cloudflare({ apiToken: CF_TOKEN });
    this.local = drizzle(db, { schema });
    this.remote = drizzleProxy(
      async (sql, params) => {
        const result = await cf.d1.database.raw(CF_DB_ID, {
          account_id: CF_ACC_ID,
          sql,
          params,
        });

        const rows = result.result?.[0]?.results?.rows ?? [];
        return { rows };
      },
      async (batch) => {
        const result = await cf.d1.database.raw(CF_DB_ID, {
          account_id: CF_ACC_ID,
          batch: batch.map((query) => ({
            sql: query.sql,
            params: query.params,
          })),
        });

        return result.result?.map((r) => ({ rows: r.results?.rows ?? [] })) ?? [];
      },
      { schema },
    );
  }

  private async createTables() {
    console.log("[Database] createTables");
    const result = await pushSQLiteSchema(schema, this.local as any);
    await result.apply();
    console.log("[Database] createTables OK");
  }

  async init() {
    await this.createTables();
    await this.syncFromRemote();
  }

  async syncFromRemote() {
    console.log("[Database] syncFromRemote");
    for (const table of stores.map((s) => s.monitors.map((m) => m.table)).flat()) {
      const rows = await this.remote.select().from(table);
      await this.local.insert(table).values(rows).onConflictDoUpdate({
        target: table.id,
        set: rows,
      });
    }
    console.log("[Database] syncFromRemote OK");
  }

  async upsert<T extends SQLiteTableWithColumns<any>>(table: T, rows: InferInsertModel<T>[]) {
    await this.local.insert(table).values(rows);
    return await this.remote.insert(table).values(rows).returning();
  }
}
