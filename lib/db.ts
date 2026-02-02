import { Result } from "better-result";
import { Database as BunDatabase } from "bun:sqlite";
import Cloudflare from "cloudflare";
import { pushSQLiteSchema } from "drizzle-kit/api";
import { type InferInsertModel } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";

import { uniqueUpsertConfig } from "@/lib/drizzle/helpers";
import * as schema from "@/lib/drizzle/schema";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "Database" });

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

  async init() {
    return Result.gen(async function* () {
      yield* Result.await(
        Result.tryPromise(async () => {
          const schemaResult = await pushSQLiteSchema(schema, this.local as any);
          await schemaResult.apply();
        }),
      );

      const remote = await this.remote.select().from(schema.table).all();
      yield* Result.try(() => this.local.insert(schema.table).values(remote));

      return Result.ok(void 0);
    }, this);
  }

  async syncLocal(rows: InferInsertModel<typeof schema.table>[]) {
    log.info("Syncing Local");

    const result = await Result.tryPromise(() =>
      this.local.insert(schema.table).values(rows).onConflictDoUpdate(uniqueUpsertConfig),
    );
    if (result.isErr()) log.error({ error: result.error }, "Failed to sync to local");

    log.info("Sync complete");
  }

  // async upsert<T extends SQLiteTableWithColumns<any>>(table: T, rows: InferInsertModel<T>[]) {
  async upsert(rows: InferInsertModel<typeof schema.table>[]) {
    log.info("Upserting Local");

    const localinsertResult = await Result.tryPromise(() =>
      this.local.insert(schema.table).values(rows).onConflictDoUpdate(uniqueUpsertConfig),
    );
    if (localinsertResult.isErr())
      log.error({ error: localinsertResult.error }, "Failed to upsert to local");

    log.info("Upserting Remote");

    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const remoteResult = await Result.tryPromise(() =>
        this.remote
          .insert(schema.table)
          .values(chunk)
          .onConflictDoUpdate(uniqueUpsertConfig)
          .returning(),
      );
      if (remoteResult.isErr())
        log.error({ error: remoteResult.error }, "Failed to upsert to remote");
    }

    log.info("Upsert complete");
  }
}
