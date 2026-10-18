import { z } from "zod";

const base = { confirmado: z.boolean().default(false) };
export const createAppointmentIntentSchema = z.object({ tipo: z.literal("criar_agendamento"), nomeCliente: z.string().trim().min(2), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), horario: z.string().regex(/^\d{2}:\d{2}$/), servico: z.string().trim().min(1), modeloVeiculo: z.string().trim().optional(), ...base });
export const cancelAppointmentIntentSchema = z.object({ tipo: z.literal("cancelar_agendamento"), nomeCliente: z.string().trim().min(2), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), confirmado: z.boolean().default(false) });
export const rescheduleAppointmentIntentSchema = z.object({ tipo: z.literal("remarcar_agendamento"), nomeCliente: z.string().trim().min(2), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), novoHorario: z.string().regex(/^\d{2}:\d{2}$/), confirmado: z.boolean().default(false) });
export const registerExpenseIntentSchema = z.object({ tipo: z.literal("registrar_despesa"), valorCentavos: z.number().int().positive(), descricao: z.string().trim().min(1), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), confirmado: z.boolean().default(false) });
export const assistantIntentSchema = z.discriminatedUnion("tipo", [createAppointmentIntentSchema, cancelAppointmentIntentSchema, rescheduleAppointmentIntentSchema, registerExpenseIntentSchema]);
export type AssistantIntent = z.infer<typeof assistantIntentSchema>;
export function parseIntentOutput(value: unknown): AssistantIntent | null { const result = assistantIntentSchema.safeParse(value); return result.success ? result.data : null; }
