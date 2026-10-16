import { NextResponse } from "next/server";
import { z } from "zod";
import { hasCapability } from "@/lib/plans";
import { getDefaultTenantId } from "@/services/catalog";
import { listAvailableSlots } from "@/services/booking";

const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), porte: z.string().min(1), serviceIds: z.string().min(1) });
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  try { const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const tenantId = await getDefaultTenantId(); if (!tenantId) return NextResponse.json({ slots: [] }); const services = query.serviceIds.split(","); const available = await listAvailableSlots(tenantId, query.date, services, query.porte); return NextResponse.json({ slots: available }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível consultar a disponibilidade" }, { status: 400 }); }
}
