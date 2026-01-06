import "@std/dotenv/load";
import { Job, Worker } from "bullmq";
import { connection, resultsQueue } from "$utils/queues.ts";
