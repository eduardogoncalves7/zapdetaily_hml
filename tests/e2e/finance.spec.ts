import { expect, test } from "@playwright/test";

test("financeiro fica indisponível no basic", async ({ request }) => {
  test.skip(process.env.E2E_PLAN !== "basic", "Teste específico do plano basic.");
  expect((await request.get("/api/finance")).status()).toBe(404);
});

test.describe("financeiro nos planos pagos", () => {
  test.skip(!["standard", "plus"].includes(process.env.E2E_PLAN ?? "") || !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD || !process.env.E2E_FINANCE_READY, "Requer Postgres, seed e credenciais administrativas.");
  test("abre o dashboard financeiro", async ({ page }) => {
    await page.goto("/admin/login"); await page.getByLabel("E-mail").fill(process.env.E2E_ADMIN_EMAIL!); await page.getByLabel("Senha").fill(process.env.E2E_ADMIN_PASSWORD!); await page.getByRole("button", { name: "Entrar" }).click(); await page.goto("/finance"); await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible(); await expect(page.getByText("Receitas x despesas")).toBeVisible();
  });
});
