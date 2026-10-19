# Prior Work & Baseline Reuse Disclosure

> **Hackathon:** IEEE ClimateChain Global Hackathon 2026  
> **Track:** Climate Data & Environmental Monitoring  
> **Project:** HeatProof — Verifiable Proof-of-Adaptation Network  
> **Disclosure Date:** 19 October 2026  
> **Author:** Abhijeet Nardele  

---

## 1. Context & Baseline Origin

In accordance with official IEEE ClimateChain Global Hackathon rules regarding transparency, originality, and prior-work disclosure, this document provides a complete audit of the baseline reference project (**JalChhaya**) and all novel engineering developed for **HeatProof**.

- **Baseline Reference Repository:** [`https://github.com/abhijeetnardele24-hash/jalchhaya`](https://github.com/abhijeetnardele24-hash/jalchhaya)
- **Baseline Git Commit:** `61949a8de8fbf377f75014983d06f045106ac112`
- **Baseline Commit Timestamp:** `Sun Oct 18 18:43:49 2026 +0530`
- **Baseline Subject:** `feat: add verified synthetic Arkiv submission proof flow`
- **Baseline License:** MIT License (Copyright 2026 Abhijeet Nardele)

---

## 2. Reused Concepts & Foundational Patterns

The following conceptual foundations and architectural patterns were adapted from the baseline reference:
1. **Civic Design Tokens:** High-contrast color palette tailored for outdoor visibility under direct sunlight (mineral off-white canvas, deep charcoal typography, hazard ambers, and verified greens).
2. **Arkiv SDK Integration Concepts:** The basic usage pattern of `@arkiv-network/sdk` and `viem` for querying entities by `project_id` and creating structured attributes.
3. **PWA & Offline Philosophy:** Client-side local storage caching pattern for offline resilience.
4. **Initial Entity Taxonomy:** Fundamental resource classifications (`drinking_water`, `shaded_rest`, `cooling_centre`).

---

## 3. Substantial Novel Engineering in HeatProof (IEEE ClimateChain Hackathon)

The entirety of the following capabilities were conceptualized, specified, architected, implemented, and verified **from scratch** for the IEEE ClimateChain Global Hackathon:

1. **Real-Time Climate Hazard Provider Abstraction (`ClimateDataProvider`):**
   - Live integration with Open-Meteo Weather API (`https://api.open-meteo.com/v1/forecast`) fetching live ambient temperature, apparent temperature, relative humidity, wind speed, and UV index without API key bottlenecks.
   - NOAA Steadman Heat Index equation implementation calculating official heat danger tiers (`Normal`, `Caution`, `Extreme Caution`, `Danger`, `Extreme Danger`).
   - Multi-mode provider architecture (`OpenMeteoProvider`, `CachedClimateProvider`, `SyntheticFixtureProvider`) with explicit `LIVE`, `CACHED`, and `SYNTHETIC` mode labeling.

2. **Responsible Multimodal AI Evidence Assistant (`EvidenceAnalysisProvider`):**
   - Strict Zod schema enforcing structured AI evaluation: `resource_visible`, `operational_state`, `accessibility_state`, `queue_band`, `evidence_observations`, `uncertainties`, `confidence`, and prompt/model versions.
   - **"AI Proposes; Humans Decide"** workflow: Zero automated state mutations; humans retain 100% editing control over proposed fields before signing.
   - Curated 12-example evaluation benchmark dataset with rigorous metrics reporting (precision, recall, F1, and abstention rate) and honest failure mode documentation.

3. **Deterministic Attestation State Machine (`src/domain/stateMachine.ts`):**
   - 9 canonical states: `UNVERIFIED`, `PROPOSED_AVAILABLE`, `PROPOSED_UNAVAILABLE`, `VERIFIED_AVAILABLE`, `VERIFIED_UNAVAILABLE`, `DISPUTED`, `UNCERTAIN`, `EXPIRED`, `RESTORED`.
   - Provable state invariants: Self-attestation rejection, Sybil duplicate prevention, deterministic time-bounded expiry windows, and transparent dispute visibility (contradictions are preserved, never silently averaged).
   - Outage-to-Restoration Linkage: Restorations explicitly reference the previous outage ID (`restoredOutageId`), creating an unbroken historical audit trail.

4. **Adaptation Service Receipts (ASR) Specification & Engine (`src/domain/receipt.ts`):**
   - Standardized non-tradeable proof of operational climate-adaptation delivery during documented hazard windows.
   - Cryptographic aggregation: Merkle root / SHA-256 digest trees linking source observations, attestations, hazard data, and service duration.
   - Fail-closed validator asserting zero disputes, active unexpired status, and cryptographic integrity.

5. **Institutional Operations & Policy Dashboard (`src/components/OperationsDashboard.tsx`):**
   - Real-time heat coverage metrics across municipal zones.
   - Outage queue prioritizing critical relief failures during extreme heat.
   - Mean restoration response time tracking.
   - Machine-readable audit bundle export (JSON/CSV) for climate researchers and municipal planners.
   - Explicit Data Quality panel auditing freshness, dispute rate, and verification latency.

6. **Interactive Zone Map & Signature "Proof Strip" UX (`src/components/ZoneMap.tsx`, `ProofStrip`):**
   - Interactive SVG Zone Map showing relief facilities and live heat danger overlays.
   - Signature **Proof Strip** on every facility card exposing operational state, independent confirmation count, freshness, and deterministic countdown to expiry.

7. **Multilingual Localization (`src/i18n/`):**
   - Complete, authentic localization across English, Hindi (हिंदी), and Marathi (मराठी) across all user flows.

8. **End-to-End Quality Gates & CI Pipeline:**
   - 100% TypeScript strict mode, comprehensive Vitest domain/state unit tests, and Playwright multi-viewport E2E tests (320px to 1920px) with `@axe-core/playwright` accessibility audits asserting 0 WCAG 2.2 AA violations.

---

## 4. Dated Commit Range & Transparency

- **Hackathon Sprint Start:** 19 October 2026
- **Hackathon Branch:** `main`
- **Clean Workspace Verification:** HeatProof builds independently with zero dependencies on external local directories or uncommitted state.
