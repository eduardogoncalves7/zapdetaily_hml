import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { hasCapability } from "@/lib/plans";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { financeDashboard } from "@/services/finance";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!hasCapability("finance")) return new NextResponse(null, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const url = new URL(request.url); const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10); const period = (url.searchParams.get("period") ?? "month") as "day" | "week" | "month"; if (!["day", "week", "month"].includes(period)) return NextResponse.json({ error: "Período inválido" }, { status: 400 }); try { const settings = await getTenantSettingsForTenant(admin.tenantId); return NextResponse.json(await financeDashboard(admin.tenantId, date, period, settings.fusoHorario)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível carregar o financeiro" }, { status: 400 }); } }
