import { NextResponse } from "next/server";
import { checkDatabaseReady } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkDatabaseReady();

  if (!result.ready) {
    return NextResponse.json(
      { status: "not_ready", database: "unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "ready", database: "ok" });
}
