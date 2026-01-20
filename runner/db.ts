import { Cloudflare } from "cloudflare";

export class Database {
  client: Cloudflare;

  constructor(
    private dbId: string,
    private accountId: string,
    cfToken: string,
  ) {
    this.client = new Cloudflare({ apiToken: cfToken });
  }

  async fetchJobs(): Promise<MonitorJobTableRow[]> {
    const res = await this.client.d1.database.query(this.dbId, {
      account_id: this.accountId,
      sql: "SELECT * FROM jobs",
    });
    const rows = (res.result?.[0]?.results ?? []) as MonitorJobTableRow[];
    return rows.map((r) => ({
      ...r,
      custom: r.custom ? JSON.parse(String(r.custom)) : {},
      previousResult:
        r.previousResult ? JSON.parse(String(r.previousResult)) : null,
    }));
  }

  async updateJobResult(jobId: number, result: ScrapedProduct) {
    console.log("[DB] Updating job result for job", jobId, result);
    return await this.client.d1.database.query(this.dbId, {
      account_id: this.accountId,
      sql: "UPDATE jobs SET previousResult = ?, updated_at = ? WHERE id = ?",
      params: [
        JSON.stringify(result),
        String(Math.floor(Date.now() / 1000)),
        String(jobId),
      ],
    });
  }
}
