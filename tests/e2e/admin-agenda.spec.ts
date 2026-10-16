import { test, expect } from "@playwright/test";

test.describe("agenda administrativa", () => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD || !process.env.E2E_ADMIN_READY, "Requer admin criado e Postgres local com catálogo.");
  test("abre a agenda no fluxo autenticado", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill(process.env.E2E_ADMIN_EMAIL ?? "");
    await page.getByLabel("Senha").fill(process.env.E2E_ADMIN_PASSWORD ?? "");
    await page.getByRole("button", { name: /Entrar/i }).click();
    await page.goto("/admin/agenda");
    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dia" })).toBeVisible();
    await expect(page.getByText("Criação manual")).toBeVisible();
  });
});
