import { Result } from "better-result";
import { Cron, scheduledJobs } from "croner";
import { eq, and } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import PQueue from "p-queue";

import { Database } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stores } from "@/monitor/stores";

import { table } from "./drizzle/schema";

const log = logger.child({ module: "Scheduler" });

export class Scheduler {
  db: Database;
  queue: PQueue;

  constructor() {
    this.db = new Database();
    this.queue = new PQueue({ concurrency: 5 })
      .on("completed", (result) => {
        if (result.isOk()) {
          log.info({ result }, "Task completed");
        } else {
          log.error({ result }, "Task failed");
        }
      })
      .on("error", (error) => {
        const logs = (error as any)?.logs;
        log.error({ error, logs }, "Task error");
      });
  }

  async init() {
    log.info("Init");

    const dbResult = await this.db.init();
    if (dbResult.isErr()) {
      return dbResult;
    }

    for (const store of stores) {
      for (const monitor of store.monitors) {
        new Cron(
          monitor.config.cron,
          { name: `${store.name}-${monitor.config.type}` },
          async () => {
            const rows = await this.db.local
              .select({ id: table.id })
              .from(table)
              .where(
                and(eq(table.store, monitor.config.store), eq(table.type, monitor.config.type)),
              );

            const jobs = monitor.customJobCreator
              ? monitor.customJobCreator(rows)
              : rows.map(({ id }) => ({ id, run: monitor.run }));

            jobs.forEach((job) => this.addJob(job));
          },
        );
      }
    }
    return Result.ok(void 0);
  }

  async addJob(job: MonitorJob) {
    await Result.tryPromise(() =>
      this.queue.add(async () => {
        const prev = this.db.local.select().from(table).where(eq(table.id, job.id)).get()!;
        await job.run(prev, job.id);
      }),
    );
  }
}
