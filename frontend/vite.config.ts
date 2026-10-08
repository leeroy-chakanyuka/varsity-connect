import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    /* playwright lives in e2e/, vitest never touches it */
    exclude: ["e2e/**", "node_modules/**"],
    /* two-core dev machine, don't thrash it with a worker per file */
    pool: "forks",
    poolOptions: {
      forks: { maxForks: 2 },
    },
  },
});
