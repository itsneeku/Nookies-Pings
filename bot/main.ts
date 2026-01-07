import "@std/dotenv/load";
import { Job, Worker } from "bullmq";
import { bot } from "./bot.ts";
import { connection, resultsQueue } from "$utils/queues.ts";

const res = await bot.start();
!res.isOk() && (console.error(res.error), Deno.exit(1));


new Worker(
  resultsQueue.name,
  async (job: Job<ResultJobData>) => {
    // await bot.ping(job.data.channelId);
  },
  { connection },
);
