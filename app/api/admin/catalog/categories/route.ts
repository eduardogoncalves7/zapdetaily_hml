import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { createCategory, listCategories } from "@/services/catalog";
import { hasCapability } from "@/lib/plans";

const schema = z.object({ nome: z.string().min(1).max(120), slug: z.string().min(1).max(120), descricao: z.string().max(500).default(""), ativo: z.boolean().default(true), ordem: z.number().int().nonnegative().default(0) });
export async function GET(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ categories: await listCategories(admin.tenantId, true) });
}
export async function POST(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin;
  const originError = requireSameOrigin(request); if (originError) return originError;
  try { return NextResponse.json({ category: await createCategory(admin.tenantId, schema.parse(await request.json())) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Categoria inválida" }, { status: 400 }); }
}
