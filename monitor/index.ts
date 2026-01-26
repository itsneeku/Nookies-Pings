import { Result } from "better-result";
import WebSocket from "ws";

import { Database } from "@/monitor/db";
import { Scheduler } from "@/monitor/scheduler";
import { stores } from "@/monitor/stores";

console.log("[Monitor] Start");

const db = new Database();
const scheduler = new Scheduler(db);

await db.init();
await scheduler.init();

new WebSocket(process.env.WORKER_URL)
  .on("open", () => {
    console.log("[Monitor] WebSocket connection opened");
  })
  .on("close", () => {
    console.log("[Monitor] WebSocket connection closed");
  })
  .on("message", async (data: Buffer) => {
    const payloadResult = Result.try({
      try: () => JSON.parse(data.toString()) as WebSocketPayload,
      catch: (e) => ({ op: "[Monitor] parse WebSocket message", cause: e }),
    });
    if (payloadResult.isErr())
      return console.error("[Monitor] Error parsing WebSocket message:", payloadResult.error);

    const payload = payloadResult.value;

    console.log(`[Monitor] Received message: ${JSON.stringify(payload)}`);

    const store = stores.find((s) => s.name === payload.store);
    const monitor = store?.monitors.find((m) => m.name === payload.monitor);

    if (!store || !monitor)
      return console.log(`[Monitor] Unknown monitor: ${payload.store}.${payload.monitor}`);

    for (const row of payload.message) {
      await db.local.insert(monitor.table).values(row as (typeof monitor.table)["$inferInsert"]);

      const tableMap = scheduler.jobsByIdByTableMap.get(monitor.table._.name);
      if (!tableMap) continue;

      if (!tableMap.get(row.id as number))
        tableMap.set(row.id as number, monitor.createJob(db, row.id as number, scheduler.queue));
    }
  });
