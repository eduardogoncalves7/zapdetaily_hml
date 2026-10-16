import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "./db";
import { getEnv } from "./env";
import { AttemptRateLimiter } from "./auth-rate-limit";
import { hashPassword, verifyPassword } from "./password";

export const ADMIN_SESSION_COOKIE = "zd_admin_session";
export const MAX_PASSWORD_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export const loginRateLimiter = new AttemptRateLimiter(10, 60_000);

export function getFailedLoginState(currentAttempts: number, now = new Date()): { attempts: number; lockedUntil: Date | null } {
  const attempts = currentAttempts + 1;
  return { attempts, lockedUntil: attempts >= MAX_PASSWORD_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MS) : null };
}

export type AdminUser = {
  id: string;
  tenantId: string;
  email: string;
  nome: string;
  papel: "owner" | "admin" | "staff";
};

type AdminSessionRecord = { expiraEm: Date; revogadoEm: Date | null };

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isSessionActive(record: AdminSessionRecord, now = new Date()): boolean {
  return record.revogadoEm === null && record.expiraEm.getTime() > now.getTime();
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getEnv().ZD_ADMIN_SESSION_TTL_SECONDS,
  };
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, cookieOptions());
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function authenticateAdmin(email: string, password: string): Promise<
  { kind: "success"; admin: AdminUser } | { kind: "invalid" } | { kind: "locked" }
> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{
      id: string; tenant_id: string; email: string; nome: string; papel: AdminUser["papel"];
      senha_hash: string; ativo: boolean; failed_attempts: number; locked_until: Date | null;
    }>(`SELECT id, tenant_id, email, nome, papel, senha_hash, ativo, failed_attempts, locked_until
          FROM admin_users WHERE lower(email) = lower($1) FOR UPDATE`, [email.trim()]);
    const row = result.rows[0];
    if (!row) {
      await hashPassword(password);
      await client.query("ROLLBACK");
      return { kind: "invalid" };
    }
    const now = new Date();
    if (!row.ativo || (row.locked_until && row.locked_until.getTime() > now.getTime())) {
      await client.query("COMMIT");
      return { kind: "locked" };
    }
    if (!await verifyPassword(password, row.senha_hash)) {
      const { attempts, lockedUntil } = getFailedLoginState(row.failed_attempts, now);
      await client.query(
        "UPDATE admin_users SET failed_attempts = $1, locked_until = $2, atualizado_em = now() WHERE id = $3",
        [attempts, lockedUntil, row.id],
      );
      await client.query("COMMIT");
      return lockedUntil ? { kind: "locked" } : { kind: "invalid" };
    }
    await client.query(
      "UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, ultimo_login_em = now(), atualizado_em = now() WHERE id = $1",
      [row.id],
    );
    await client.query("COMMIT");
    return { kind: "success", admin: { id: row.id, tenantId: row.tenant_id, email: row.email, nome: row.nome, papel: row.papel } };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function createAdminSession(adminUserId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getEnv().ZD_ADMIN_SESSION_TTL_SECONDS * 1000);
  await getDb().query(
    "INSERT INTO admin_sessions (admin_user_id, token_hash, expira_em) VALUES ($1, $2, $3)",
    [adminUserId, hashSessionToken(token), expiresAt],
  );
  return token;
}

async function getAdminByToken(token: string): Promise<AdminUser | null> {
  const result = await getDb().query<{
    id: string; tenant_id: string; email: string; nome: string; papel: AdminUser["papel"];
    expira_em: Date; revogado_em: Date | null;
  }>(`SELECT u.id, u.tenant_id, u.email, u.nome, u.papel, s.expira_em, s.revogado_em
        FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = $1 AND u.ativo = true`, [hashSessionToken(token)]);
  const row = result.rows[0];
  if (!row || !isSessionActive({ expiraEm: row.expira_em, revogadoEm: row.revogado_em })) return null;
  await getDb().query("UPDATE admin_sessions SET ultimo_acesso_em = now() WHERE token_hash = $1", [hashSessionToken(token)]);
  return { id: row.id, tenantId: row.tenant_id, email: row.email, nome: row.nome, papel: row.papel };
}

function getCookieToken(request: Request): string | undefined {
  return request.headers.get("cookie")?.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`))?.[1];
}

export async function getCurrentAdmin(request: Request): Promise<AdminUser | null> {
  const token = getCookieToken(request);
  if (!token) return null;
  try { return await getAdminByToken(token); } catch { return null; }
}

export async function getCurrentAdminFromCookies(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try { return await getAdminByToken(token); } catch { return null; }
}

export async function revokeAdminSession(request: Request): Promise<void> {
  const token = getCookieToken(request);
  if (token) await getDb().query("UPDATE admin_sessions SET revogado_em = now() WHERE token_hash = $1 AND revogado_em IS NULL", [hashSessionToken(token)]);
}

export async function requireApiAdmin(request: Request): Promise<AdminUser | NextResponse> {
  const admin = await getCurrentAdmin(request);
  if (!admin) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return admin;
}
