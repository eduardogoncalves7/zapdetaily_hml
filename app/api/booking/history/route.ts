import { NextResponse } from "next/server";
import { hasCapability } from "@/lib/plans";
import { CUSTOMER_COOKIE, bookingReadRateLimiter } from "@/lib/booking-http";
import { getDefaultTenantId } from "@/services/catalog";
import { getCustomerHistory } from "@/services/booking";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const rate = bookingReadRateLimiter.consume(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"); if (!rate.allowed) return NextResponse.json({ error: "Muitas consultas. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }); const token = request.headers.get("cookie")?.match(new RegExp(`${CUSTOMER_COOKIE}=([^;]+)`))?.[1]; if (!token) return NextResponse.json({ error: "Histórico privado não disponível" }, { status: 401 }); const tenantId = await getDefaultTenantId(); if (!tenantId) return NextResponse.json({ bookings: [] }); return NextResponse.json({ bookings: await getCustomerHistory(tenantId, token) }); }
