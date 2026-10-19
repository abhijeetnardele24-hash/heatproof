# Devpost Project Submission Package

> **Project Name**: HeatProof — Verifiable Proof-of-Adaptation Network for Extreme-Heat Relief Infrastructure  
> **Tagline**: Decentralized, privacy-preserving climate resilience network verifying extreme-heat relief infrastructure via NOAA hazard modeling, multimodal AI, and on-chain Merkle receipts.  
> **Track**: Climate Data & Environmental Monitoring (IEEE ClimateChain Global Hackathon 2026)  

---

### Elevator Pitch
HeatProof transforms extreme-heat adaptation from unverified municipal promises into cryptographic, life-saving physical reality. Connecting live Open-Meteo meteorological hazard data and NOAA Steadman heat indices with client-side privacy-preserving evidence capture, responsible multimodal AI assistance ("AI Proposes; Humans Decide"), a formal 9-state invariant engine, and Arbitrum Sepolia blockchain anchoring, HeatProof guarantees that drinking water, misting canopies, and emergency medical cooling stations are provably operational when ambient heat indices surge past lethal physiological thresholds.

---

### Inspiration
During devastating heatwaves across South Asia and the Global South—where wet-bulb temperatures and heat indices regularly breach 45°C—the difference between finding an operational water cooler and walking into a padlocked facility is a matter of survival for street vendors, construction workers, and vulnerable families.

City authorities publish static heat action plans, yet field audits show that up to 35% of public cooling points are dry, vandalized, or closed when needed most. Simultaneously, international Climate Loss & Damage funds have pledged hundreds of millions of dollars toward urban adaptation, but lack any tamper-proof, verifiable evidence that physical adaptation services were actually delivered. We built HeatProof to bridge this critical verification gap.

---

### What It Does
1. **Live Meteorological Telemetry**: Fetches 2-meter air temperature, relative humidity, wind velocity, and UV radiation from Open-Meteo REST endpoints, calculating apparent heat stress using the 16-parameter NOAA Steadman & Rothfusz polynomial regression equations across five hazard bands (Normal, Caution, Extreme Caution, Danger, Extreme Danger).
2. **Accessible Mineral Civic Wayfinding**: An interactive SVG thermal isotherm corridor map and resource directory (drinking water, misting hubs, deep cooling shelters, ORS centers) responsive across 7 viewports (320px to 1920px), localized in English, Hindi, and Marathi, and certified 100% Axe WCAG 2.2 AA compliant.
3. **Client-Side Privacy Boundary**: Automatically strips image EXIF camera metadata, coarsens GPS coordinates to a ~1.1km grid, and redacts Aadhaar/phone/email PII before generating a canonical SHA-256 evidence digest.
4. **Responsible Multimodal AI Assistant**: Evaluates visual fingerprints (water flow vs. dry tap vs. padlock) with built-in prompt-injection defenses (100% accuracy, 1.0 macro F1 across a 12-case golden benchmark), proposing state classifications under strict human-in-the-loop governance.
5. **Deterministic 9-State Invariant FSM**: Enforces $N \ge 2$ independent witness corroborations to verify operational status, with automatic heat escalation lowering outage quorum when Heat Index $> 42^\circ\text{C}$.
6. **Adaptation Service Receipts (ASR)**: Aggregates verified adaptation events into binary Merkle trees, generating cryptographic receipts specifying protected beneficiaries, water dispensed, and active heat index severity.
7. **Multi-Provider Blockchain Ledger**: Anchors cryptographic adaptation proofs directly to the Arbitrum Sepolia testnet (`viem`), backed by a deterministic client-side SHA-256 hash chain and PWA Service Worker for 100% offline continuity.
8. **Civic Operations & Climate Policy Command**: Delivers real-time heat zone coverage metrics, priority outage queues ranked by thermal severity, and one-click JSON cryptographic audit bundle downloads.

---

### How We Built It
- **Frontend & Presentation**: React 18, TypeScript (strict mode), Vite, Custom Mineral Civic Design System (`src/styles/index.css`), Lucide Icons.
- **Meteorological & Physical Modeling**: Open-Meteo REST API, NOAA Steadman & Rothfusz Heat Index mathematical engine.
- **Privacy & Cryptography**: Web Crypto API (`crypto.subtle`), SHA-256 canonical JSON serialization, client-side EXIF stripping canvas pipeline, regex PII sanitizers.
- **Multimodal AI Evaluation**: ClientEvidenceAssistant engine with prompt-injection defense, tested against a 12-case golden benchmark suite.
- **Smart Contract & Ledger Integration**: `viem` Ethereum library, Arbitrum Sepolia Testnet contract anchoring, deterministic local SHA-256 hash chain fallback.
- **Testing & Quality Assurance**: Vitest (52 unit tests, 93.93% statements / 100% functions coverage), Playwright (49 E2E tests across 7 viewports), Axe-Core WCAG 2.2 AA automated accessibility scanner.

---

### Challenges We Ran Into
1. **Screen Reader Name Alignment in Touch Targets**: Axe WCAG 2.5.3 (Label in Name) flagged buttons where `aria-label` contained extra metadata not present in the visible button text. We harmonized accessible names so visible strings ("Report Update", "Corroborate Attestation", "Inspect Proof") are strictly prefix-aligned with accessibility labels.
2. **Nested Interactive Elements in SVG Maps**: Standard SVG pins wrapped with interactive roles triggered accessibility warnings when nested inside containers with implicit image semantics. Removing conflicting SVG container roles while preserving discrete interactive keyboard focus resolved the violation cleanly.
3. **Adversarial Prompt Injections in Field Reports**: Users or malicious actors could input adversarial strings into field notes. We engineered a dual defense: Unicode `NFKC` canonicalization combined with regex filtering of forbidden prompt-injection tokens and an explicit abstention policy under ambiguous confidence.

---

### Accomplishments We're Proud Of
- **0 Violations on Axe WCAG 2.2 AA**: Achieving clean automated accessibility across all application states.
- **100% Playwright Test Pass Rate Across 7 Viewports**: 49 tests passing from 320px mobile up to 1920px desktop displays.
- **Live On-Chain Cryptographic Anchor**: Real transactions verified on the Arbitrum Sepolia explorer (`0x5191861d07131934750e37eac775ab8a32ba3c22f759ad0808b4efc2830f0254`).
- **100% Benchmark Accuracy with 41.7% Intentional Abstention**: Proving that responsible AI knows when to abstain rather than hallucinate in life-critical scenarios.

---

### What We Learned
- Open-Meteo provides exceptionally robust NWP forecast data without requiring API keys, making it an ideal public utility backbone for global climate adaptation.
- Designing for small mobile screens (320px) under strict civic accessibility standards requires careful DOM hierarchy design to avoid sticky-header click interception.
- Merkle aggregation of physical service proofs enables climate finance auditors to verify millions of distributed adaptation events without incurring high gas overhead.

---

### What's Next for HeatProof
1. **IoT Sensor Ingestion**: Connecting ultrasonic water flow sensors on municipal water coolers directly to the attestation state machine.
2. **C2PA Cryptographic Image Hardware Signatures**: Integrating hardware-level camera provenance to guarantee photos were taken in the physical world without modification.
3. **Parametric Insurance Smart Contracts**: Automating direct municipal resilience micro-payouts to community organizations whenever Heat Index exceeds 42°C for 3 consecutive hours and verified water stations remain operational.

---

### Built With
`typescript`, `react`, `vite`, `viem`, `arbitrum`, `open-meteo`, `noaa`, `sha-256`, `merkle-tree`, `playwright`, `vitest`, `axe-core`, `wcag-2.2-aa`, `pwa`, `html5`, `css3`
