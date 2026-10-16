import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb } from "../lib/db";
import type { BusinessHours, TenantSettings } from "../lib/tenant-settings";
import type { Pool, PoolClient } from "pg";

export const bookingInputSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(10).max(30),
  porte: z.string().min(1).max(50),
  modelo: z.string().trim().max(100).optional().default(""),
  placa: z.string().trim().max(12).optional().default(""),
  serviceIds: z.array(z.string().uuid()).min(1).max(20),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horario: z.string().regex(/^\d{2}:\d{2}$/),
  idempotencyKey: z.string().uuid(),
  honeypot: z.string().max(0).optional().default(""),
});
export type BookingInput = z.infer<typeof bookingInputSchema>;

export type AvailabilitySlot = { horario: string; inicio: string; fim: string };
export type BookingResult = { id: string; status: "pendente"; inicio: string; fim: string; totalCentavos: number; accessToken?: string };
export type BookingHistoryItem = { id: string; status: string; nome: string; inicio: string; fim: string; porte: string; totalCentavos: number };

export class BookingConflictError extends Error { constructor(message = "Horário indisponível") { super(message); this.name = "BookingConflictError"; } }
export class BookingValidationError extends Error { constructor(message: string) { super(message); this.name = "BookingValidationError"; } }
export const BOOKING_LOCK_SQL = "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))";

export function overlapsInterval(start: Date, end: Date, otherStart: Date, otherEnd: Date): boolean { return start < otherEnd && end > otherStart; }
export function hasCapacity(activeIntervals: Array<{ inicio: Date; fim: Date }>, candidate: { inicio: Date; fim: Date }, capacity: number): boolean { return activeIntervals.filter((item) => overlapsInterval(candidate.inicio, candidate.fim, item.inicio, item.fim)).length < capacity; }

const WEEK_DAYS: Record<string, string> = { sunday: "domingo", monday: "segunda", tuesday: "terca", wednesday: "quarta", thursday: "quinta", friday: "sexta", saturday: "sabado" };
const DAY_ALIASES: Record<string, string[]> = { domingo: ["domingo", "sunday"], segunda: ["segunda", "segunda-feira", "monday"], terca: ["terca", "terça", "terça-feira", "tuesday"], quarta: ["quarta", "quarta-feira", "wednesday"], quinta: ["quinta", "quinta-feira", "thursday"], sexta: ["sexta", "sexta-feira", "friday"], sabado: ["sabado", "sábado", "saturday"] };

export function hashCustomerKey(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export function normalizePhone(phone: string): string { return phone.replace(/\D/g, ""); }
export function formatWhatsAppMessage(booking: { nome: string; id: string; inicio: string }): string { return `Olá! Meu agendamento ${booking.id.slice(0, 8)} foi criado para ${new Date(booking.inicio).toLocaleString("pt-BR")}. Nome: ${booking.nome}.`; }

function localParts(date: Date, timezone: string): { year: number; month: number; day: number; hour: number; minute: number; weekday: string } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long" }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), weekday: parts.find((part) => part.type === "weekday")?.value.toLowerCase() ?? "" };
}

export function zonedLocalToUtc(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number); const [hour, minute] = time.split(":").map(Number);
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let index = 0; index < 3; index += 1) { const actual = localParts(guess, timezone); const target = Date.UTC(year, month - 1, day, hour, minute); const observed = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute); guess = new Date(guess.getTime() + target - observed); }
  return guess;
}

function minutes(time: string): number { const [hour, minute] = time.split(":").map(Number); return hour * 60 + minute; }
function timeString(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
function scheduleFor(settings: Pick<TenantSettings, "horarioFuncionamento" | "fusoHorario">, date: string): { abertura: string; fechamento: string } | null {
  const day = WEEK_DAYS[new Intl.DateTimeFormat("en-US", { timeZone: settings.fusoHorario, weekday: "long" }).format(zonedLocalToUtc(date, "12:00", settings.fusoHorario)).toLowerCase()];
  const hours = settings.horarioFuncionamento;
  const key = Object.keys(hours).find((candidate) => DAY_ALIASES[day]?.includes(candidate.toLowerCase()));
  const value = key ? hours[key] : undefined;
  if (!value || value.fechado || !value.abertura || !value.fechamento || minutes(value.fechamento) <= minutes(value.abertura)) return null;
  return { abertura: value.abertura, fechamento: value.fechamento };
}

type BookingConfig = Pick<TenantSettings, "horarioFuncionamento" | "fusoHorario" | "intervaloGradeMinutos" | "capacidadeSimultanea">;
async function getBookingConfig(tenantId: string, client: Pool | PoolClient = getDb()): Promise<BookingConfig> {
  const result = await client.query<{ horario_funcionamento: BusinessHours; fuso_horario: string; intervalo_grade_minutos: number; capacidade_simultanea: number }>("SELECT horario_funcionamento, fuso_horario, intervalo_grade_minutos, capacidade_simultanea FROM tenant_settings WHERE tenant_id = $1", [tenantId]);
  const row = result.rows[0];
  if (!row) throw new BookingValidationError("Tenant não encontrado");
  return { horarioFuncionamento: row.horario_funcionamento, fusoHorario: row.fuso_horario, intervaloGradeMinutos: row.intervalo_grade_minutos, capacidadeSimultanea: row.capacidade_simultanea };
}

type SelectedService = { id: string; nome: string; duracao_minutos: number; valor_centavos: number };
async function getSelectedServices(tenantId: string, serviceIds: string[], porte: string, client: Pool | PoolClient = getDb()): Promise<SelectedService[]> {
  const result = await client.query<SelectedService>(`SELECT s.id, s.nome, s.duracao_minutos, p.valor_centavos FROM servicos s JOIN servico_precos p ON p.tenant_id = s.tenant_id AND p.servico_id = s.id AND p.porte = $3 WHERE s.tenant_id = $1 AND s.id = ANY($2::uuid[]) AND s.ativo = true`, [tenantId, serviceIds, porte]);
  if (result.rows.length !== new Set(serviceIds).size) throw new BookingValidationError("Um serviço não possui preço para este porte");
  return result.rows;
}

function dayRange(date: string, timezone: string): { start: Date; end: Date } { return { start: zonedLocalToUtc(date, "00:00", timezone), end: zonedLocalToUtc(date, "23:59", timezone) }; }
const overlaps = overlapsInterval;

export async function listAvailableSlots(tenantId: string, date: string, serviceIds: string[], porte: string): Promise<AvailabilitySlot[]> {
  const settings = await getBookingConfig(tenantId); const schedule = scheduleFor(settings, date); if (!schedule) return [];
  const services = await getSelectedServices(tenantId, serviceIds, porte); const duration = services.reduce((sum, service) => sum + service.duracao_minutos, 0); const range = dayRange(date, settings.fusoHorario);
  const [blocked, booked] = await Promise.all([
    getDb().query<{ inicio_em: Date; fim_em: Date }>("SELECT inicio_em, fim_em FROM bloqueios WHERE tenant_id = $1 AND inicio_em < $3 AND fim_em > $2", [tenantId, range.start, range.end]),
    getDb().query<{ inicio_em: Date; fim_em: Date }>("SELECT inicio_em, fim_em FROM agendamentos WHERE tenant_id = $1 AND status IN ('pendente','confirmado') AND inicio_em < $3 AND fim_em > $2", [tenantId, range.start, range.end]),
  ]);
  const slots: AvailabilitySlot[] = []; const opening = minutes(schedule.abertura); const closing = minutes(schedule.fechamento);
  for (let cursor = opening; cursor + duration <= closing; cursor += settings.intervaloGradeMinutos) { const horario = timeString(cursor); const start = zonedLocalToUtc(date, horario, settings.fusoHorario); const end = new Date(start.getTime() + duration * 60_000); const isBlocked = blocked.rows.some((item) => overlaps(start, end, item.inicio_em, item.fim_em)); const concurrent = booked.rows.filter((item) => overlaps(start, end, item.inicio_em, item.fim_em)).length; if (!isBlocked && concurrent < settings.capacidadeSimultanea) slots.push({ horario, inicio: start.toISOString(), fim: end.toISOString() }); }
  return slots;
}

export async function createBooking(tenantId: string, input: BookingInput, customerToken?: string): Promise<BookingResult> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const settings = await getBookingConfig(tenantId, client); const schedule = scheduleFor(settings, input.data); if (!schedule) throw new BookingConflictError("Dia fora do horário de funcionamento");
    await client.query(BOOKING_LOCK_SQL, [`booking:${tenantId}:${input.data}`]);
    const existing = await client.query<{ id: string; status: "pendente"; inicio_em: Date; fim_em: Date; total_centavos: number }>("SELECT id, status, inicio_em, fim_em, (SELECT COALESCE(SUM(valor_centavos_snapshot), 0) FROM agendamento_itens i WHERE i.agendamento_id = a.id) AS total_centavos FROM agendamentos a WHERE tenant_id = $1 AND idempotency_key = $2", [tenantId, input.idempotencyKey]);
    if (existing.rows[0]) { await client.query("COMMIT"); const row = existing.rows[0]; return { id: row.id, status: row.status, inicio: row.inicio_em.toISOString(), fim: row.fim_em.toISOString(), totalCentavos: Number(row.total_centavos) }; }
    const services = await getSelectedServices(tenantId, input.serviceIds, input.porte, client); const duration = services.reduce((sum, service) => sum + service.duracao_minutos, 0); const inicio = zonedLocalToUtc(input.data, input.horario, settings.fusoHorario); const fim = new Date(inicio.getTime() + duration * 60_000); const startMinutes = minutes(input.horario);
    if (startMinutes < minutes(schedule.abertura) || startMinutes + duration > minutes(schedule.fechamento) || startMinutes % settings.intervaloGradeMinutos !== minutes(schedule.abertura) % settings.intervaloGradeMinutos) throw new BookingConflictError("Horário fora da grade disponível");
    const blocked = await client.query("SELECT 1 FROM bloqueios WHERE tenant_id=$1 AND inicio_em < $3 AND fim_em > $2 LIMIT 1", [tenantId, inicio, fim]); if (blocked.rowCount) throw new BookingConflictError("Horário bloqueado");
    const concurrent = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM agendamentos WHERE tenant_id=$1 AND status IN ('pendente','confirmado') AND inicio_em < $3 AND fim_em > $2", [tenantId, inicio, fim]); if (Number(concurrent.rows[0].count) >= settings.capacidadeSimultanea) throw new BookingConflictError("Horário indisponível");
    const token = customerToken ?? randomBytes(32).toString("base64url"); const keyHash = hashCustomerKey(token); const key = await client.query<{ id: string }>("INSERT INTO cliente_chaves (tenant_id, chave_hash, telefone_normalizado) VALUES ($1,$2,$3) ON CONFLICT (tenant_id, chave_hash) DO UPDATE SET telefone_normalizado=EXCLUDED.telefone_normalizado RETURNING id", [tenantId, keyHash, normalizePhone(input.telefone)]);
    const appointment = await client.query<{ id: string }>("INSERT INTO agendamentos (tenant_id, cliente_chave_id, idempotency_key, nome_cliente, telefone, porte, modelo_veiculo, placa_veiculo, inicio_em, fim_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id", [tenantId, key.rows[0].id, input.idempotencyKey, input.nome, input.telefone, input.porte, input.modelo || null, input.placa || null, inicio, fim]);
    let totalCentavos = 0; for (const service of services) { totalCentavos += service.valor_centavos; await client.query("INSERT INTO agendamento_itens (agendamento_id, servico_id, nome_snapshot, porte_snapshot, valor_centavos_snapshot, duracao_minutos_snapshot) VALUES ($1,$2,$3,$4,$5,$6)", [appointment.rows[0].id, service.id, service.nome, input.porte, service.valor_centavos, service.duracao_minutos]); }
    await client.query("COMMIT"); return { id: appointment.rows[0].id, status: "pendente", inicio: inicio.toISOString(), fim: fim.toISOString(), totalCentavos, ...(customerToken ? {} : { accessToken: token }) };
  } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; } finally { client.release(); }
}

export async function getCustomerHistory(tenantId: string, token: string): Promise<BookingHistoryItem[]> { const result = await getDb().query<BookingHistoryItem>(`SELECT a.id, a.status, a.nome_cliente AS nome, a.inicio_em AS inicio, a.fim_em AS fim, a.porte, COALESCE(SUM(i.valor_centavos_snapshot), 0)::integer AS "totalCentavos" FROM agendamentos a JOIN cliente_chaves k ON k.id=a.cliente_chave_id LEFT JOIN agendamento_itens i ON i.agendamento_id=a.id WHERE a.tenant_id=$1 AND k.chave_hash=$2 AND k.revogado_em IS NULL GROUP BY a.id ORDER BY a.inicio_em DESC`, [tenantId, hashCustomerKey(token)]); return result.rows; }
export async function cancelBooking(tenantId: string, id: string, token: string): Promise<boolean> { const result = await getDb().query("UPDATE agendamentos SET status='cancelado', cancelado_em=now(), atualizado_em=now() WHERE id=$1 AND tenant_id=$2 AND status='pendente' AND cliente_chave_id IN (SELECT id FROM cliente_chaves WHERE tenant_id=$2 AND chave_hash=$3 AND revogado_em IS NULL)", [id, tenantId, hashCustomerKey(token)]); return result.rowCount === 1; }
