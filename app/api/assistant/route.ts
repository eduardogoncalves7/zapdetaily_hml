import { NextResponse } from "next/server";
import { hasCapability } from "@/lib/plans";

export const dynamic = "force-dynamic";

export function GET() {
  if (!hasCapability("assistant")) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ status: "available", module: "assistant" });
}
