import "@std/dotenv/load";
import { Job, Worker } from "bullmq";
import { bot } from "./bot.ts";
import { connection, resultsQueue } from "$utils/queues.ts";
import { mkSafe } from "$utils/safe.ts";

const res = await bot.start();
!res.isOk() && (console.error(res.error), Deno.exit(1));

new Worker(
  resultsQueue.name,
  async (job: Job<ResultJobData>) => {
    // await bot.ping(job.data.channelId);
  },
  { connection },
);

const runScraperOutput = async (job: Job<ScrapeJobData>) => {
  if (bot.scrapingModules.has(job.data.module)) {
    const output = bot.scrapingModules.get(job.data.module)?.output(job);

    bot.ping(output);
  }
};

new Worker(resultsQueue.name, async (job: Job<ScrapeJobData>) => {
  const result = await mkSafe(runScraperOutput)(job);
  if (result.isErr()) {
    console.error("[Worker] Error processing job:", result.error);
  } else {
    console.log("[Worker] Job processed successfully:", job.id, result.value);
  }
}, {
  connection,
});
