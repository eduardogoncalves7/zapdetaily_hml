import { NextResponse } from "next/server";
import { z } from "zod";
import { hasCapability } from "@/lib/plans";
import { bookingReadRateLimiter } from "@/lib/booking-http";
import { getDefaultTenantId } from "@/services/catalog";
import { listAvailableSlots } from "@/services/booking";
const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), porte: z.string().min(1), serviceIds: z.string().min(1) });
export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const rate = bookingReadRateLimiter.consume(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"); if (!rate.allowed) return NextResponse.json({ error: "Muitas consultas. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }); try { const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams)); const tenantId = await getDefaultTenantId(); if (!tenantId) return NextResponse.json({ slots: [] }); return NextResponse.json({ slots: await listAvailableSlots(tenantId, query.date, query.serviceIds.split(","), query.porte) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível consultar a disponibilidade" }, { status: 400 }); } }
