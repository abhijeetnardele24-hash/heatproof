import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

interface RenderTarget {
  svgPath: string;
  outputPath: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

const targets: RenderTarget[] = [
  {
    svgPath: path.join(rootDir, "public", "icon.svg"),
    outputPath: path.join(rootDir, "public", "icon-192.png"),
    width: 192,
    height: 192,
    deviceScaleFactor: 1,
  },
  {
    svgPath: path.join(rootDir, "public", "icon.svg"),
    outputPath: path.join(rootDir, "public", "icon-512.png"),
    width: 512,
    height: 512,
    deviceScaleFactor: 1,
  },
  {
    svgPath: path.join(rootDir, "docs", "assets", "architecture.svg"),
    outputPath: path.join(rootDir, "docs", "assets", "architecture.png"),
    width: 2400,
    height: 1350,
    deviceScaleFactor: 1,
  },
  {
    svgPath: path.join(rootDir, "docs", "assets", "heatproof-devpost-thumbnail.svg"),
    outputPath: path.join(rootDir, "docs", "assets", "heatproof-devpost-thumbnail.png"),
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
  },
  {
    svgPath: path.join(rootDir, "docs", "assets", "heatproof-thumbnail.svg"),
    outputPath: path.join(rootDir, "docs", "assets", "heatproof-social-card.png"),
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  },
];

async function main() {
  console.log("🎨 Rendering raster visual assets via Playwright headless Chromium...");
  const browser = await chromium.launch();

  for (const target of targets) {
    if (!fs.existsSync(target.svgPath)) {
      console.warn(`⚠️ Source SVG missing: ${target.svgPath}`);
      continue;
    }

    const svgContent = fs.readFileSync(target.svgPath, "utf-8");
    const page = await browser.newPage({
      viewport: { width: target.width, height: target.height },
      deviceScaleFactor: target.deviceScaleFactor || 1,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

    await page.setContent(html, { waitUntil: "networkidle" });

    // Ensure output directory exists
    const dir = path.dirname(target.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({
      path: target.outputPath,
      clip: { x: 0, y: 0, width: target.width, height: target.height },
      omitBackground: false,
    });

    console.log(`✅ Rendered ${path.relative(rootDir, target.outputPath)} (${target.width}x${target.height})`);
    await page.close();
  }

  await browser.close();
  console.log("🎉 All visual assets generated successfully.");
}

main().catch((err) => {
  console.error("❌ Asset rendering failed:", err);
  process.exit(1);
});
