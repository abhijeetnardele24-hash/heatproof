import { chromium } from "playwright";
import { createServer } from "vite";
import fs from "fs";
import path from "path";

async function main() {
  const outputDir = path.resolve(process.cwd(), "docs/assets/screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🚀 Starting Vite development server for screenshot capture...");
  const server = await createServer({
    server: { port: 5173 },
  });
  await server.listen();
  const baseUrl = "http://localhost:5173";
  console.log(`📡 Server listening at ${baseUrl}`);

  const browser = await chromium.launch();
  console.log("📸 Starting HeatProof authentic screenshot capture...");

  try {
    // 1. Desktop Wayfinding (1440x900)
    {
      console.log("Capturing 01_civic_wayfinding_desktop.png (1440x900)...");
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, "01_civic_wayfinding_desktop.png"),
        fullPage: false,
      });
      await context.close();
    }

    // 2. Mobile Reporting with AI Assistant Proposal (390x844)
    {
      console.log("Capturing 02_mobile_reporting_ai.png (390x844)...");
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open first report modal
      const reportBtn = page.getByRole("button", { name: /report update/i }).first();
      await reportBtn.scrollIntoViewIfNeeded();
      await reportBtn.click({ force: true });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(outputDir, "02_mobile_reporting_ai.png"),
        fullPage: false,
      });
      await context.close();
    }

    // 3. Desktop Cryptographic Evidence Inspector (1440x900)
    {
      console.log("Capturing 03_cryptographic_inspector.png (1440x900)...");
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Open inspector on first card
      const inspectBtn = page.getByRole("button", { name: /inspect proof/i }).first();
      await inspectBtn.scrollIntoViewIfNeeded();
      await inspectBtn.click({ force: true });
      await page.waitForTimeout(800);

      await page.screenshot({
        path: path.join(outputDir, "03_cryptographic_inspector.png"),
        fullPage: false,
      });
      await context.close();
    }

    // 4. Desktop Civic Operations & Policy Command Dashboard (1440x900)
    {
      console.log("Capturing 04_operations_dashboard.png (1440x900)...");
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Switch to Operations & Policy tab
      const opsTab = page.getByRole("button", { name: /operations & policy/i });
      await opsTab.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(outputDir, "04_operations_dashboard.png"),
        fullPage: false,
      });
      await context.close();
    }

    console.log("✅ All 4 authentic screenshots successfully captured!");
  } finally {
    await browser.close();
    await server.close();
    console.log("🛑 Server closed cleanly.");
  }
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
