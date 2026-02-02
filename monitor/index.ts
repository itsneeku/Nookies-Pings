import WebSocket from "ws";

import { Scheduler } from "@/lib/scheduler";

const scheduler = new Scheduler();
await scheduler.init();

new WebSocket(`${process.env.WORKER_URL}?token=${process.env.WS_SECRET}`);

// .on("message", async (data: Buffer) => {
//   const payloadResult = Result.try({
//     try: () => JSON.parse(data.toString()) as WebSocketPayload,
//     catch: (e) => ({ op: "[Monitor] parse WebSocket message", cause: e }),
//   });
//   if (payloadResult.isErr())
//     return log.error({ error: payloadResult.error }, "Error parsing WebSocket message");

//   const payload = payloadResult.value;

//   log.debug({ payload }, "Received message");

//   const store = stores.find((s) => s.name === payload.store);
//   const monitor = store?.monitors.find((m) => m.name === payload.monitor);

//   if (!store || !monitor)
//     return log.warn({ store: payload.store, monitor: payload.monitor }, "Unknown monitor");

//   for (const row of payload.message) {
//     const insertResult = await Result.tryPromise({
//       try: () =>
//         db.local.insert(monitor.table).values(row as (typeof monitor.table)["$inferInsert"]),
//       catch: (cause) => ({ op: "[Monitor] insert row", cause }),
//     });
//     if (insertResult.isErr()) {
//       log.error({ error: insertResult.error }, "Failed to insert row");
//       continue;
//     }

//     const tableMap = scheduler.jobsByIdByTableMap.get(monitor.table._.name);
//     if (!tableMap) continue;

//     if (!tableMap.get(row.id as number)) {
//       const job = new Cron(monitor.cron, () => {
//         void scheduler.queue.add(async () => {
//           if (monitor.run) {
//             return await monitor.run(db, row.id as number);
//           }
//         });
//       });
//       tableMap.set(row.id as number, job);
//     }
//   }
// });
