import { Worker, Job } from "bullmq";
import { connection } from "nookie/utils/queue";
import { pyScrape } from "nookie/utils/py";
import { Colors, ContainerBuilder } from "discord.js";
import { bot } from "./bot/client";

const DEBUG = true;

const processJob = async (job: Job<MonitorJobData>) => {
  const { previousResult, maxPrice } = job.data;
  console.log(job.data.channelId);
  const result = await pyScrape(job.data);

  const nowInStock = !previousResult?.inStock && result.inStock;
  const goodPrice = !maxPrice || result.price || 0 <= maxPrice;

  if ((nowInStock && goodPrice) || DEBUG) {
    await sendNotification(job.data, result);
  } else {
    console.log(
      `Not notifying: wasOutOfStock=${!previousResult?.inStock} inStock=${
        result.inStock
      }`
    );
  }
};

const sendNotification = async (
  data: MonitorJobData,
  product: ScrapedProduct
) => {
  const rolePing = data.roleId ? `<@&${data.roleId}>` : "";
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Green)
    .addSectionComponents((s) =>
      s
        .addTextDisplayComponents((t) =>
          t.setContent(`🔔 ${product.title} is back in stock!`)
        )
        .addTextDisplayComponents((t) => t.setContent(rolePing))
        .addTextDisplayComponents((t) => t.setContent(`\n${product.url}`))
        .setThumbnailAccessory((t) => t.setURL("https://cataas.com/cat"))
    )
    .addSectionComponents((s) =>
      s
        .addTextDisplayComponents((t) => t.setContent(`SKU: ${product.sku}`))
        .addTextDisplayComponents((t) =>
          t.setContent(
            `Price: ${product.price ? `$${product.price.toFixed(2)}` : "N/A"}`
          )
        )
        .setThumbnailAccessory((t) => t.setURL("https://cataas.com/cat"))
    );

  await bot.send("1409774038712320068", [container]);
};

const worker = new Worker("monitor", processJob, { connection });

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`Job ${job?.id} failed:`, err));

console.log("Worker started");
