import { ConnectionOptions, Queue } from "bullmq";

export const QUEUE_NAME = "monitor";
export const connection: ConnectionOptions = {
  url: process.env.REDIS_URL,
};
export const queue = new Queue(QUEUE_NAME, { connection });

const redis = await queue.client;

const keys = {
  name: (data: MonitorJobData) =>
    `${QUEUE_NAME}:${data.store}:${data.method}:${data.sku}`,
};

export const addScrapingJob = async (data: MonitorJobData) =>
  await queue.upsertJobScheduler(
    keys.name(data),
    { pattern: data.cron },
    { data }
  );
