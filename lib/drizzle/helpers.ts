import { getTableColumns, sql } from "drizzle-orm";
import { SQLiteTable, SQLiteUpdateSetSource } from "drizzle-orm/sqlite-core";

import { table } from "@/lib/drizzle/schema";

export function conflictUpdateSet<TTable extends SQLiteTable>(
  table: TTable,
): SQLiteUpdateSetSource<TTable> {
  const columns = getTableColumns(table);
  const set: Record<string, any> = {};
  for (const [key, column] of Object.entries(columns)) {
    if (!column.primary && column.name != "createdAt") {
      set[key] = sql.raw(`excluded.${column.name}`);
    }
  }
  set["updatedAt"] = sql`(unixepoch())`;
  return set as SQLiteUpdateSetSource<TTable>;
}

export const uniqueUpsertConfig = {
  target: [table.type, table.store, table.inputUnique],
  set: conflictUpdateSet(table),
};
