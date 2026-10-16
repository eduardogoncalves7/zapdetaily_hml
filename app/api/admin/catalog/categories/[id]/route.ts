import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { getDb } from "@/lib/db";

const schema = z.object({ nome: z.string().min(1).max(120), slug: z.string().min(1).max(120), descricao: z.string().max(500).default(""), ativo: z.boolean().default(true), ordem: z.number().int().nonnegative().default(0) });
type Params = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Params) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; try { const input = schema.parse(await request.json()); await getDb().query("UPDATE categorias SET nome=$1, slug=$2, descricao=$3, ativo=$4, ordem=$5, atualizado_em=now() WHERE tenant_id=$6 AND id=$7", [input.nome.trim(), input.slug.trim(), input.descricao, input.ativo, input.ordem, admin.tenantId, (await params).id]); return NextResponse.json({ status: "updated" }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Categoria inválida" }, { status: 400 }); } }
export async function DELETE(request: Request, { params }: Params) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; await getDb().query("UPDATE categorias SET ativo=false, atualizado_em=now() WHERE tenant_id=$1 AND id=$2", [admin.tenantId, (await params).id]); return NextResponse.json({ status: "deactivated" }); }
