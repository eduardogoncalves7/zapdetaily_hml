import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateAdmin, createAdminSession, getClientIp, loginRateLimiter, setSessionCookie,
} from "../../../../lib/admin-auth";
import { requireSameOrigin } from "../../../../lib/origin";

const credentialsSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const rate = loginRateLimiter.consume(getClientIp(request));
  if (!rate.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, {
      status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }
  let credentials: z.infer<typeof credentialsSchema>;
  try {
    credentials = credentialsSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }
  const result = await authenticateAdmin(credentials.email, credentials.password);
  if (result.kind !== "success") {
    const status = result.kind === "locked" ? 429 : 401;
    return NextResponse.json({ error: "Credenciais inválidas ou conta temporariamente bloqueada." }, { status });
  }
  loginRateLimiter.reset(getClientIp(request));
  const response = NextResponse.json({ status: "authenticated", admin: { email: result.admin.email, nome: result.admin.nome } });
  setSessionCookie(response, await createAdminSession(result.admin.id));
  return response;
}
