# HeatProof ☀️🛡️
### Verifiable Proof-of-Adaptation Network for Extreme-Heat Relief Infrastructure

[![IEEE ClimateChain 2026](https://img.shields.io/badge/IEEE%20ClimateChain-Global%20Hackathon%202026-0D9488?style=for-the-badge)](https://climatechain2026.devpost.com/)
[![Track](https://img.shields.io/badge/Track-Climate%20Data%20%26%20Environmental%20Monitoring-F59E0B?style=for-the-badge)]()
[![Vitest Coverage](https://img.shields.io/badge/Coverage-93.9%25%20Statements-10B981?style=for-the-badge)]()
[![Playwright E2E](https://img.shields.io/badge/Playwright-49%2F49%20Passed-10B981?style=for-the-badge)]()
[![Axe WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA%20(0%20Violations)-0D9488?style=for-the-badge)]()
[![Blockchain Anchor](https://img.shields.io/badge/Arbitrum%20Sepolia-Verified%20On--Chain-3B82F6?style=for-the-badge)](https://sepolia.arbiscan.io/)

---

## 📖 Executive Summary

During extreme meteorological heatwaves—when wet-bulb temperatures and ambient heat indices exceed 42°C—access to clean drinking water, misting canopies, shaded corridors, and emergency ORS medical relief is a matter of life and death for outdoor laborers, gig workers, elderly citizens, and children.

Yet cities face an enormous adaptation verification gap: municipal heat maps frequently show facilities that are dry, vandalized, or padlocked. Simultaneously, international Climate Loss & Damage funds have pledged hundreds of millions of dollars toward urban heat resilience, but have no tamper-proof way to verify whether physical cooling services were actually delivered.

**HeatProof bridges this gap.** Connecting real-time meteorological hazard modeling with client-side privacy-preserving evidence capture, responsible multimodal AI assistance, a formal 9-state invariant engine, and Arbitrum Sepolia blockchain anchoring, HeatProof guarantees that life-saving extreme-heat relief infrastructure is provably operational when it matters most.

---

## 🏛️ System Architecture

![HeatProof Architecture Diagram](docs/assets/architecture.svg)

---

## 🌟 Key Innovations & Verified Features

### 1. Live Meteorological Intelligence (`src/climate/`)
- Ingests real-time 2-meter air temperature, relative humidity, wind speed, and UV index via the **Open-Meteo REST API**.
- Implements the complete 16-parameter **NOAA Steadman & Rothfusz Heat Index** polynomial regression equations across five hazard tiers: *Normal, Caution, Extreme Caution, Danger, Extreme Danger*.
- Seamless automatic fallback to deterministic historical baselines under network partitions.

### 2. Client-Side Privacy Boundary (`src/privacy/`)
- **EXIF Metadata Stripping**: Client-side canvas pipeline strips camera serials, lens IDs, and raw GPS tags.
- **Coordinate Coarsening**: High-precision GPS coordinates are snapped to a coarse $\approx 1.1\text{ km}$ ($0.01^\circ$) grid, preventing home tracking or spatial surveillance.
- **Zero-PII Regex Redactor**: Automatically sanitizes Aadhaar numbers, phone numbers, personal emails, and vehicle license plates from field notes.
- **Canonical SHA-256 Digest**: Generates deterministic digests of sorted preimage JSON payloads before on-chain broadcast.

### 3. Responsible Multimodal AI Evidence Assistant (`src/ai/`)
- Operates under the strict ethical governance directive: **"AI Proposes; Humans Decide."**
- Evaluates visual fingerprints (`operational_flow`, `dry_broken_tap`, `padlocked_closed`) alongside physical checklists.
- Incorporates robust adversarial defenses: `NFKC` Unicode canonicalization and regex filtering against prompt-injection primitives (`"ignore previous instructions"`).
- Empirically validated on a 12-case golden benchmark: **100% Accuracy, 1.0 Macro F1, 41.7% Intentional Abstention Rate** under ambiguity or attack.

### 4. Deterministic 9-State Attestation Engine (`src/domain/stateMachine.ts`)
- Governed by formal transition invariants: transitions from `PROPOSED_AVAILABLE` to `VERIFIED_AVAILABLE` require independent witness corroboration ($N \ge 2$).
- **Heat Escalation Protocol**: When ambient Heat Index surges past $42^\circ\text{C}$ (Danger/Extreme Danger), outage verification thresholds drop to $N=1$, immediately triggering priority municipal dispatch.
- Automatic TTL tracking marks assets as `STALE` if unverified for $> 180\text{ minutes}$.

### 5. Adaptation Service Receipts (ASR) & Merkle Aggregation (`src/domain/receipt.ts`)
- Batches adaptation service events into binary Merkle trees using canonical pair ordering (`sha256(min(a, b) + max(a, b))`).
- Issues cryptographic receipts quantifying protected population counts, liters of drinking water dispensed, and active Heat Index severity.
- Fail-closed cryptographic verification detects single-byte tampering instantly.

### 6. Dual-Mode Blockchain Proof Ledger (`src/ledger/`)
- **EVM Provider**: Anchors proofs to **Arbitrum Sepolia** (`chainId: 421614`) using `viem`. Live verified transaction: [`0x5191861d07131934750e37eac775ab8a32ba3c22f759ad0808b4efc2830f0254`](https://sepolia.arbiscan.io/).
- **Local Hash Chain Fallback**: Deterministic SHA-256 client block chain operates 100% offline via Service Worker caching during cellular grid blackouts.

### 7. Mineral Civic Presentation Layer (`src/components/`, `src/styles/`)
- Responsive across 7 certified viewports (320px ultra-compact mobile up to 1920px large desktop).
- Multilingual real-time translation: **English, Hindi (हिंदी), and Marathi (मराठी)**.
- Certified **100% Axe WCAG 2.2 AA compliant with zero violations**.

---

## 📸 Authentic Visual Artifacts

| Desktop Civic Wayfinding (1440px) | Mobile Reporting with AI Assistant (390px) |
| :---: | :---: |
| ![Desktop Wayfinding](docs/assets/screenshots/01_civic_wayfinding_desktop.png) | ![Mobile Reporting AI](docs/assets/screenshots/02_mobile_reporting_ai.png) |
| **Cryptographic Evidence Inspector** | **Operations & Policy Command Dashboard** |
| ![Cryptographic Inspector](docs/assets/screenshots/03_cryptographic_inspector.png) | ![Operations Dashboard](docs/assets/screenshots/04_operations_dashboard.png) |

---

## 🚀 Quickstart & Verification

### 1. Prerequisites
- Node.js $\ge 18$ (Tested on Node v24.11.1)
- npm $\ge 9$ (Tested on npm 11.6.2)

### 2. Installation
```bash
git clone https://github.com/abhijeetnardele24-hash/heatproof.git
cd heatproof
npm install
```

### 3. Run Development Server
```bash
npm run dev
# Open http://localhost:5173
```

### 4. Execute Vitest Test & Coverage Suite
```bash
npm test
# Runs 52 unit tests with v8 code coverage (>90% threshold)
```

### 5. Execute Playwright E2E & Accessibility Suite
```bash
npx playwright test
# Runs 49 end-to-end tests across 7 viewports including Axe WCAG 2.2 AA
```

### 6. Run Standalone Verification Scripts
```bash
# 1. Evaluate Multimodal AI against 12-case golden benchmark
npx tsx scripts/evaluate-ai.ts

# 2. Generate and cryptographically verify Adaptation Service Receipt (ASR)
npx tsx scripts/generate-sample-receipt.ts

# 3. Verify on-chain Arbitrum Sepolia proof status
npx tsx scripts/verify-onchain.ts

# 4. Capture high-res UI screenshots
npx tsx scripts/capture-screenshots.ts
```

---

## 📁 Repository Structure

```
heatproof/
├── docs/                                # Authoritative Documentation Suite
│   ├── assets/                          # Architecture SVG & UI Screenshots
│   │   ├── architecture.svg
│   │   └── screenshots/
│   │       ├── 01_civic_wayfinding_desktop.png
│   │       ├── 02_mobile_reporting_ai.png
│   │       ├── 03_cryptographic_inspector.png
│   │       └── 04_operations_dashboard.png
│   ├── AI_EVALUATION.md                 # 12-Case Golden Benchmark Results
│   ├── ARCHITECTURE.md                  # Technical System Architecture
│   ├── CLIMATE_METHODOLOGY.md           # NOAA & Steadman Equations
│   ├── DATA_SOURCES.md                  # Data Dictionary & Attributions
│   ├── DEMO_SCRIPT.md                   # 3-Minute Timed Video Walkthrough
│   ├── DEVPOST_SUBMISSION.md            # Ready-to-Paste Devpost Package
│   ├── LIVE_PROOF.md                    # Arbitrum Sepolia Proof Record
│   ├── PRIVACY_BOUNDARY.md              # EXIF Stripping & Coarsening
│   ├── RESPONSIBLE_AI.md                # Human-in-the-Loop Governance
│   ├── SUBMISSION_CHECKLIST.md          # Completed Hackathon Checklist
│   ├── ai_evaluation_results.json       # Benchmark Evaluation Output
│   ├── live_proof.json                  # On-Chain Arbitrum Proof Payload
│   └── sample_receipt.json              # Merkle Adaptation Service Receipt
├── public/                              # PWA Shell Assets
│   ├── manifest.webmanifest
│   └── sw.js                            # Offline Service Worker
├── scripts/                             # Verification Scripts
│   ├── capture-screenshots.ts
│   ├── evaluate-ai.ts
│   ├── generate-sample-receipt.ts
│   └── verify-onchain.ts
├── src/                                 # Application Source Code
│   ├── ai/                              # Responsible Multimodal AI
│   │   ├── benchmarkData.ts
│   │   └── evidenceAssistant.ts
│   ├── climate/                         # Meteorological Ingestion & NOAA Engine
│   │   ├── climateProvider.ts
│   │   └── heatIndex.ts
│   ├── components/                      # Mineral Civic UI Components
│   │   ├── App.tsx
│   │   ├── AttestationModal.tsx
│   │   ├── EvidenceInspectorModal.tsx
│   │   ├── HazardBanner.tsx
│   │   ├── Header.tsx
│   │   ├── ObservationModal.tsx
│   │   ├── OperationsDashboard.tsx
│   │   ├── ProofStrip.tsx
│   │   ├── ReliefCard.tsx
│   │   └── ZoneHeatMap.tsx
│   ├── domain/                          # State Machine & Domain Invariants
│   │   ├── receipt.ts
│   │   ├── seedData.ts
│   │   ├── stateMachine.ts
│   │   └── types.ts
│   ├── i18n/                            # Multilingual Dictionaries (EN, HI, MR)
│   │   └── translations.ts
│   ├── ledger/                          # Viem EVM & Hash Chain Providers
│   │   ├── ledgerProvider.ts
│   │   └── types.ts
│   ├── privacy/                         # Sanitizer & SHA-256 Hasher
│   │   ├── evidenceHasher.ts
│   │   └── sanitizer.ts
│   ├── styles/                          # Mineral Civic Design System
│   │   └── index.css
│   └── main.tsx
├── tests/                               # Comprehensive Automated Test Suite
│   ├── ai/
│   ├── climate/
│   ├── domain/
│   ├── e2e/                             # Playwright Responsive & Axe Specs
│   ├── ledger/
│   ├── privacy/
│   └── setup.ts
├── HACKATHON_CHANGELOG.md               # Chronological Development Record
├── LICENSE                              # MIT Open Source License
├── PRIOR_WORK_DISCLOSURE.md             # Prior Work & Attribution Declaration
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 📜 Prior Work & Intellectual Property Disclosure

In accordance with hackathon rules, HeatProof maintains strict truthfulness regarding prior work and dependencies:
- **Prior Work Disclosure**: See [`PRIOR_WORK_DISCLOSURE.md`](PRIOR_WORK_DISCLOSURE.md). All application code, state machine invariants, climate modeling, AI evaluation suites, Merkle trees, and UI components were developed uniquely during this hackathon.
- **External Dependencies**: Standard public libraries used: `react`, `viem`, `lucide-react`, `vite`, `vitest`, `playwright`, `@axe-core/playwright`.
- **Public APIs**: Open-Meteo Free Weather API (CC BY 4.0), NOAA National Weather Service algorithms (Public Domain).
- **License**: Released under the open-source **MIT License** ([LICENSE](LICENSE)).

---

*HeatProof: Built for resilience, backed by cryptography, powered by open science.*
