import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { createService, listServices } from "@/services/catalog";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { revalidatePath } from "next/cache";
import { hasCapability } from "@/lib/plans";

const price = z.object({ porte: z.string().min(1), valorCentavos: z.number().int().nonnegative() });
const schema = z.object({ categoriaId: z.string().uuid().nullable().optional(), nome: z.string().min(1).max(160), slug: z.string().min(1).max(160), descricao: z.string().max(2000).optional(), itensInclusos: z.array(z.string().max(200)).optional(), duracaoMinutos: z.number().int().positive(), fotoPath: z.string().regex(/^\/uploads\/[a-z0-9-]+\.webp$/).nullable().optional(), ordem: z.number().int().nonnegative().optional(), precos: z.array(price).optional() });
export async function GET(request: Request) { if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; return NextResponse.json({ services: await listServices(admin.tenantId, true) }); }
export async function POST(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin;
  const originError = requireSameOrigin(request); if (originError) return originError;
  try { const input = schema.parse(await request.json()); const service = await createService(admin.tenantId, input, (await getTenantSettingsForTenant(admin.tenantId)).portesVeiculo); revalidatePath("/servicos"); revalidatePath("/servicos/[slug]", "page"); return NextResponse.json({ service }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Serviço inválido" }, { status: 400 }); }
}
