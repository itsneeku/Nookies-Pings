import { Cloudflare } from "cloudflare";

export const updateJobResult = async (
  client: Cloudflare,
  jobId: number,
  result: ScrapedProduct
) =>
  await client.d1.database.query(process.env.CF_DB_ID, {
    account_id: process.env.CF_ACC_ID,
    sql: "UPDATE jobs SET previousResult = ?, updated_at = ? WHERE id = ?",
    params: [
      JSON.stringify(result),
      String(Math.floor(Date.now() / 1000)),
      String(jobId),
    ],
  });

export const fetchJobs = async (client: Cloudflare) => {
  const response = await client.d1.database.query(process.env.CF_DB_ID, {
    account_id: process.env.CF_ACC_ID,
    sql: "SELECT * FROM jobs",
  });

  const results = response.result[0]?.results as MonitorJobTableRow[];
  console.log("Fetched jobs:", results);
  return Array.isArray(results) ? results : [];
};
