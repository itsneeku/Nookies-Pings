import "@std/dotenv/load";

import { Job, Worker } from "bullmq";
import { addResultJob, connection, scrapingQueue } from "$utils/queues.ts";
import { mkSafe } from "$utils/safe.ts";

const runScraper = async (job: Job<ScrapeJobData>) => {
  console.log(`[Worker] Job ID: ${job.id}`);

  const command = new Deno.Command("uv", {
    args: ["run", "-m", `modules.${job.data.module}.main`],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });
  const process = command.spawn();

  console.log("[Worker] Job Data:", job.data);

  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(job.data)));
  await writer.close();

  const { code, stdout } = await process.output();
  const rawOutput = new TextDecoder().decode(stdout).trim();
  const data = JSON.parse(rawOutput);

  return data;
};

new Worker(scrapingQueue.name, async (job: Job<ScrapeJobData>) => {
  const result = await mkSafe(runScraper)(job);

  addResultJob({
    data: result.value,
    scrapeJob: job,
  });

  if (result.isErr()) {
    console.error("[Worker] Error processing job:", result.error);
  } else {
    console.log("[Worker] Job processed successfully:", job.id, result.value);
  }
}, {
  connection,
});

console.log("[Worker] Started");
