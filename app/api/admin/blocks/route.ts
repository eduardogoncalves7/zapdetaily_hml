import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { getDb } from "@/lib/db";
const schema = z.object({ inicio: z.string().datetime({ offset: true }), fim: z.string().datetime({ offset: true }), motivo: z.string().max(300).default("") });
export const dynamic = "force-dynamic";
export async function GET(request: Request) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const result = await getDb().query("SELECT id, inicio_em AS inicio, fim_em AS fim, motivo FROM bloqueios WHERE tenant_id=$1 ORDER BY inicio_em DESC LIMIT 100", [admin.tenantId]); return NextResponse.json({ blocks: result.rows }); }
export async function POST(request: Request) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; try { const input = schema.parse(await request.json()); const result = await getDb().query("INSERT INTO bloqueios (tenant_id, inicio_em, fim_em, motivo) VALUES ($1,$2,$3,$4) RETURNING id, inicio_em AS inicio, fim_em AS fim, motivo", [admin.tenantId, input.inicio, input.fim, input.motivo]); return NextResponse.json({ block: result.rows[0] }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Bloqueio inválido" }, { status: 400 }); } }
