import { getDb } from "@/lib/db";

export async function checkDatabaseReady(): Promise<{ ready: boolean }> {
  try {
    const db = getDb();
    await db.query("SELECT 1");
    const result = await db.query<{ exists: boolean }>(
      "SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists",
    );
    return { ready: result.rows[0]?.exists === true };
  } catch {
    return { ready: false };
  }
}
