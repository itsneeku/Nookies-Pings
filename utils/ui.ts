import express from "express";
import { resultsQueue, scrapingQueue } from "$utils/queues.ts";
import { createQueueDashExpressMiddleware } from "@queuedash/api";

const app = express();
const port = 3000;

app.use(
  "/queuedash",
  createQueueDashExpressMiddleware({
    ctx: {
      queues: [
        {
          queue: resultsQueue,
          displayName: resultsQueue.name,
          type: "bullmq" as const,
        },
        {
          queue: scrapingQueue,
          displayName: scrapingQueue.name,
          type: "bullmq" as const,
        },
      ],
    },
  }),
);

app.listen(port, () => {
  console.log(`Visit http://localhost:${port}/queuedash`);
});
