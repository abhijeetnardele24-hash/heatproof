import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/ai/**",
        "src/climate/**",
        "src/domain/**",
        "src/ledger/**",
        "src/privacy/**",
      ],
      exclude: [
        "node_modules/",
        "dist/",
        "scripts/",
        "tests/",
        "**/*.d.ts",
        "vite.config.ts",
        "vitest.config.ts",
        "playwright.config.ts",
        "eslint.config.js",
        "src/ai/benchmarkData.ts",
        "src/domain/seedData.ts",
      ],
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 90,
        lines: 85,
      },
    },
  },
});
