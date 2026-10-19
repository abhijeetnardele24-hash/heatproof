import { describe, it, expect } from "vitest";
import {
  auditContentForOverclaims,
  runClaimsAudit,
  PROHIBITED_CLAIM_RULES,
} from "../../scripts/check-evidence";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

describe("Evidence Claims Validator", () => {
  it("exposes active prohibited claim rule definitions", () => {
    expect(PROHIBITED_CLAIM_RULES.length).toBeGreaterThanOrEqual(8);
  });

  it("flags prohibited unqualified 100% offline claims", () => {
    const badText = "Operates with 100% offline guarantees across all devices.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("100% offline"))).toBe(true);
  });

  it("permits legitimate negative statements about 100% offline", () => {
    const legitimateText = "The team does not claim 100% offline disaster immunity.";
    const violations = auditContentForOverclaims(legitimateText, "mock.md");
    expect(violations.length).toBe(0);
  });

  it("flags tamper-proof claims", () => {
    const badText = "Our ledger provides tamper-proof guarantees for climate receipts.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("tamper-proof"))).toBe(true);
  });

  it("flags Zero Hallucination Guarantee claims", () => {
    const badText = "Offers a Zero Hallucination Guarantee for field workers.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("Zero Hallucination"))).toBe(true);
  });

  it("flags HeatProof guarantees claims", () => {
    const badText = "HeatProof guarantees that all cooling shelters will remain open.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("HeatProof guarantees"))).toBe(true);
  });

  it("flags unqualified Responsible Multimodal AI claims", () => {
    const badText = "Features a Responsible Multimodal AI assistant analyzing images.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("Responsible Multimodal AI"))).toBe(true);
  });

  it("permits negative statements regarding multimodal models", () => {
    const okText = "Operates without Responsible Multimodal AI black-boxes.";
    const violations = auditContentForOverclaims(okText, "mock.md");
    expect(violations.length).toBe(0);
  });

  it("flags Production-Ready overclaims", () => {
    const badText = "Status: Live, Verified, Production-Ready deployment.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("Production-Ready"))).toBe(true);
  });

  it("flags unsupported hundreds of millions and up to 35% claims", () => {
    const text1 = "Funds pledge hundreds of millions of dollars without proof.";
    const text2 = "Field audits show up to 35% of public cooling points are dry.";
    expect(auditContentForOverclaims(text1, "mock.md").length).toBeGreaterThanOrEqual(1);
    expect(auditContentForOverclaims(text2, "mock.md").length).toBeGreaterThanOrEqual(1);
  });

  it("flags Zero PII Guarantee claims", () => {
    const badText = "Our Zero PII Guarantee ensures full protection.";
    const violations = auditContentForOverclaims(badText, "mock.md");
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations.some((v) => v.pattern.includes("Zero PII Guarantee"))).toBe(true);
  });

  it("passes cleanly on all current submission-facing files in repository", () => {
    const violations = runClaimsAudit(rootDir);
    if (violations.length > 0) {
      console.error("Violations found in repo files:", violations);
    }
    expect(violations).toEqual([]);
  });
});
