import { describe, expect, it, vi } from "vitest";
import { financeCsv, financePeriodBounds } from "@/services/finance";

describe("financeiro", () => {
  it("calcula mês e comparação anterior no fuso do tenant", () => {
    const result = financePeriodBounds("2030-02-28", "month", "America/Sao_Paulo");
    expect(result.current.startDate).toBe("2030-02-01");
    expect(result.current.endDate).toBe("2030-03-01");
    expect(result.previous.startDate).toBe("2030-01-01");
    expect(result.previous.endDate).toBe("2030-02-01");
    expect(result.current.start.toISOString()).toBe("2030-02-01T03:00:00.000Z");
  });

  it("respeita virada semanal e separa o dia local", () => {
    const result = financePeriodBounds("2030-03-03", "week", "America/Sao_Paulo");
    expect(result.current.startDate).toBe("2030-02-25");
    expect(result.current.endDate).toBe("2030-03-04");
    expect(result.previous.startDate).toBe("2030-02-18");
  });

  it("gera CSV com escaping", () => {
    const csv = financeCsv([{ id: "1", tipo: "despesa", status: "ativo", categoriaId: "c", categoriaNome: "Operação", formaPagamento: "pix", dataLancamento: "2030-02-01", valorCentavos: 1234, descricao: 'Compra "teste"', origem: "manual", agendamentoId: null, criadoEm: "2030-02-01T00:00:00.000Z" }]);
    expect(csv).toContain('"Compra ""teste"""');
    expect(csv.split("\r\n")).toHaveLength(2);
  });

  it("não expõe a rota no plano basic", async () => {
    vi.resetModules();
    process.env.ZD_PLAN = "basic";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    const { GET } = await import("@/app/api/finance/route");
    const response = await GET(new Request("http://localhost/api/finance"));
    expect(response.status).toBe(404);
  });
});
