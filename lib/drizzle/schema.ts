import { index, int, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const commonFields = {
  id: int().primaryKey({ autoIncrement: true }),
  channel: text().notNull(),
  role: text().notNull(),
};

export const WalmartCAProductTable = sqliteTable(
  "walmart_ca_product",
  {
    sku: text().notNull().unique(),
    url: text().notNull().unique(),
    title: text(),
    inStock: int().notNull().default(0),
    price: real(),
    image: text(),
    active: int().notNull().default(0),
    ...commonFields,
  },
  (table) => [
    uniqueIndex("walmart_ca_product_sku_idx").on(table.sku),
    uniqueIndex("walmart_ca_product_url_idx").on(table.url),
    index("walmart_ca_product_active_idx").on(table.active),
  ],
);

export const WalmartCASearchTable = sqliteTable(
  "walmart_ca_search",
  {
    url: text().notNull().unique(),
    ...commonFields,
  },
  (table) => [index("walmart_ca_search_url_idx").on(table.url)],
);

export const EBGamesCAProductTable = sqliteTable(
  "ebgames_ca_product",
  {
    sku: text().unique(),
    url: text().notNull().unique(),
    title: text(),
    inStock: int().notNull().default(0),
    price: real(),
    image: text(),
    active: int().notNull().default(0),
    ...commonFields,
  },
  (table) => [
    uniqueIndex("ebgames_ca_product_sku_idx").on(table.sku),
    uniqueIndex("ebgames_ca_product_url_idx").on(table.url),
    index("ebgames_ca_product_active_idx").on(table.active),
  ],
);

export const EBGamesCASearchTable = sqliteTable(
  "ebgames_ca_search",
  {
    url: text().notNull().unique(),
    ...commonFields,
  },
  (table) => [index("ebgames_ca_search_url_idx").on(table.url)],
);
