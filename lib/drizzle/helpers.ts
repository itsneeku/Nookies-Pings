import { getTableColumns, sql } from "drizzle-orm";
import { SQLiteTable, SQLiteUpdateSetSource } from "drizzle-orm/sqlite-core";

export function conflictUpdateSet<TTable extends SQLiteTable>(
  table: TTable,
): SQLiteUpdateSetSource<TTable> {
  const columns = getTableColumns(table);
  const set: Record<string, any> = {};
  for (const [key, column] of Object.entries(columns)) {
    if (!column.primary) {
      set[key] = sql.raw(`excluded.${column.name}`);
    }
  }
  return set as SQLiteUpdateSetSource<TTable>;
}
