import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { createManualAppointment, listAdminAgenda, type AppointmentStatus } from "@/services/admin-agenda";
import { bookingInputSchema } from "@/services/booking";

const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().slice(0, 10)), view: z.enum(["day", "week"]).default("day"), status: z.enum(["pendente", "confirmado", "recusado", "cancelado", "concluido", "nao_compareceu"]).optional() });
export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; try { const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const settings = await getTenantSettingsForTenant(admin.tenantId); return NextResponse.json({ appointments: await listAdminAgenda(admin.tenantId, query.date, query.view, settings.fusoHorario, query.status as AppointmentStatus | undefined) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar a agenda" }, { status: 400 }); } }

export async function POST(request: Request) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; try { const input = bookingInputSchema.parse(await request.json()); const appointment = await createManualAppointment(admin.tenantId, input, admin.id); return NextResponse.json({ appointment }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível criar o agendamento" }, { status: 400 }); } }
