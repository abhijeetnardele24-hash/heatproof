import { describe, it, expect } from "vitest";
import {
  parseCoverageSummary,
  parsePlaywrightReport,
  verifyBuildArtifacts,
  generateAuthoritativeReport,
} from "../../scripts/generate-evidence-report";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

describe("Authoritative Evidence Report Generator", () => {
  describe("Coverage Summary Parser", () => {
    it("correctly parses valid coverage summary JSON", () => {
      const validJson = JSON.stringify({
        total: {
          lines: { total: 100, covered: 87, pct: 87.4 },
          statements: { total: 100, covered: 87, pct: 87.4 },
          functions: { total: 50, covered: 49, pct: 98.61 },
          branches: { total: 40, covered: 33, pct: 81.69 },
        },
      });

      const parsed = parseCoverageSummary(validJson);
      expect(parsed.statements).toBe(87.4);
      expect(parsed.branches).toBe(81.69);
      expect(parsed.functions).toBe(98.61);
      expect(parsed.lines).toBe(87.4);
    });

    it("throws a descriptive error on malformed JSON", () => {
      expect(() => parseCoverageSummary("invalid-json{")).toThrow(/Failed to parse coverage JSON/);
    });

    it("throws an error when missing 'total' coverage node", () => {
      expect(() => parseCoverageSummary(JSON.stringify({ files: {} }))).toThrow(
        /missing 'total' coverage node/
      );
    });
  });

  describe("Playwright JSON Report Parser", () => {
    it("correctly parses execution metrics, projects, and pass counts", () => {
      const sampleReport = JSON.stringify({
        config: {
          projects: [{ name: "Mobile (320px)" }, { name: "Desktop (1440px)" }],
        },
        suites: [
          {
            specs: [
              {
                tests: [
                  {
                    results: [{ status: "passed", duration: 120 }],
                  },
                  {
                    results: [{ status: "passed", duration: 180 }],
                  },
                ],
              },
            ],
            suites: [
              {
                specs: [
                  {
                    tests: [
                      {
                        results: [{ status: "skipped", duration: 0 }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const parsed = parsePlaywrightReport(sampleReport);
      expect(parsed.total).toBe(3);
      expect(parsed.passed).toBe(2);
      expect(parsed.skipped).toBe(1);
      expect(parsed.failed).toBe(0);
      expect(parsed.durationMs).toBe(300);
      expect(parsed.viewports).toBe(2);
      expect(parsed.projects).toEqual(["Mobile (320px)", "Desktop (1440px)"]);
    });

    it("correctly identifies failed tests", () => {
      const failReport = JSON.stringify({
        config: { projects: [{ name: "Mobile" }] },
        suites: [
          {
            specs: [
              {
                tests: [
                  { results: [{ status: "failed", duration: 50 }] },
                  { results: [{ status: "timedOut", duration: 30000 }] },
                ],
              },
            ],
          },
        ],
      });

      const parsed = parsePlaywrightReport(failReport);
      expect(parsed.total).toBe(2);
      expect(parsed.passed).toBe(0);
      expect(parsed.failed).toBe(2);
    });

    it("throws an error on malformed Playwright JSON", () => {
      expect(() => parsePlaywrightReport("{malformed")).toThrow(/Failed to parse Playwright results/);
    });

    it("throws an error when missing 'suites' property", () => {
      expect(() => parsePlaywrightReport(JSON.stringify({ stats: {} }))).toThrow(/missing 'suites'/);
    });
  });

  describe("Build Artifact Verifier", () => {
    it("verifies index.html presence in dist directory", () => {
      const distPath = path.join(rootDir, "dist");
      if (fs.existsSync(distPath)) {
        const result = verifyBuildArtifacts(distPath);
        expect(result.success).toBe(true);
        expect(result.distArtifactsFound).toContain("index.html");
      }
    });

    it("throws when dist directory or index.html does not exist", () => {
      const nonExistent = path.join(rootDir, "dist-nonexistent-mock");
      expect(() => verifyBuildArtifacts(nonExistent)).toThrow(/dist directory not found/);
    });
  });

  describe("Authoritative Report Construction", () => {
    it("constructs full report with truthful SHA and parsed metrics", () => {
      const distPath = path.join(rootDir, "dist");
      const covPath = path.join(rootDir, "coverage", "coverage-summary.json");
      const pwPath = path.join(rootDir, "test-results", "results.json");

      if (fs.existsSync(distPath) && fs.existsSync(covPath) && fs.existsSync(pwPath)) {
        const report = generateAuthoritativeReport({
          commitShaOverride: "testcommit1234567890abcdef",
        });

        expect(report.verifiedSourceCommit).toBe("testcommit1234567890abcdef");
        expect(report.gitCommit).toBe("testcommit1234567890abcdef");
        expect(report.coverage.statements).toBeGreaterThanOrEqual(85);
        expect(report.coverage.branches).toBeGreaterThanOrEqual(80);
        expect(report.e2eTests.total).toBe(56);
        expect(report.e2eTests.passed).toBe(56);
        expect(report.e2eTests.failed).toBe(0);
        expect(report.e2eTests.viewports).toBe(7);
        expect(report.build.success).toBe(true);
      }
    });
  });
});
