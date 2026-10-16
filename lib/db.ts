import { Pool } from "pg";
import { getEnv } from "./env";

declare global {
  var __zapdetailyPool: Pool | undefined;
}

export function getDb(): Pool {
  if (!globalThis.__zapdetailyPool) {
    const env = getEnv();
    globalThis.__zapdetailyPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 3000,
      statement_timeout: 10000,
      query_timeout: 12000,
    });
  }
  return globalThis.__zapdetailyPool;
}
