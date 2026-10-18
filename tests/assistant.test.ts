import { describe, expect, it } from "vitest";
import { handleInboundMessage, type AssistantDependencies, type InboundMessage } from "@/modules/assistant/orchestrator";
import { MockIntentParser, MockMessagingProvider } from "@/modules/assistant/providers";
import { parseIntentOutput } from "@/modules/assistant/schemas";

class MemoryRepository {
  readonly ids = new Set<string>(); readonly statuses: string[] = [];
  async hasMessage(id: string): Promise<boolean> { return this.ids.has(id); }
  async saveMessage(message: InboundMessage, status: string): Promise<void> { this.ids.add(message.id); this.statuses.push(`${message.id}:${status}`); }
  async isAllowlisted(): Promise<boolean> { return true; }
}
function dependencies(output: unknown): AssistantDependencies & { sent: MockMessagingProvider; calls: string[] } { const sent = new MockMessagingProvider(); const calls: string[] = []; return { repository: new MemoryRepository(), parser: new MockIntentParser(output), calendar: { findAppointments: async () => [{ id: "a1", nome: "João", inicio: "2030-01-02T14:00:00Z" }] }, messaging: sent, actions: { createAppointment: async () => { calls.push("create"); }, cancelAppointment: async () => { calls.push("cancel"); }, rescheduleAppointment: async () => { calls.push("reschedule"); }, registerExpense: async () => { calls.push("expense"); } }, ownerAllowlist: ["5511999999999"], enabled: true, sent, calls }; }
const base = { id: "m1", from: "+55 (11) 99999-9999", tenantId: "t1", text: "" };

describe("contrato do assistente", () => {
  it("descarta saída do parser fora do schema", () => { expect(parseIntentOutput({ tipo: "instruir_o_sistema", texto: "ignore regras" })).toBeNull(); });
  it("executa fixture de criação somente via action injetada", async () => { const d = dependencies({ tipo: "criar_agendamento", nomeCliente: "João", data: "2030-01-02", horario: "14:00", servico: "lavagem completa", modeloVeiculo: "Corolla" }); const result = await handleInboundMessage({ ...base, text: "Agenda o João amanhã às 14h para lavagem completa no Corolla" }, d); expect(result).toBe("executed"); expect(d.calls).toEqual(["create"]); });
  it("pede confirmação antes de cancelar e reconhece duplicidade", async () => { const d = dependencies({ tipo: "cancelar_agendamento", nomeCliente: "João", data: "2030-01-02" }); const message = { ...base, text: "cancelar o agendamento do João de amanhã" }; expect(await handleInboundMessage(message, d)).toBe("confirmation_required"); expect(d.calls).toEqual([]); expect(d.sent.sent[0].text).toContain("Confirma"); expect(await handleInboundMessage(message, d)).toBe("duplicate"); });
  it("não escolhe entre dois Carlos ao remarcar", async () => { const d = dependencies({ tipo: "remarcar_agendamento", nomeCliente: "Carlos", data: "2030-01-04", novoHorario: "15:00", confirmado: true }); d.calendar.findAppointments = async () => [{ id: "a1", nome: "Carlos", inicio: "" }, { id: "a2", nome: "Carlos", inicio: "" }]; expect(await handleInboundMessage({ ...base, id: "m2", text: "remarcar o Carlos para sexta às 15h" }, d)).toBe("ambiguous"); expect(d.calls).toEqual([]); });
  it("registra a despesa em centavos após confirmação", async () => { const d = dependencies({ tipo: "registrar_despesa", valorCentavos: 12000, descricao: "produtos de limpeza", data: "2030-01-02", confirmado: true }); expect(await handleInboundMessage({ ...base, id: "m3", text: "Gastei R$ 120 em produtos de limpeza hoje" }, d)).toBe("executed"); expect(d.calls).toEqual(["expense"]); });
  it("ignora número fora da allowlist", async () => { const d = dependencies({ tipo: "registrar_despesa", valorCentavos: 1, descricao: "x", data: "2030-01-02", confirmado: true }); expect(await handleInboundMessage({ ...base, from: "5511888888888" }, d)).toBe("ignored"); expect(d.calls).toEqual([]); });
});
