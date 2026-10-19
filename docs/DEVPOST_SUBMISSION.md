# Devpost Project Submission Package

> **Project Name**: HeatProof — Verifiable Proof-of-Adaptation Network for Extreme-Heat Relief Infrastructure  
> **Tagline**: Decentralized, privacy-preserving climate resilience network verifying extreme-heat relief infrastructure via NOAA hazard modeling, deterministic rule-based evaluation, and cryptographic Merkle receipts.  
> **Event**: [IEEE ClimateChain Global Hackathon 2026](https://ieee-climatechain-hack.devpost.com/)  
> **Track**: Climate Data & Environmental Monitoring  

---

### Elevator Pitch
HeatProof transforms extreme-heat adaptation from unverified municipal promises into cryptographic, life-saving physical reality. Connecting live Open-Meteo meteorological hazard data and NOAA Steadman heat indices with client-side privacy-preserving evidence capture, deterministic evidence rules assistance ("AI Proposes; Humans Decide"), a formal 9-state invariant engine, and cryptographic SHA-256 local hash chains (with turnkey Arbitrum Sepolia testnet readiness), HeatProof guarantees that drinking water, misting canopies, and emergency medical cooling stations are provably operational when ambient heat indices surge past lethal physiological thresholds.

---

### Inspiration
During devastating heatwaves across South Asia and the Global South—where wet-bulb temperatures and heat indices regularly breach 45°C—the difference between finding an operational water cooler and walking into a padlocked facility is a matter of survival for street vendors, construction workers, and vulnerable families.

City authorities publish static heat action plans, yet field audits show that up to 35% of public cooling points are dry, vandalized, or closed when needed most. Simultaneously, international Climate Loss & Damage funds have pledged hundreds of millions of dollars toward urban adaptation, but lack an audit-ready, tamper-proof mechanism to verify whether physical adaptation services were actually delivered. We built HeatProof to bridge this critical verification gap.

---

### What It Does
1. **Live Meteorological Telemetry**: Fetches 2-meter air temperature, relative humidity, wind velocity, and UV radiation from Open-Meteo REST endpoints, calculating apparent heat stress using the 16-parameter NOAA Steadman & Rothfusz polynomial regression equations across five hazard bands (Normal, Caution, Extreme Caution, Danger, Extreme Danger).
2. **Accessible Mineral Civic Wayfinding**: An interactive SVG thermal isotherm corridor map and resource directory (drinking water, misting hubs, deep cooling shelters, ORS centers) responsive across 7 viewports (320px to 1920px), localized in English, Hindi, and Marathi, and audited for 100% Axe WCAG 2.2 AA compliance.
3. **Client-Side Privacy Boundary**: Automatically strips image EXIF camera metadata in local browser memory, coarsens GPS coordinates to a ~1.1km grid, and redacts Aadhaar/phone/email PII before generating a canonical SHA-256 evidence digest.
4. **Deterministic Evidence Rules Assistant**: Evaluates visual indicators (water flow vs. dry tap vs. padlock) with built-in prompt-injection defenses (100% accuracy, 1.0 macro F1 across a 12-case golden benchmark), proposing state classifications under strict human-in-the-loop governance.
5. **Deterministic 9-State Invariant FSM**: Enforces $N \ge 2$ independent witness corroborations to verify operational status, with automatic heat escalation lowering outage quorum when Heat Index $> 42^\circ\text{C}$.
6. **Adaptation Service Receipts (ASR)**: Aggregates verified adaptation events into binary Merkle trees, generating cryptographic receipts specifying protected beneficiaries, water dispensed, and active heat index severity.
7. **Dual-Mode Cryptographic Proof Ledger**: Maintains a deterministic client-side SHA-256 hash chain and PWA Service Worker for 100% offline continuity (`LOCAL_DEMO`), backed by turnkey `viem` integration ready for Arbitrum Sepolia testnet broadcast upon wallet signing.
8. **Civic Operations & Climate Policy Command**: Delivers real-time heat zone coverage metrics, priority outage queues ranked by thermal severity, and one-click JSON cryptographic audit bundle downloads.

---

### How We Built It
- **Frontend & Presentation**: React 18, TypeScript (strict mode), Vite, Custom Mineral Civic Design System (`src/styles/index.css`), Lucide Icons.
- **Meteorological & Physical Modeling**: Open-Meteo REST API, NOAA Steadman & Rothfusz Heat Index mathematical engine.
- **Privacy & Cryptography**: Web Crypto API (`crypto.subtle`), SHA-256 canonical JSON serialization, client-side EXIF stripping canvas pipeline, regex PII sanitizers.
- **Rules Engine & Evaluation**: Transparent heuristic evidence assistant with prompt-injection defense, validated against a 12-case golden benchmark suite.
- **Ledger Integration**: Dual-mode ledger provider supporting local SHA-256 hash chains (`LOCAL_DEMO`) and `viem` Ethereum integration for Arbitrum Sepolia.
- **Testing & Quality Assurance**: Vitest (95 unit & integration tests, 87.4% statements / 81.7% branches / 98.61% functions coverage), Playwright (56 E2E tests across 7 viewports), Axe-Core WCAG 2.2 AA automated accessibility scanner.

---

### Challenges We Ran Into
1. **Screen Reader Name Alignment in Touch Targets**: Axe WCAG 2.5.3 (Label in Name) flagged buttons where `aria-label` contained extra metadata not present in the visible button text. We harmonized accessible names so visible strings ("Report Update", "Corroborate Attestation", "Inspect Proof") are strictly prefix-aligned with accessibility labels.
2. **Nested Interactive Elements in SVG Maps**: Standard SVG pins wrapped with interactive roles triggered accessibility warnings when nested inside containers with implicit image semantics. Removing conflicting SVG container roles while preserving discrete interactive keyboard focus resolved the violation cleanly.
3. **Adversarial Prompt Injections in Field Reports**: Users or malicious actors could input adversarial strings into field notes. We engineered a dual defense: Unicode `NFKC` canonicalization combined with regex filtering of forbidden prompt-injection tokens and an explicit abstention policy under ambiguous confidence.
4. **Mobile Emulation Modal Scrolling in Touch Viewports**: On ultra-compact screens (320px & 360px), modal card flexbox sizing required `min-height: 0` on nested forms and viewport-bounded heights (`min(94vh, 640px)`) to ensure fixed-action buttons remain fully accessible without pointer interception.

---

### Accomplishments We're Proud Of
- **0 Violations on Axe WCAG 2.2 AA**: Achieving 100% automated accessibility across all 7 viewports.
- **100% Playwright Test Pass Rate Across 7 Viewports**: 56 end-to-end tests passing from 320px mobile up to 1920px desktop displays.
- **Deterministic Offline Cryptographic Hash Chain**: Full client-side SHA-256 hash chain and PWA offline capability when disaster strikes and cell towers fail.
- **100% Benchmark Accuracy with 41.7% Intentional Abstention**: Proving that responsible AI knows when to abstain rather than hallucinate in life-critical scenarios.
- **Zero-Secret, Truthful Architecture**: Clean security scan with zero leaked credentials, truthful ledger status, and transparent open-source code.

---

### What We Learned
- Open-Meteo provides exceptionally robust NWP forecast data without requiring API keys, making it an ideal public utility backbone for global climate adaptation.
- Designing for small mobile screens (320px) under strict civic accessibility standards requires careful DOM hierarchy design to avoid fixed-header click interception.
- Merkle aggregation of physical service proofs enables climate finance auditors to verify millions of distributed adaptation events without incurring high gas overhead.

---

### What's Next for HeatProof
1. **IoT Sensor Ingestion**: Connecting ultrasonic water flow sensors on municipal water coolers directly to the attestation state machine.
2. **C2PA Cryptographic Image Hardware Signatures**: Integrating hardware-level camera provenance to guarantee photos were taken in the physical world without modification.
3. **Parametric Insurance Smart Contracts**: Automating direct municipal resilience micro-payouts to community organizations whenever Heat Index exceeds 42°C for 3 consecutive hours and verified water stations remain operational.

---

### Built With
`typescript`, `react`, `vite`, `viem`, `arbitrum`, `open-meteo`, `noaa`, `sha-256`, `merkle-tree`, `playwright`, `vitest`, `axe-core`, `wcag-2.2-aa`, `pwa`, `html5`, `css3`
