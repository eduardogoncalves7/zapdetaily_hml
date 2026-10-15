import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ausente");

const pool = new Pool({ connectionString: databaseUrl });
try {
  await pool.query("BEGIN");
  if (process.argv.includes("--clean")) {
    await pool.query("TRUNCATE tenant_settings, tenants CASCADE");
    console.log("Seed limpo.");
  } else {
    await pool.query(
      `INSERT INTO tenants (nome, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      ["Tenant Demo", "tenant-demo"],
    );
    await pool.query(
      `INSERT INTO tenant_settings (tenant_id, nome_publico, slug)
       SELECT id, $1, slug FROM tenants WHERE slug = $2
       ON CONFLICT (tenant_id) DO NOTHING`,
      ["Tenant Demo", "tenant-demo"],
    );
    console.log("Seed demo aplicado.");
  }
  await pool.query("COMMIT");
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
} finally {
  await pool.end();
}
