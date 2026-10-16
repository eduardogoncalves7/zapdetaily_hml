import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { formatWhatsAppMessage } from "@/services/booking";
import { getAdminAppointment, listAuditLog, rescheduleAppointment, transitionAppointment } from "@/services/admin-agenda";

type Params = { params: Promise<{ id: string }> };
const patchSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("status"), status: z.enum(["confirmado", "recusado", "concluido", "cancelado", "nao_compareceu"]) }), z.object({ action: z.literal("remarcar"), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), horario: z.string().regex(/^\d{2}:\d{2}$/) })]);
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: Params) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const id = (await params).id; const appointment = await getAdminAppointment(admin.tenantId, id); if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 }); const message = formatWhatsAppMessage({ nome: appointment.nome, id: appointment.id, inicio: appointment.inicio }); return NextResponse.json({ appointment, audit: await listAuditLog(admin.tenantId, id), whatsapp: `https://wa.me/${appointment.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}` }); }
export async function PATCH(request: Request, { params }: Params) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; try { const input = patchSchema.parse(await request.json()); const id = (await params).id; if (input.action === "status") await transitionAppointment(admin.tenantId, id, input.status, admin.id); else await rescheduleAppointment(admin.tenantId, id, input.data, input.horario, admin.id); return NextResponse.json({ appointment: await getAdminAppointment(admin.tenantId, id), audit: await listAuditLog(admin.tenantId, id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Operação inválida" }, { status: 400 }); } }
