import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.join(root, "..", "db", "migrations");
const migrationTimeoutMs = Number(process.env.DB_MIGRATION_TIMEOUT_MS ?? 120000);
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL ausente");
}

const pool = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 3000,
  statement_timeout: 20000,
  query_timeout: 25000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 10) await sleep(3000);
    }
  }
  throw lastError;
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [81726341]);
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const entries = (await fs.readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

    for (const name of entries) {
      const applied = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
      if (applied.rowCount) continue;

      const sql = await fs.readFile(path.join(migrationsDirectory, name), "utf8");
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query("SET LOCAL statement_timeout = '20s'");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
        console.log(`Migração aplicada: ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)").catch(() => undefined);
    client.release();
  }
}

const timeout = setTimeout(() => {
  console.error("Limite total de migração excedido.");
  process.exit(1);
}, migrationTimeoutMs);

try {
  await connectWithRetry();
  await migrate();
  console.log("Migrações concluídas.");
} catch (error) {
  console.error("Falha nas migrações:", error instanceof Error ? error.message : "erro desconhecido");
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await pool.end();
}
