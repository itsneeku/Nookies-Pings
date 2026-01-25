import { Result } from "better-result";
import WebSocket from "ws";

import { ParseError, EnvValidationError } from "@/lib/errors";

import { Database } from "./db";
import { Scheduler } from "./scheduler";

console.log("[Runner] Starting...");

const db = new Database();
const scheduler = new Scheduler(db);

const loadAllResult = await db.loadAll();
if (loadAllResult.isErr()) {
  console.error("[Runner] Failed to load database:", loadAllResult.error);
  process.exit(1);
}

await scheduler.load();

console.log(scheduler.jobs);

console.log("[Runner] Connecting to WebSocket...");

const workerUrlResult = Result.try(() => {
  const workerUrl = process.env.WORKER_URL;
  if (!workerUrl) {
    throw new EnvValidationError({ variable: "WORKER_URL" });
  }
  return workerUrl;
});

if (workerUrlResult.isErr()) {
  console.error("[Runner] Configuration error:", workerUrlResult.error);
  process.exit(1);
}

const ws = new WebSocket(workerUrlResult.unwrap());

ws.on("open", () => {
  console.log("[Runner] Connected to worker");
});

ws.on("message", async (data: Buffer) => {
  const result = await Result.gen(async function* () {
    const payload = yield* Result.await(
      Result.tryPromise({
        try: async () => JSON.parse(data.toString()) as WebSocketPayload,
        catch: (cause) =>
          new ParseError({
            source: "WebSocket message",
            cause,
          }),
      }),
    );

    console.log(`[Runner] Received message: ${JSON.stringify(payload)}`);

    if (payload.store && payload.monitor && payload.message) {
      for (const row of payload.message) {
        yield* Result.await(db.upsertRow(payload.store, payload.monitor, row, true));
      }
      await scheduler.reschedule(payload.store, payload.monitor);
    }
    return Result.ok(void 0);
  });

  if (result.isErr()) {
    console.error("[Runner] Error handling WebSocket message:", result.error);
  }
});

ws.on("error", (e: Error) => {
  console.error("[Runner] WebSocket error:", e);
});
