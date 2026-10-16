import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { BOOKING_LOCK_SQL, bookingInputSchema, hashCustomerKey, hasCapacity, overlapsInterval, zonedLocalToUtc } from "../services/booking";

describe("regras de agendamento", () => {
  it("converte o horário local do tenant para UTC", () => {
    expect(zonedLocalToUtc("2030-01-15", "09:00", "America/Sao_Paulo").toISOString()).toBe("2030-01-15T12:00:00.000Z");
  });

  it("considera duração e capacidade ao testar sobreposição", () => {
    const active = [{ inicio: new Date("2030-01-15T12:00:00Z"), fim: new Date("2030-01-15T13:30:00Z") }];
    expect(hasCapacity(active, { inicio: new Date("2030-01-15T13:00:00Z"), fim: new Date("2030-01-15T14:00:00Z") }, 1)).toBe(false);
    expect(hasCapacity(active, { inicio: new Date("2030-01-15T13:30:00Z"), fim: new Date("2030-01-15T14:00:00Z") }, 1)).toBe(true);
    expect(overlapsInterval(new Date("2030-01-15T12:00:00Z"), new Date("2030-01-15T13:00:00Z"), new Date("2030-01-15T13:00:00Z"), new Date("2030-01-15T14:00:00Z"))).toBe(false);
  });

  it("usa advisory lock transacional para serializar o dia do tenant", () => {
    expect(BOOKING_LOCK_SQL).toContain("pg_advisory_xact_lock");
    expect(BOOKING_LOCK_SQL).toContain("hashtextextended");
  });

  it("não permite recuperar histórico somente com telefone ou chave diferente", () => {
    expect(hashCustomerKey("token-a")).not.toBe(hashCustomerKey("token-b"));
    expect(bookingInputSchema.safeParse({ nome: "Cliente", telefone: "11999999999", porte: "moto", serviceIds: ["00000000-0000-0000-0000-000000000001"], data: "2030-01-15", horario: "09:00", idempotencyKey: "00000000-0000-0000-0000-000000000002", honeypot: "bot" }).success).toBe(false);
  });

  it.skipIf(!process.env.BOOKING_TEST_DATABASE_URL)("serializa duas tentativas concorrentes no mesmo dia", async () => {
    const pool = new Pool({ connectionString: process.env.BOOKING_TEST_DATABASE_URL });
    const first = await pool.connect(); const second = await pool.connect(); const started = Date.now();
    try {
      await first.query("BEGIN"); await first.query(BOOKING_LOCK_SQL, ["booking:test:2030-01-15"]);
      await second.query("BEGIN"); const waiting = second.query(BOOKING_LOCK_SQL, ["booking:test:2030-01-15"]);
      await new Promise((resolve) => setTimeout(resolve, 100)); await first.query("COMMIT"); await waiting; await second.query("COMMIT");
      expect(Date.now() - started).toBeGreaterThanOrEqual(90);
    } finally { await first.query("ROLLBACK").catch(() => undefined); await second.query("ROLLBACK").catch(() => undefined); first.release(); second.release(); await pool.end(); }
  });
});
