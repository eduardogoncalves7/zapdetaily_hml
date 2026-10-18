import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { hasCapability } from "@/lib/plans";
import { verifyWebhookSignature } from "@/modules/assistant/webhook-signature";

export const dynamic = "force-dynamic";

export function GET() { if (!hasCapability("assistant")) return new NextResponse(null, { status: 404 }); return NextResponse.json({ status: getEnv().ASSISTANT_ENABLED ? "aguardando_provedor" : "não configurado" }, { status: getEnv().ASSISTANT_ENABLED ? 200 : 503 }); }
export async function POST(request: Request) { if (!hasCapability("assistant")) return new NextResponse(null, { status: 404 }); const env = getEnv(); if (!env.ASSISTANT_ENABLED) return NextResponse.json({ error: "Assistente não configurado" }, { status: 503 }); const payload = await request.text(); const signatureOk = verifyWebhookSignature(payload, request.headers.get("x-webhook-signature"), null); if (!signatureOk) return NextResponse.json({ error: "Assinatura não verificada; provedor ainda não configurado" }, { status: 503 }); return NextResponse.json({ status: "recebido" }, { status: 202 }); }
