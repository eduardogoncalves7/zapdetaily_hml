import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { setServiceActive, updateService } from "@/services/catalog";
import { getTenantSettingsForTenant } from "@/lib/tenant-settings";
import { hasCapability } from "@/lib/plans";

const price = z.object({ porte: z.string().min(1), valorCentavos: z.number().int().nonnegative() });
const schema = z.object({ categoriaId: z.string().uuid().nullable().optional(), nome: z.string().min(1).max(160), slug: z.string().min(1).max(160), descricao: z.string().max(2000).optional(), itensInclusos: z.array(z.string().max(200)).optional(), duracaoMinutos: z.number().int().positive(), fotoPath: z.string().regex(/^\/uploads\/[a-z0-9-]+\.webp$/).nullable().optional(), ordem: z.number().int().nonnegative().optional(), precos: z.array(price).optional(), ativo: z.boolean().optional() });
type Params = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Params) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin;
  const originError = requireSameOrigin(request); if (originError) return originError;
  try { await updateService(admin.tenantId, (await params).id, schema.parse(await request.json()), (await getTenantSettingsForTenant(admin.tenantId)).portesVeiculo); revalidatePath("/servicos"); revalidatePath("/servicos/[slug]", "page"); return NextResponse.json({ status: "updated" }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Serviço inválido" }, { status: 400 }); }
}
export async function DELETE(request: Request, { params }: Params) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin;
  const originError = requireSameOrigin(request); if (originError) return originError;
  await setServiceActive(admin.tenantId, (await params).id, false); revalidatePath("/servicos"); revalidatePath("/servicos/[slug]", "page"); return NextResponse.json({ status: "deactivated" });
}
