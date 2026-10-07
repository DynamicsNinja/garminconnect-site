import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  webServer: { command: "node scripts/e2e-server.mjs", port: 3000, reuseExistingServer: !process.env.CI, env: { HOSTNAME: "127.0.0.1", PORT: "3000", GARMIN_DEMO: "1", SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e" } },
  use: { baseURL: "http://127.0.0.1:3000" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
