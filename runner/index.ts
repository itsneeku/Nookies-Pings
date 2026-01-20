import { deployCommands } from "../commands";
import { Cron } from "croner";
import PQueue from "p-queue";
import { pyScrape } from "./py";
import { notify } from "./discord";
import { Database } from "./db";

const jobs = new Map<number, Cron>();
const queue = new PQueue({ concurrency: 10 });
const ws = new WebSocket(process.env.WORKER_URL);
const db = new Database(
  process.env.CF_DB_ID,
  process.env.CF_ACC_ID,
  process.env.CF_TOKEN,
);

ws.onopen = () => console.log("[Scheduler] WS Connected");
ws.onmessage = (e) => {
  try {
    const job = JSON.parse(e.data);
    if (job.store) schedule(job);
  } catch (e) {
    console.error("[Scheduler] Message parse error:", e);
  }
};
ws.onerror = (err) => console.error("[Scheduler] WS Error:", err);

const schedule = (job: MonitorJobTableRow) => {
  jobs.get(job.id)?.stop();
  jobs.delete(job.id);

  execute(job);

  jobs.set(job.id, new Cron(job.cron, () => execute(job)));
};

const execute = async (job: MonitorJobTableRow) => {
  try {
    console.log("Executing Job", job);
    const result = await queue.add(() => pyScrape(job));
    console.log("Result for Job", job.id, result);
    if (result.shouldNotify) {
      await notify(job, result);
      await db.updateJobResult(job.id, result);
    }
  } catch (e) {
    console.error(`[Job ${job.id}] Error:`, e);
  }
};

await deployCommands();

(await db.fetchJobs()).forEach((job) => schedule(job));
