import { NextResponse } from "next/server";

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? requestUrl.host;
  return origin === `${protocol}://${host}`;
}

export function requireSameOrigin(request: Request): NextResponse | null {
  if (hasSameOrigin(request)) return null;
  return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
}
