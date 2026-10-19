import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Mobile Small (320px)",
      use: {
        viewport: { width: 320, height: 568 },
        isMobile: true,
      },
    },
    {
      name: "Mobile Compact (360px)",
      use: {
        viewport: { width: 360, height: 640 },
        isMobile: true,
      },
    },
    {
      name: "Mobile Standard (390px)",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
    {
      name: "Tablet (768px)",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "Laptop (1024px)",
      use: {
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: "Desktop HD (1440px)",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "Desktop Large (1920px)",
      use: {
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
