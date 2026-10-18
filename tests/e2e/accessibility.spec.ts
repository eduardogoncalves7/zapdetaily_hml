import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("qualidade web", () => {
  test.skip(!process.env.E2E_BOOKING_READY, "Requer catálogo e tenant demo preparados.");
  for (const path of ["/", "/servicos", "/agendamento"]) test(`axe sem violações críticas em ${path}`, async ({ page }) => { await page.goto(path); const results = await new AxeBuilder({ page }).analyze(); expect(results.violations, JSON.stringify(results.violations)).toEqual([]); });
  test("carrega a tela pública em tempo aceitável no celular", async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); const response = await page.goto("/servicos"); expect(response?.ok()).toBeTruthy(); const domContentLoaded = await page.evaluate(() => performance.getEntriesByType("navigation")[0] ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).domContentLoadedEventEnd : 0); expect(domContentLoaded).toBeLessThan(5000); });
});
