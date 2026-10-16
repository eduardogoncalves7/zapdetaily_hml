import { describe, expect, it } from "vitest";
import { agendaPeriod, assertAppointmentTransition, canTransitionAppointment } from "../services/admin-agenda";
import { scheduleFor, validateSlotAvailability } from "../services/booking";

describe("máquina de estados da agenda", () => {
  it("aceita as transições operacionais válidas", () => {
    expect(canTransitionAppointment("pendente", "confirmado")).toBe(true);
    expect(canTransitionAppointment("pendente", "recusado")).toBe(true);
    expect(canTransitionAppointment("confirmado", "concluido")).toBe(true);
    expect(canTransitionAppointment("confirmado", "nao_compareceu")).toBe(true);
  });

  it("rejeita reabrir ou concluir um cancelado", () => {
    expect(canTransitionAppointment("cancelado", "confirmado")).toBe(false);
    expect(() => assertAppointmentTransition("concluido", "pendente")).toThrow("Transição inválida");
  });

  it("calcula a semana sem fixar um dia de funcionamento", () => {
    const period = agendaPeriod("2030-01-16", "week", "America/Sao_Paulo");
    expect(period.end.getTime() - period.start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("remarcação respeita o horário configurado do tenant", () => {
    const settings = { fusoHorario: "America/Sao_Paulo", horarioFuncionamento: { segunda: { abertura: "08:00", fechamento: "18:00" }, domingo: { fechado: true } } };
    expect(scheduleFor(settings, "2030-01-14")).toEqual({ abertura: "08:00", fechamento: "18:00" });
    expect(scheduleFor(settings, "2030-01-13")).toBeNull();
  });

  it("rejeita remarcação sobre bloqueio antes de atualizar", async () => {
    const fakeClient = { query: async (sql: string) => {
      if (sql.includes("tenant_settings")) return { rows: [{ horario_funcionamento: { segunda: { abertura: "08:00", fechamento: "18:00" } }, fuso_horario: "America/Sao_Paulo", intervalo_grade_minutos: 30, capacidade_simultanea: 1 }] };
      if (sql.includes("bloqueios")) return { rowCount: 1, rows: [{}] };
      return { rows: [{ count: "0" }] };
    } } as never;
    await expect(validateSlotAvailability("tenant", "2030-01-14", "09:00", 60, "appointment", fakeClient)).rejects.toThrow("Horário bloqueado");
  });
});
