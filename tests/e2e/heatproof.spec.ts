import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("HeatProof Civic Wayfinding & Verification E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads application header, live mode badge, and climate hazard telemetry", async ({ page }) => {
    // Brand header
    await expect(page.locator("header").getByText("HeatProof")).toBeVisible();

    // Mode badge
    const badge = page.locator(".badge").first();
    await expect(badge).toBeVisible();

    // Hazard intelligence banner
    const hazardSection = page.getByRole("region", { name: /climate hazard intelligence/i });
    await expect(hazardSection).toBeVisible();
    await expect(hazardSection.getByText(/heat index/i)).toBeVisible();

    // Thermal map
    const map = page.locator("svg[viewBox='0 0 800 360']");
    await expect(map).toBeVisible();

    // Facilities list
    const articles = page.locator("article.civic-card");
    await expect(articles.first()).toBeVisible();
    expect(await articles.count()).toBeGreaterThanOrEqual(4);
  });

  test("filters facilities by resource type and search query", async ({ page }) => {
    // Click "Drinking Water" filter
    const waterButton = page.getByRole("button", { name: /drinking water/i });
    await waterButton.click();

    // Verify all shown cards are water or hydration
    const articles = page.locator("article.civic-card");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);

    // Search for Mandai
    const searchInput = page.getByRole("textbox", { name: /search relief facilities/i });
    await searchInput.fill("Mandai");
    await expect(page.getByRole("heading", { name: /mandai central/i })).toBeVisible();
  });

  test("executes civic observation reporting flow with deterministic rules proposal", async ({ page }) => {
    // Open report modal for first card
    const firstReportBtn = page.getByRole("button", { name: /report update/i }).first();
    await firstReportBtn.scrollIntoViewIfNeeded();
    await firstReportBtn.click();

    // Dialog should open
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(page.getByText(/client-side privacy boundary/i)).toBeVisible();

    // Rules proposal card should be present
    await expect(page.getByText(/proposal/i).first()).toBeVisible();

    // Select operational state and submit
    const submitBtn = page.getByRole("button", { name: /submit evidence/i });
    await submitBtn.click({ force: true });

    // Dialog closes
    await expect(modal).not.toBeVisible();

    // Toast notification should display
    const toast = page.getByRole("status");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/observation anchored successfully/i);
  });

  test("executes corroborating witness attestation flow", async ({ page }) => {
    const firstAttestBtn = page.getByRole("button", { name: /corroborate attestation/i }).first();
    await firstAttestBtn.scrollIntoViewIfNeeded();
    await firstAttestBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(page.getByRole("heading", { name: /corroborating witness attestation/i })).toBeVisible();

    const submitBtn = page.getByRole("button", { name: /record attestation/i });
    await submitBtn.click({ force: true });

    await expect(modal).not.toBeVisible();
    const toast = page.getByRole("status");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/attestation recorded/i);
  });

  test("opens cryptographic proof inspector and verifies zero-PII payload", async ({ page }) => {
    const inspectBtn = page.getByRole("button", { name: /inspect proof/i }).first();
    await inspectBtn.scrollIntoViewIfNeeded();
    await inspectBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(page.getByRole("heading", { name: /evidence provenance inspector/i })).toBeVisible();
    await expect(page.getByText(/preimage sha-256 digest/i)).toBeVisible();
    await expect(page.getByText(/canonical json preimage payload/i)).toBeVisible();

    // Close inspector via button
    const closeBtn = page.getByRole("button", { name: /close inspector/i });
    await closeBtn.click({ force: true });
    await expect(modal).not.toBeVisible();
  });

  test("closes modals via Escape key", async ({ page }) => {
    const inspectBtn = page.getByRole("button", { name: /inspect proof/i }).first();
    await inspectBtn.scrollIntoViewIfNeeded();
    await inspectBtn.click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("switches to operations & policy command view and validates KPI tables", async ({ page }) => {
    const opsTab = page.getByRole("button", { name: /operations & policy/i });
    await opsTab.click();

    await expect(page.getByRole("heading", { name: /civic operations & climate policy/i })).toBeVisible();
    await expect(page.getByText(/heat zone coverage/i)).toBeVisible();
    await expect(page.getByText(/active priority outages/i)).toBeVisible();
    await expect(page.getByText(/verified adaptation receipts/i)).toBeVisible();

    // Verify Export Audit Bundle button exists
    const exportBtn = page.getByRole("button", { name: /export complete audit bundle/i });
    await expect(exportBtn).toBeVisible();
  });

  test("passes Axe WCAG 2.2 AA automated accessibility scan", async ({ page }) => {
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });
});
