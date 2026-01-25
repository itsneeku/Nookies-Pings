import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CF_ACC_ID,
    databaseId: process.env.CF_DB_ID,
    token: process.env.CF_TOKEN,
  },
});
