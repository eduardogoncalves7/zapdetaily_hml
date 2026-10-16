import { NextResponse } from "next/server";
import { requireApiAdmin } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireApiAdmin(request);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ admin });
}
