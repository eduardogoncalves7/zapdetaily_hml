import { test, expect } from "@playwright/test";

test.describe("agendamento público", () => {
  test.skip(!process.env.E2E_BOOKING_READY, "Requer Postgres local migrado e seed de catálogo.");
  test("conclui o fluxo em viewport de celular", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/agendamento");
    await page.getByPlaceholder("Seu nome").fill("Cliente Demo");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("(00) 00000-0000").fill("11999999999");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Moto" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.locator('input[type="date"]').fill("2030-01-15");
    await page.getByRole("button", { name: "Ver horários" }).click();
    await expect(page.getByText("Escolha um horário")).toBeVisible();
    await page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first().click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Confirmar agendamento" }).click();
    await expect(page.getByText("Agendamento criado como pendente.")).toBeVisible();
  });
});
