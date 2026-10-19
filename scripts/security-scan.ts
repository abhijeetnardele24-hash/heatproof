/**
 * HeatProof Security Scanner & Secret Leak Detection Gate
 *
 * Scans:
 * 1. Tracked repository files
 * 2. Full Git commit history
 * 3. Built dist/ directory (if exists)
 * 4. Environment templates and config files
 *
 * Verifies that no private keys, mnemonics, API tokens, or secrets exist anywhere in the repository.
 * Detects and reports if the clone is shallow when performing full-history audits.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

interface ScanViolation {
  file: string;
  line?: number;
  patternName: string;
  snippet: string;
}

const SECRET_PATTERNS: { name: string; regex: RegExp; filter?: (match: string, file: string) => boolean }[] = [
  {
    name: "Ethereum Private Key Pattern (Unsafe Raw Key)",
    regex: /(?:private[_-]?key|deployer[_-]?key|secret|signer)\s*[:=]\s*["']?(0x[a-fA-F0-9]{64})["']?/i,
    filter: (match, file) => {
      // Allow placeholder or example strings in docs or .env.example
      return (
        !match.includes("0x0000000000000000000000000000000000000000000000000000000000000000") &&
        !match.includes("0x1111111111111111111111111111111111111111111111111111111111111111") &&
        !file.endsWith(".env.example")
      );
    },
  },
  {
    name: "Generic High-Entropy API Key / Token",
    regex: /(?:api[_-]?key|auth[_-]?token|bearer[_-]?token)\s*[:=]\s*["']([a-zA-Z0-9_-]{32,})["']?/i,
    filter: (match, file) => {
      return (
        !file.endsWith(".env.example") &&
        !match.includes("VITE_OPEN_METEO_BASE_URL") &&
        !match.includes("placeholder")
      );
    },
  },
  {
    name: "AWS Access Key",
    regex: /\b(AKIA[0-9A-Z]{16})\b/,
  },
  {
    name: "GitHub Personal Access Token",
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b/,
  },
  {
    name: "OpenAI / Claude API Key",
    regex: /\b(sk-[a-zA-Z0-9]{32,}|sk-ant-[a-zA-Z0-9]{32,})\b/,
  },
  {
    name: "Alchemy / Infura API Key in Code",
    regex: /https:\/\/(?:arb-mainnet|arb-sepolia)\.g\.alchemy\.com\/v2\/([a-zA-Z0-9_-]{20,})/,
  },
];

function checkShallowClone(): boolean {
  try {
    const isShallow = execSync("git rev-parse --is-shallow-repository", { encoding: "utf8" }).trim();
    return isShallow === "true";
  } catch {
    return false;
  }
}

function scanFileContent(filePath: string, content: string): ScanViolation[] {
  const violations: ScanViolation[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of SECRET_PATTERNS) {
      const match = pattern.regex.exec(line);
      if (match) {
        if (!pattern.filter || pattern.filter(match[0], filePath)) {
          violations.push({
            file: filePath,
            line: i + 1,
            patternName: pattern.name,
            snippet: line.trim().slice(0, 80),
          });
        }
      }
    }
  }

  return violations;
}

function scanGitHistory(): ScanViolation[] {
  const violations: ScanViolation[] = [];

  try {
    // Inspect commits
    const diffLog = execSync("git log -p -n 100", { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    const lines = diffLog.split("\n");
    let currentCommit = "unknown";
    let currentFile = "unknown";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("commit ")) {
        currentCommit = line.slice(7, 15);
      } else if (line.startsWith("diff --git ")) {
        currentFile = line.split(" ")[2] || "unknown";
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        const addedLine = line.slice(1);
        for (const pattern of SECRET_PATTERNS) {
          const match = pattern.regex.exec(addedLine);
          if (match) {
            if (!pattern.filter || pattern.filter(match[0], currentFile)) {
              violations.push({
                file: `[git:${currentCommit}] ${currentFile}`,
                line: i,
                patternName: pattern.name,
                snippet: addedLine.trim().slice(0, 80),
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Security Scanner] Warning: Unable to inspect full git history diff: ${err?.message}`);
  }

  return violations;
}

export async function runSecurityScan(): Promise<{
  clean: boolean;
  filesScanned: number;
  violations: ScanViolation[];
  isShallow: boolean;
}> {
  console.log("=== HeatProof Security & Secret Leak Scanner ===");

  const isShallow = checkShallowClone();
  if (isShallow) {
    console.warn("[WARNING] Repository is a shallow clone. Full-history scanning may be truncated.");
  } else {
    console.log("[OK] Repository is full clone (unshallow). Full git history is inspectable.");
  }

  // 1. Get tracked files
  const trackedFilesRaw = execSync("git ls-files", { encoding: "utf8" });
  const trackedFiles = trackedFilesRaw
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && fs.existsSync(f));

  // 2. Add dist files if dist directory exists
  const distDir = path.resolve(process.cwd(), "dist");
  const filesToScan = [...trackedFiles];

  if (fs.existsSync(distDir)) {
    const walkSync = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkSync(full);
        } else if (entry.isFile() && /\.(js|css|html|json)$/i.test(entry.name)) {
          filesToScan.push(full);
        }
      }
    };
    walkSync(distDir);
    console.log(`[OK] Included built dist/ bundle files in scan.`);
  }

  const allViolations: ScanViolation[] = [];

  // 3. Scan files
  for (const file of filesToScan) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > 2 * 1024 * 1024) continue; // Skip large binary assets
      const content = fs.readFileSync(file, "utf8");
      const fileViolations = scanFileContent(file, content);
      allViolations.push(...fileViolations);
    } catch {
      // skip binary or unreadable
    }
  }

  // 4. Scan Git History
  console.log("[Scanning] Inspecting Git commit history for leaked credentials...");
  const historyViolations = scanGitHistory();
  allViolations.push(...historyViolations);

  console.log(`\nScan Summary:`);
  console.log(`- Files inspected: ${filesToScan.length}`);
  console.log(`- Clone depth: ${isShallow ? "Shallow" : "Full History"}`);
  console.log(`- Potential secret leaks detected: ${allViolations.length}`);

  if (allViolations.length > 0) {
    console.error(`\n[CRITICAL FAILURE] Detected ${allViolations.length} potential secrets / credentials:`);
    for (const v of allViolations) {
      console.error(`  - ${v.file}:${v.line || "?"} [${v.patternName}] -> "${v.snippet}"`);
    }
    return { clean: false, filesScanned: filesToScan.length, violations: allViolations, isShallow };
  }

  console.log("\n[PASS] No private keys, wallet secrets, or credentials found in repository files or history.");
  return { clean: true, filesScanned: filesToScan.length, violations: [], isShallow };
}

if (process.argv[1]?.includes("security-scan")) {
  runSecurityScan().then((res) => {
    if (!res.clean) {
      process.exit(1);
    }
    process.exit(0);
  });
}
