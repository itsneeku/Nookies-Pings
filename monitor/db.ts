import { Result } from "better-result";
import Cloudflare from "cloudflare";
import { eq } from "drizzle-orm";
import { drizzle, type AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";

import { DatabaseError } from "@/lib/errors";
import { stores } from "@/monitor/stores";

const { CF_TOKEN, CF_ACC_ID, CF_DB_ID } = process.env;

const client = new Cloudflare({
  apiToken: CF_TOKEN,
});

const d1Callback: AsyncRemoteCallback = async (sql, _params, _method) => {
  const queryResult = await client.d1.database.query(CF_DB_ID!, {
    account_id: CF_ACC_ID!,
    sql,
  });

  const firstResult = queryResult.result?.[0];
  return { rows: firstResult?.results ?? [] };
};

export class Database {
  private db;
  maps: Record<string, Map<number, TableRow>>;

  constructor() {
    this.maps = {};
    this.db = drizzle(async (sql, params, method) => {
      const result = await Result.tryPromise({
        try: () => d1Callback(sql, params, method),
        catch: (cause) =>
          cause instanceof DatabaseError ? cause : new DatabaseError({ operation: "query", cause }),
      });
      return result.unwrap();
    });
  }

  private tableKey(store: string, monitor: string) {
    return `${store}_${monitor}`;
  }

  private tableConfig(store: string, monitor: string) {
    return stores.find((m) => m.store === store)?.monitors[monitor] ?? null;
  }

  async loadAll() {
    return Result.tryPromise({
      try: async () => {
        const queries: { key: string; query: any }[] = [];

        for (const store of stores) {
          for (const monitor of Object.values(store.monitors)) {
            const key = this.tableKey(store.store, monitor.name);
            const table = monitor.table;
            if (table) queries.push({ key, query: this.db.select().from(table) });
          }
        }

        if (queries.length === 0) {
          console.log("[Database] No tables to load");
          return;
        }

        const results = await this.db.batch(queries.map((q) => q.query) as any);
        results.forEach((rows: TableRow[], i: number) => {
          const { key } = queries[i]!;
          this.maps[key] = new Map(rows.map((r) => [r.id, r]));
          console.log(`[Database] Loaded ${rows.length} rows for ${key}`);
        });
      },
      catch: (cause: unknown) => new DatabaseError({ operation: "loadAll", cause }),
    });
  }

  getData(store: string, monitor: string) {
    const map = this.maps[this.tableKey(store, monitor)];
    return map ? Array.from(map.values()) : [];
  }

  getRow(store: string, monitor: string, id: number) {
    return this.maps[this.tableKey(store, monitor)]?.get(id);
  }

  async upsertRow(store: string, monitor: string, data: TableRow, skipDatabase: boolean = false) {
    const { id, ...updateData } = data;
    const table = this.tableConfig(store, monitor)?.table;
    const map = this.maps[this.tableKey(store, monitor)];

    if (!map || !table) return Result.ok(void 0);

    return Result.tryPromise({
      try: async () => {
        if (!skipDatabase) {
          if (id !== undefined && map.has(id)) {
            await this.db.update(table).set(updateData).where(eq(table.id, id));
          } else if (id !== undefined) {
            await this.db.insert(table).values({ ...updateData, id });
          }
        }

        if (id !== undefined) {
          if (map.has(id)) {
            const existing = map.get(id);
            if (existing) Object.assign(existing, updateData);
          } else {
            map.set(id, { ...updateData, id });
          }
        }
      },
      catch: (cause: unknown) => new DatabaseError({ operation: "upsertRow", cause }),
    });
  }

  async insertRow(store: string, monitor: string, data: Omit<TableRow, "id">) {
    const table = this.tableConfig(store, monitor)?.table;
    const map = this.maps[this.tableKey(store, monitor)];
    if (!map || !table) return Result.ok(undefined);

    return Result.tryPromise({
      try: async () => {
        const result = await this.db.insert(table).values(data).returning().get();
        if (result?.id !== undefined) map.set(result.id, result);
        return result as TableRow;
      },
      catch: (cause: unknown) => new DatabaseError({ operation: "insertRow", cause }),
    });
  }

  async exists(table: string, where: Record<string, unknown>) {
    const map = this.maps[table];
    if (!map) return Result.ok(false);

    const matches = Array.from(map.values()).some((row) =>
      Object.entries(where).every(([key, value]) => row[key] === value),
    );

    return Result.ok(matches);
  }
}
