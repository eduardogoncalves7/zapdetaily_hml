import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { saveCatalogImage } from "@/lib/uploads";
import { hasCapability } from "@/lib/plans";

export async function POST(request: Request) {
  if (!hasCapability("booking")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 });
  const admin = await requireApiAdmin(request);
  if (admin instanceof NextResponse) return admin;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  try {
    const path = await saveCatalogImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload inválido" }, { status: 400 });
  }
}
