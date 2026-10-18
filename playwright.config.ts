import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: "postgres://zapdetaily:zapdetaily@127.0.0.1:5432/zapdetaily",
      APP_URL: "http://127.0.0.1:3000",
      NODE_ENV: "test",
      ZD_PLAN: process.env.E2E_PLAN ?? "basic",
    },
  },
});
