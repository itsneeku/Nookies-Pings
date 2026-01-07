import { ConnectionOptions, Queue } from "bullmq";
import { mkSafe } from "$utils/safe.ts";

export const connection: ConnectionOptions = {
  url: Deno.env.get("REDIS_URL")!,
};

export const scrapingQueue = new Queue<ScrapeJobData>(`scraping`, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  },
});

export const resultsQueue = new Queue<ResultJobData>(`results`, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 100, age: 24 * 60 * 60 },
  },
});

export const addScrapingJob = (
  data: ScrapeJobData,
) => mkSafe(scrapingQueue, "add")("scrape", data);

export const addResultJob = (
  data: ResultJobData,
) => mkSafe(resultsQueue, "add")("result", data);
