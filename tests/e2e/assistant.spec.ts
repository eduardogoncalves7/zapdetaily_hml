import { expect, test } from "@playwright/test";

test.describe("assistente Plus", () => {
  test.skip(process.env.E2E_PLAN !== "plus" || !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD || !process.env.E2E_ASSISTANT_READY, "Requer plano Plus e ambiente administrativo preparado.");
  test("exibe estado de configuração", async ({ page }) => {
    await page.goto("/admin/login"); await page.getByLabel("E-mail").fill(process.env.E2E_ADMIN_EMAIL!); await page.getByLabel("Senha").fill(process.env.E2E_ADMIN_PASSWORD!); await page.getByRole("button", { name: "Entrar" }).click(); await page.goto("/admin/assistente"); await expect(page.getByRole("heading", { name: "Assistente" })).toBeVisible(); await expect(page.getByText(/Em breve|não configurado/i)).toBeVisible();
  });
});
