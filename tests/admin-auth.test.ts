import { describe, expect, it } from "vitest";
import { GET as getMe } from "../app/api/admin/me/route";
import { GET as getDashboard } from "../app/api/admin/dashboard/route";
import { POST as postLogout } from "../app/api/admin/logout/route";
import { POST as postLogin } from "../app/api/admin/login/route";
import { AttemptRateLimiter } from "../lib/auth-rate-limit";
import { getFailedLoginState, isSessionActive } from "../lib/admin-auth";
import { hashPassword, verifyPassword } from "../lib/password";

describe("autenticação administrativa", () => {
  it.each([getMe, getDashboard])("nega rota protegida sem sessão", async (handler) => {
    const response = await handler(new Request("http://localhost/api/admin/protected"));
    expect(response.status).toBe(401);
  });

  it("nega logout sem sessão", async () => {
    const response = await postLogout(new Request("http://localhost/api/admin/logout", {
      method: "POST", headers: { origin: "http://localhost" },
    }));
    expect(response.status).toBe(401);
  });

  it("verifica Origin antes de processar login", async () => {
    const response = await postLogin(new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { origin: "https://outro.exemplo", "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@exemplo.test", password: "senha" }),
    }));
    expect(response.status).toBe(403);
  });

  it("faz hash scrypt e não aceita senha errada", async () => {
    const encoded = await hashPassword("senha-de-teste");
    expect(encoded.startsWith("scrypt$")).toBe(true);
    await expect(verifyPassword("senha-de-teste", encoded)).resolves.toBe(true);
    await expect(verifyPassword("outra-senha", encoded)).resolves.toBe(false);
  });

  it("bloqueia novas tentativas após o limite de rate limit", () => {
    const limiter = new AttemptRateLimiter(2, 60_000);
    expect(limiter.consume("ip", 1000)).toEqual({ allowed: true });
    expect(limiter.consume("ip", 1001)).toEqual({ allowed: true });
    expect(limiter.consume("ip", 1002).allowed).toBe(false);
    expect(limiter.consume("ip", 61_001)).toEqual({ allowed: true });
  });

  it("bloqueia a conta na quinta senha incorreta por quinze minutos", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    expect(getFailedLoginState(3, now).lockedUntil).toBeNull();
    const state = getFailedLoginState(4, now);
    expect(state.attempts).toBe(5);
    expect(state.lockedUntil?.getTime()).toBe(now.getTime() + 15 * 60 * 1000);
  });

  it("considera sessão expirada ou revogada inativa", () => {
    const future = new Date("2030-01-01T00:00:00Z");
    expect(isSessionActive({ expiraEm: new Date("2030-01-02T00:00:00Z"), revogadoEm: null }, future)).toBe(true);
    expect(isSessionActive({ expiraEm: new Date("2029-12-31T00:00:00Z"), revogadoEm: null }, future)).toBe(false);
    expect(isSessionActive({ expiraEm: new Date("2030-01-02T00:00:00Z"), revogadoEm: future }, future)).toBe(false);
  });
});
