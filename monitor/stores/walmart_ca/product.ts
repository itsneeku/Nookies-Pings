import { Result } from "better-result";
import * as v from "valibot";

import { pyRun } from "@/lib/py";

const outputSchema = v.object({
  title: v.string(),
  inStock: v.boolean(),
  price: v.optional(v.number()),
  image: v.optional(v.string()),
});

type Output = v.InferOutput<typeof outputSchema>;

const config: MonitorConfig = {
  store: "walmart_ca",
  type: "product",
  description: "Monitor a Walmart Canada product by SKU",
  cron: "*/1 * * * *",
  input: {
    sku: {
      description: "Product SKU",
      type: "string",
      required: true,
      unique: true,
    },
    maxPrice: {
      description: "Maximum price to notify for",
      type: "number",
      required: true,
    },
  },
};

const run: MonitorRunner = (prev: Output, input) =>
  Result.gen(async function* () {
    const data = yield* Result.await(
      pyRun<Output>({
        store: config.store,
        type: config.type,
        sku: input.sku,
      }),
    );

    const backInStock = !prev.inStock && !!data.inStock;
    const goodPrice = (data.price ?? Infinity) <= input.maxPrice;

    const notify = backInStock && goodPrice;

    return Result.ok({
      notify,
      data,
    });
  });

// const createJobs: MonitorJobCreator = (rows) => rows.map(({ id }) => ({ id, run }));

export default {
  config,
  run,
} satisfies Monitor;
