import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/origin";
import { hasCapability } from "@/lib/plans";
import { getDb } from "@/lib/db";
type Params = { params: Promise<{ id: string }> };
export async function DELETE(request: Request, { params }: Params) { if (!hasCapability("adminPanel")) return NextResponse.json({ error: "Recurso não disponível neste plano" }, { status: 404 }); const admin = await requireApiAdmin(request); if (admin instanceof NextResponse) return admin; const originError = requireSameOrigin(request); if (originError) return originError; await getDb().query("DELETE FROM bloqueios WHERE tenant_id=$1 AND id=$2", [admin.tenantId, (await params).id]); return NextResponse.json({ status: "removed" }); }
