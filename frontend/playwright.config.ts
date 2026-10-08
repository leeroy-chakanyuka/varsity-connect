import { defineConfig } from "@playwright/test";

/* smoke against local dev servers, data is created fresh per run */
export default defineConfig({
  testDir: "./e2e",
  timeout: 300_000,
  workers: 1,
  retries: 0,
  reporter: "line",
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
