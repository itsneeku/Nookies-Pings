export const upsertJob = async (db: D1Database, data: MonitorJobData) =>
  await db
    .prepare(
      `INSERT INTO jobs (store, method, sku, cron, maxPrice, channelId, roleId, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(store, method, sku) DO UPDATE SET
         cron = excluded.cron,
         maxPrice = excluded.maxPrice,
         channelId = excluded.channelId,
         roleId = excluded.roleId,
         updated_at = excluded.updated_at
       RETURNING *`
    )
    .bind(
      data.store,
      data.method,
      data.sku,
      data.cron,
      data.maxPrice,
      data.channelId,
      data.roleId,
      Math.floor(Date.now() / 1000)
    )
    .first();
