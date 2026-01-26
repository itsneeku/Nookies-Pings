import { Cron } from "croner";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import PQueue from "p-queue";

import { Database } from "@/monitor/db";
import { stores } from "@/monitor/stores";

export class Scheduler {
  jobsByIdByTableMap: Map<string, Map<number, Cron>>;
  db: Database;
  queue: PQueue;

  constructor(db: Database) {
    this.db = db;
    this.jobsByIdByTableMap = new Map();
    this.queue = new PQueue({ concurrency: 5 });
  }

  async init() {
    console.log("[Scheduler] Init");
    for (const store of stores) {
      for (const monitor of store.monitors) {
        const tableMap = new Map<number, Cron>();
        this.jobsByIdByTableMap.set(getTableConfig(monitor.table).name, tableMap);
        await monitor.initJobs(this.db, this.jobsByIdByTableMap, this.queue);
        console.log(`[Scheduler] ${store.name}.${monitor.name} - ${tableMap.size} jobs`);
      }
    }
    console.log("[Scheduler] Init OK");
  }

  // async createJobForRow(row: TableRow, storeName: string, monitorName: string) {
  //   const store = stores.find((s) => s.name === storeName);
  //   const monitor = store?.monitors.find((m) => m.name === monitorName);

  //   if (!store || !monitor) return;

  //   const monitorModule = await import(`@/monitor/stores/${storeName}/${monitorName}`);
  //   if (!monitorModule.createJob) {
  //     console.error(`[Scheduler] createJob not found for ${storeName}.${monitorName}`);
  //     return;
  //   }

  //   monitorModule.createJob(row, this.db, this.jobsByIdByTableMap, this.queue);
  // }

  // async reschedule(store: string, monitor: string) {
  //   console.log(`[Scheduler] Rescheduling ${store}.${monitor}...`);

  //   const storeObj = stores.find((m) => m.name === store);
  //   const monitorObj = storeObj?.monitors[monitor];

  //   if (!monitorObj) {
  //     console.error(`[Scheduler] Unknown monitor: ${store}.${monitor}`);
  //     return;
  //   }

  //   const tableKey = `${store}_${monitor}`;

  //   for (const [key, _monitorMap] of this.jobsMap.entries()) {
  //     if (key.startsWith(`${tableKey}_`)) {
  //       job.stop();
  //       this.jobsMap.delete(key);
  //     }
  //   }

  //   if (monitorObj.createJobs) {
  //     await monitorObj.createJobs(this.db, this.jobsMap, this.queue);
  //   }

  //   console.log(`[Scheduler] Rescheduled ${store}.${monitor}`);
  // }

  // stop() {
  //   console.log("[Scheduler] Stopping all jobs and clearing queue...");
  //   this.queue.pause();
  //   this.queue.clear();
  //   for (const job of this.jobsMap.values()) {
  //     job.stop();
  //   }
  //   this.jobsMap.clear();
  //   console.log("[Scheduler] All jobs stopped");
  // }
}
