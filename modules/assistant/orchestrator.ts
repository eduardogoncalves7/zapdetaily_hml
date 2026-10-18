import { createHash } from "node:crypto";
import type { AssistantAction, CalendarProvider, IntentParser, MessagingProvider } from "./providers";
import { parseIntentOutput, type AssistantIntent } from "./schemas";

export type InboundMessage = { id: string; from: string; text: string; tenantId: string };
export interface AssistantRepository { hasMessage(id: string, tenantId: string): Promise<boolean>; saveMessage(message: InboundMessage, status: string): Promise<void>; isAllowlisted(tenantId: string, phoneHash: string): Promise<boolean>; consumeUsage?(tenantId: string): Promise<boolean>; }
export type HandleResult = "ignored" | "duplicate" | "invalid" | "ambiguous" | "confirmation_required" | "executed";
export type AssistantDependencies = { repository: AssistantRepository; parser: IntentParser; calendar: CalendarProvider; messaging: MessagingProvider; actions: AssistantAction; ownerAllowlist: string[]; enabled: boolean };
export function normalizePhone(value: string): string { return value.replace(/\D/g, ""); }
export function hashPhone(value: string): string { return createHash("sha256").update(normalizePhone(value)).digest("hex"); }
function isDestructive(intent: AssistantIntent): boolean { return intent.tipo === "cancelar_agendamento" || intent.tipo === "remarcar_agendamento" || intent.tipo === "registrar_despesa"; }
function confirmationText(intent: AssistantIntent): string { if (intent.tipo === "registrar_despesa") return `Confirma registrar a despesa de R$ ${(intent.valorCentavos / 100).toFixed(2)}?`; if (intent.tipo === "cancelar_agendamento") return `Confirma cancelar o agendamento de ${intent.nomeCliente} em ${intent.data}?`; if (intent.tipo === "remarcar_agendamento") return `Confirma remarcar ${intent.nomeCliente} para ${intent.data} às ${intent.novoHorario}?`; return "Confirma executar esta ação?"; }
export async function handleInboundMessage(message: InboundMessage, dependencies: AssistantDependencies): Promise<HandleResult> {
  if (!dependencies.enabled) return "ignored";
  const phone = normalizePhone(message.from);
  if (!dependencies.ownerAllowlist.map(normalizePhone).includes(phone)) return "ignored";
  if (!await dependencies.repository.isAllowlisted(message.tenantId, hashPhone(phone))) return "ignored";
  if (await dependencies.repository.hasMessage(message.id, message.tenantId)) return "duplicate";
  if (dependencies.repository.consumeUsage && !await dependencies.repository.consumeUsage(message.tenantId)) return "ignored";
  await dependencies.repository.saveMessage(message, "recebida");
  const intent = parseIntentOutput(await dependencies.parser.parse(message.text));
  if (!intent) { await dependencies.messaging.sendText(message.from, "Não consegui entender a solicitação."); return "invalid"; }
  if (intent.tipo === "cancelar_agendamento" || intent.tipo === "remarcar_agendamento") {
    const candidates = await dependencies.calendar.findAppointments(message.tenantId, intent.nomeCliente, intent.data);
    if (candidates.length !== 1) { await dependencies.messaging.sendText(message.from, candidates.length > 1 ? "Encontrei dois agendamentos com esse nome. Informe mais detalhes." : "Não encontrei um agendamento único para essa pessoa."); return "ambiguous"; }
    if (!intent.confirmado) { await dependencies.messaging.sendText(message.from, confirmationText(intent)); return "confirmation_required"; }
    if (intent.tipo === "cancelar_agendamento") await dependencies.actions.cancelAppointment(candidates[0].id);
    else await dependencies.actions.rescheduleAppointment(candidates[0].id, intent.data, intent.novoHorario);
  } else {
    if (isDestructive(intent) && !intent.confirmado) { await dependencies.messaging.sendText(message.from, confirmationText(intent)); return "confirmation_required"; }
    if (intent.tipo === "criar_agendamento") await dependencies.actions.createAppointment(intent);
    else await dependencies.actions.registerExpense(intent);
  }
  await dependencies.repository.saveMessage(message, "executada");
  return "executed";
}
