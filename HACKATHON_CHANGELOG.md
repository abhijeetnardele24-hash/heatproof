# HeatProof — Hackathon Changelog & Development Milestones

> **Event:** IEEE ClimateChain Global Hackathon 2026  
> **Track:** Climate Data & Environmental Monitoring  
> **Repository:** https://github.com/abhijeetnardele24-hash/heatproof  
> **Sprint Inception:** `2026-10-19T23:25:00+05:30`  
> **Deadline:** `2026-10-25T19:30:00+05:30` (17:00 Türkiye time)  
> **Author:** Abhijeet Nardele  

---

## ⏱️ Engineering Milestones

### Milestone 1: Project Scaffolding & Foundation (`2026-10-19T23:27:00+05:30`)
- Initialized blank independent repository for `heatproof`.
- Established strict TypeScript configuration (`tsconfig.json`), Vite bundler (`vite.config.ts`), and Vitest runner (`vitest.config.ts`).
- Created `LICENSE` (MIT) and authored authoritative `PRIOR_WORK_DISCLOSURE.md` documenting baseline commit audit (`61949a8de8fbf377f75014983d06f045106ac112`) and novel engineering scope.
- Configured production dependencies: React 18, Zod schema validation, Viem, Arkiv Network SDK, Lucide React icons.

### Milestone 2: Domain Schema & Attestation State Machine (Planned)
- Implementing strict domain models (`Facility`, `Observation`, `Attestation`, `HazardWindow`, `AdaptationServiceReceipt`).
- Coding 9-state deterministic state machine with strict invariant validation and unit test coverage.

### Milestone 3: Live Climate Hazard Provider (Planned)
- Open-Meteo API live integration and NOAA heat index calculation.

### Milestone 4: Privacy & Evidence Sanitization Gate (Planned)
- Client-side EXIF stripper, PII regex scanner, and deterministic SHA-256 evidence hasher.

### Milestone 5: Multimodal AI Evidence Assistant & Benchmark (Planned)
- Structured proposal generation with uncertainty scoring, human confirmation flow, and 12-case benchmark evaluation set.

### Milestone 6: Adaptation Service Receipts (Planned)
- Merkle root / aggregate digest aggregation and fail-closed certificate generation.

### Milestone 7: Civic UI, Map & Operations Dashboard (Planned)
- Worker wayfinding, signature Proof Strip, interactive SVG Zone Map, and Operations Dashboard.

### Milestone 8: Quality Gates & Verification (Planned)
- Complete automated verification: Typecheck, Lint, Vitest, Playwright E2E, Axe accessibility, and security scan.
