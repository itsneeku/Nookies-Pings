import { Cron } from "croner";
import PQueue from "p-queue";

import { stores } from "@/monitor/stores";

import { Database } from "./db";

export class Scheduler {
  jobs: Map<string, Cron>;
  db: Database;
  queue: PQueue;

  constructor(db: Database) {
    this.db = db;
    this.jobs = new Map();
    this.queue = new PQueue({ concurrency: 5 });
  }

  async load() {
    console.log("[Scheduler] Loading jobs...");

    for (const monitor of stores) {
      for (const [_methodName, method] of Object.entries(monitor.monitors)) {
        if (method.createJobs) {
          await method.createJobs(this.db, this.jobs, this.queue);
        }
      }
    }

    console.log(`[Scheduler] Loaded ${this.jobs.size} cron jobs`);
  }

  async reschedule(store: string, method: string) {
    console.log(`[Scheduler] Rescheduling ${store}.${method}...`);

    const monitor = stores.find((m) => m.store === store);
    const methodObj = monitor?.monitors[method];

    if (!methodObj) {
      console.error(`[Scheduler] Unknown method: ${store}.${method}`);
      return;
    }

    const tableKey = `${store}_${method}`;

    for (const [key, job] of this.jobs.entries()) {
      if (key.startsWith(`${tableKey}_`)) {
        job.stop();
        this.jobs.delete(key);
      }
    }

    if (methodObj.createJobs) {
      await methodObj.createJobs(this.db, this.jobs, this.queue);
    }

    console.log(`[Scheduler] Rescheduled ${store}.${method}`);
  }

  stop() {
    console.log("[Scheduler] Stopping all jobs and clearing queue...");
    this.queue.pause();
    this.queue.clear();
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();
    console.log("[Scheduler] All jobs stopped");
  }
}
