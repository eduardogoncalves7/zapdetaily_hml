import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { createFinanceCategory, listFinanceCategories } from "@/services/finance";
export async function GET(request: Request) { if (!hasCapability("finance")) return new NextResponse(null, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; return NextResponse.json({ categories: await listFinanceCategories(admin.tenantId) }); }
export async function POST(request: Request) { if (!hasCapability("finance")) return new NextResponse(null, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const origin = requireSameOrigin(request); if (origin) return origin; try { const input = z.object({ tipo: z.enum(["receita", "despesa"]), nome: z.string().trim().min(2).max(80) }).parse(await request.json()); await createFinanceCategory(admin.tenantId, input.tipo, input.nome, admin.id); return NextResponse.json({ ok: true }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Categoria inválida" }, { status: 400 }); } }
