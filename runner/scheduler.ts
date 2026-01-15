import { Cloudflare } from "cloudflare";
import { Cron } from "croner";
import PQueue from "p-queue";
import { fetchJobs, updateJobResult } from "./d1";
import { pyScrape } from "./py";

import { notify } from "./discord";
export class JobScheduler {
  private jobs = new Map<number, Cron>();
  private queue = new PQueue({ concurrency: 10 });
  private ws: WebSocket;

  constructor(private cfClient: Cloudflare) {
    this.ws = new WebSocket(process.env.WORKER_URL!);
    this.ws.onopen = () => console.log("[Scheduler] Connected");
    this.ws.onmessage = (e) => this.handleMessage(e.data);
    this.ws.onerror = (err) => console.error("[Scheduler] WS error:", err);
  }

  async load() {
    const jobs = await fetchJobs(this.cfClient);
    jobs.forEach((job) => this.schedule(job));
    console.log(`[Scheduler] Loaded ${jobs.length} jobs`);
  }

  schedule(job: MonitorJobTableRow) {
    this.unschedule(job.id);
    this.execute(job); // run right away
    this.jobs.set(job.id, new Cron(job.cron, () => this.execute(job)));
  }

  unschedule(id: number) {
    this.jobs.get(id)?.stop();
    this.jobs.delete(id);
  }

  private handleMessage(data: string) {
    try {
      const job = JSON.parse(data);
      if (job.store) this.schedule(job);
    } catch (e) {
      console.error("[Scheduler] Message parse error:", e);
    }
  }

  private async execute(job: MonitorJobTableRow) {
    try {
      console.log("Executing Job", job.id);
      const result = await this.queue.add(() => pyScrape(job));
      console.log("Result for Job", job.id, result);
      if (
        this.shouldNotify(
          job,
          result,
          job.previousResult ? JSON.parse(job.previousResult) : null
        )
      ) {
        console.log(`Job ${job.id} - Change detected, sending notification`);
        notify(job, result);
      }

      await updateJobResult(this.cfClient, job.id, result);
    } catch (e) {
      console.error(`[Job ${job.id}] Error:`, e);
    }
  }

  private shouldNotify(
    job: MonitorJobTableRow,
    curr: ScrapedProduct,
    prev: ScrapedProduct | null
  ) {
    if (!curr.inStock || !curr.price) return false;
    if (job.maxPrice !== 0 && curr.price < job.maxPrice) return false;
    if (!prev) return true;
    if (prev.price && curr.price < prev.price) return true;
    return false;
  }
}
