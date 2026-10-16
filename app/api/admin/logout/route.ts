import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentAdmin, revokeAdminSession } from "../../../../lib/admin-auth";
import { requireSameOrigin } from "../../../../lib/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin(request);
  if (!admin) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  await revokeAdminSession(request);
  const response = NextResponse.json({ status: "logged_out" });
  clearSessionCookie(response);
  return response;
}
