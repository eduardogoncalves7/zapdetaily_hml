import { NextResponse } from "next/server";
import { hasCapability } from "@/lib/plans";
import { requireSameOrigin } from "@/lib/origin";
import { getDefaultTenantId } from "@/services/catalog";
import { cancelBooking } from "@/services/booking";
import { CUSTOMER_COOKIE } from "@/lib/booking-http";

type Params = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, { params }: Params) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const originError = requireSameOrigin(request); if (originError) return originError; const token = request.headers.get("cookie")?.match(new RegExp(`${CUSTOMER_COOKIE}=([^;]+)`))?.[1]; if (!token) return NextResponse.json({ error: "Histórico privado não disponível" }, { status: 401 }); const tenantId = await getDefaultTenantId(); if (!tenantId) return NextResponse.json({ error: "Tenant não configurado" }, { status: 503 }); const canceled = await cancelBooking(tenantId, (await params).id, token); return canceled ? NextResponse.json({ status: "cancelado" }) : NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 }); }
