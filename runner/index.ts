import { Cloudflare } from "cloudflare";
import { JobScheduler } from "./scheduler.ts";
import { deployCommands } from "nookie/commands/index.ts";

await deployCommands();

const client = new Cloudflare({
  apiToken: process.env.CF_TOKEN,
});

const scheduler = new JobScheduler(client);
await scheduler.load();
