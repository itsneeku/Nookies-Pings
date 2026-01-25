import product from "./product";
import search from "./search";

const STORE = "walmart_ca";
const PRODUCT = "product";
const SEARCH = "search";

export const PRODUCT_CONFIG = {
  name: PRODUCT,
  cron: "*/1 * * * *",
  keyPrefix: "walmart_ca_product",
  logPrefix: "walmart_ca_product",
  urlTemplate: (sku: string) => `https://www.walmart.ca/en/ip/${sku}`,
} as const;

export const SEARCH_CONFIG = {
  name: SEARCH,
  cron: "*/5 * * * *",
  keyPrefix: "walmart_ca_search",
  logPrefix: "walmart_ca_search",
} as const;

export { STORE, PRODUCT, SEARCH };

export default {
  store: STORE,
  description: "Walmart Canada",
  monitors: {
    search,
    product,
  } as const,
} satisfies Store;
