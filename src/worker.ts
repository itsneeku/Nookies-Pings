import "@std/dotenv/load";

import { Job, Worker } from "bullmq";
import {
  connection,
  scrapingQueue,
} from "$utils/queues.ts";
import { wrapAsync } from "$utils/safe.ts";


const process = async (job: Job<ScrapeJobData>) => {
  console.log(`[Worker] Job ID: ${job.id}`);

  const command = new Deno.Command("uv", {
    args: ["run", "src/scraper/main.py"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  const process = command.spawn();

  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(job.data)));
  await writer.close();

  const { code, stdout } = await process.output();
  const rawOutput = new TextDecoder().decode(stdout).trim();
  const data = JSON.parse(rawOutput);

  return data;
};

const processor = wrapAsync(process);

const processJob = async (job: Job<ScrapeJobData>) => {
  const result = await processor(job);
  if (result.isErr()) {
    console.error("[Worker] Error processing job:", result.error);
  } else {
    console.log("[Worker] Job processed successfully:", job.id, result.value);
    // await addResultJob({
    //   url: result.value,
    //   channelId: job.data.channelId,
    //   scrapeJob: job,
    // });
  }
};

new Worker(scrapingQueue.name, processJob, {
  connection,
});

console.log("[Worker] Started");
