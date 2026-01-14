import { Cloudflare } from "cloudflare";
import { JobScheduler } from "./scheduler.ts";

const client = new Cloudflare({
  apiToken: process.env.CF_TOKEN,
});

const scheduler = new JobScheduler(client);
await scheduler.load();
