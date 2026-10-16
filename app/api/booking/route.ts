import { NextResponse } from "next/server";
import { hasCapability } from "@/lib/plans";
import { requireSameOrigin } from "@/lib/origin";
import { CUSTOMER_COOKIE, bookingRateLimiter } from "@/lib/booking-http";
import { getDefaultTenantId } from "@/services/catalog";
import { bookingInputSchema, BookingConflictError, BookingValidationError, createBooking, formatWhatsAppMessage } from "@/services/booking";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const originError = requireSameOrigin(request); if (originError) return originError;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; const rate = bookingRateLimiter.consume(ip); if (!rate.allowed) return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  try {
    const input = bookingInputSchema.parse(await request.json()); if (input.honeypot) return NextResponse.json({ error: "Solicitação inválida" }, { status: 400 }); const tenantId = await getDefaultTenantId(); if (!tenantId) return NextResponse.json({ error: "Tenant não configurado" }, { status: 503 });
    const token = request.headers.get("cookie")?.match(new RegExp(`${CUSTOMER_COOKIE}=([^;]+)`))?.[1]; const result = await createBooking(tenantId, input, token); const settings = await getTenantSettingsForTenant(tenantId); const response = NextResponse.json({ booking: result, whatsapp: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(formatWhatsAppMessage({ nome: input.nome, id: result.id, inicio: result.inicio }))}` : null }, { status: 201 }); if (result.accessToken) response.cookies.set(CUSTOMER_COOKIE, result.accessToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 }); return response;
  } catch (error) { if (error instanceof BookingConflictError) return NextResponse.json({ error: error.message }, { status: 409 }); if (error instanceof BookingValidationError || error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ error: "Não foi possível criar o agendamento" }, { status: 500 }); }
}
