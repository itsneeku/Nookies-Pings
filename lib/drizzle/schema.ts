import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
export const table = sqliteTable(
  "monitors",
  {
    id: int().primaryKey({ autoIncrement: true }),
    store: text().notNull(),
    type: text().notNull(),
    input: text({ mode: "json" }).notNull().default("{}"),
    inputUnique: text({ mode: "json" }).notNull().default("{}"),
    prevData: text({ mode: "json" }).notNull().default("{}"),
    channel: text().notNull(),
    role: text().notNull(),
    active: int().notNull().default(0),
    createdAt: int({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),

    updatedAt: int({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    unique("monitors_unique").on(table.store, table.type, table.inputUnique),
    index("monitors_store_type_active_idx").on(table.store, table.type, table.active),
  ],
);
