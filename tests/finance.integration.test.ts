import { describe, expect, it } from "vitest";
import pg from "pg";

const databaseUrl = process.env.FINANCE_TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)("financeiro no Postgres real", () => {
  it("encontra tabelas, constraints e índice de idempotência após migrações", async () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    try {
      const tables = await pool.query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('financeiro_categorias','financeiro_lancamentos','audit_log')");
      expect(tables.rows.map((row) => row.table_name).sort()).toEqual(["audit_log", "financeiro_categorias", "financeiro_lancamentos"]);
      const index = await pool.query<{ indexname: string }>("SELECT indexname FROM pg_indexes WHERE tablename='financeiro_lancamentos' AND indexname='ux_financeiro_receita_agendamento'");
      expect(index.rows).toHaveLength(1);
    } finally { await pool.end(); }
  });
});
