/* =========================================================
   STUDIA — Playwright konfiguracija za E2E smoke-testove
   Pokretanje: npm run test:e2e
   ========================================================= */

const { defineConfig, devices } = require("@playwright/test");

const PORT = Number(process.env.PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MOCK_PROXY_URL = "http://127.0.0.1:8788/api/health";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off"
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],

  webServer: [
    {
      command: "node scripts/static-server.js",
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: "node scripts/mock-moodle-proxy.js",
      url: MOCK_PROXY_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    }
  ]
});
