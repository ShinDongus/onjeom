import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/mobile",
  testMatch: "action-flow.spec.mjs",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174",
    viewport: { width: 390, height: 844 },
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "node scripts/serve-mobile-preview.mjs",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
  reporter: "list",
});
