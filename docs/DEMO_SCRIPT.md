# HeatProof Video Demonstration & Walk-Through Script

> **Target Duration**: 3:20 – 3:40 (200 – 220 Seconds Total)  
> **Audience**: Climate Adaptation Funders, Municipal Resilience Directors, Hackathon Judges  
> **Presenter Tone**: Calm, authoritative, technical, civic-minded  
> **Visual Polish**: 1080p 60fps recording, crisp mineral typography, WCAG 2.2 AA high-contrast UI  

---

## Detailed Storyboard & Cue Breakdown

### [0:00 – 0:35] Scene 1: The Extreme Heat Problem & The Adaptation Verification Gap
- **Timecode**: 0:00 – 0:35 (35 seconds)
- **Visual Action**:
  - Open on desktop viewport (`docs/assets/screenshots/01_civic_wayfinding_desktop.png`) showing HeatProof's clean mineral design system.
  - Hover over the top meteorological hazard banner showing current ambient temperature (38.4°C), calculated NOAA Heat Index (43.2°C), and the glowing amber "Extreme Danger" badge.
  - Slow pan down across the relief facility list and live map pins.
- **On-Screen Callout**:
  - `Heat Index: 43.2°C (Extreme Danger)`
  - `The Problem: Unverified Adaptation Infrastructure`
- **Narrator (Spoken, paced at ~130 wpm)**:
  > *"Across the Global South, extreme heatwaves are turning urban centers into lethal convection environments. When ambient heat indices breach 42°C, access to functional drinking water taps, misting canopies, and oral rehydration salt stations is a matter of life and death.*  
  > *Yet cities and climate funds face a catastrophic verification gap: municipal directories show cooling centers that are padlocked, water dispensers that ran dry hours ago, and phantom infrastructure.*  
  > *Meanwhile, international Loss and Damage adaptation funds have zero cryptographic proof that claimed physical relief was ever delivered.*  
  > *Welcome to HeatProof: the verifiable proof-of-adaptation network for urban extreme-heat resilience."*

---

### [0:35 – 1:15] Scene 2: Live Numerical Weather Telemetry & Civic Wayfinding
- **Timecode**: 0:35 – 1:15 (40 seconds)
- **Visual Action**:
  - Switch active zone from Pune Central to Ahmedabad West, then to North Delhi.
  - Show the live telemetry card smoothly updating: fetch timestamp, humidity, wind speed, solar radiation, and the Steadman-Rothfusz heat index equations.
  - Click on interactive facility filters: toggle `Drinking Water`, `Cooling Center`, and `Medical ORS`.
  - Click on the "Mandai Municipal Cooling & ORS Hub" card to expand operational metrics and live status indicators.
- **On-Screen Callout**:
  - `Telemetry Provenance: LIVE (Open-Meteo REST API)`
  - `Wayfinding: Multi-lingual (EN / HI / MR) | Automated Axe Scan: 0 Violations in Tested States`
- **Narrator**:
  > *"HeatProof bridges live environmental science directly to vulnerable citizens and frontline gig workers.*  
  > *The system connects in real time to Numerical Weather Prediction streams via the Open-Meteo API, computing Steadman apparent temperature and Rothfusz heat stress adjustments dynamically.*  
  > *The interface is fully responsive, accessible to WCAG 2.2 AA standards, and instantly localized across English, Hindi, and Marathi.*  
  > *Notice the transparent provenance badges: meteorological data is fetched live from Open-Meteo, while facility coordinates reflect verified municipal baseline fixtures.*  
  > *Users immediately identify verified operational sites nearby, accompanied by real-time witness corroboration counts."*

---

### [1:15 – 2:00] Scene 3: Client-Side Privacy Boundary & Deterministic Evidence Rules Assistant
- **Timecode**: 1:15 – 2:00 (45 seconds)
- **Visual Action**:
  - Toggle responsive viewport to Mobile View (`docs/assets/screenshots/02_mobile_reporting_ai.png`).
  - Click "Submit Verification Update" on the relief card.
  - Focus on the prominent green Privacy Boundary banner.
  - Paste test notes containing a dummy phone number (`+91 9876543210`) and observe immediate client-side regex redaction (`[REDACTED_PHONE]`).
  - Demonstrate client-side coordinate snapping to the 1.1-km geographic grid.
  - Select structured evidence type "Clean Continuous Water Flow" and click "Run Evidence Rules Check".
  - Watch the deterministic expert rules engine evaluate the report: confidence score, invariant compliance, and transparent recommendation displayed.
- **On-Screen Callout**:
  - `Zero-PII Client-Side Boundary: EXIF Stripped, Coordinates Coarsened, PII Redacted`
  - `Governance Principle: Deterministic Rules Propose, Humans Decide`
- **Narrator**:
  > *"When field workers or citizens submit operational reports, HeatProof strictly enforces a zero-PII privacy boundary before any packet touches the wire.*  
  > *GPS coordinates are coarsened client-side to a 1.1-kilometer bounding grid, camera EXIF metadata is irreversibly stripped, and names or contact numbers are purged via client-side redaction.*  
  > *Under our strict governance doctrine—'Rules Propose; Humans Decide'—we do not rely on opaque generative hallucination.*  
  > *Instead, our deterministic evidence-rules engine evaluates structured operational indicators, verifying flow metrics, temperature differentials, and tamper resistance.*  
  > *If evidence is degraded or conflicting, the engine explicitly abstains. Crucially, the rule assistant holds zero ledger execution authority; the citizen must review, verify, and authorize the submission."*

---

### [2:00 – 2:40] Scene 4: 9-State Invariant FSM & N≥2 Independent Witness Corroboration
- **Timecode**: 2:00 – 2:40 (40 seconds)
- **Visual Action**:
  - Submit the report and close the modal.
  - Click "Corroborate Attestation" on an adjacent facility needing verification.
  - Show the 9-state invariant diagram tooltip (`PROPOSED` -> `COMMITTED` -> `CHALLENGED` -> `SUPERSEDED` -> `REJECTED`).
  - Add a second independent witness signature.
  - Point to the state machine dynamically transitioning the asset to `VERIFIED_OPERATIONAL`.
  - Simulate heat escalation: toggle temperature to 43.5°C and show how the safety invariant automatically reduces quorum to single-witness emergency reporting for critical water outages.
- **On-Screen Callout**:
  - `Formal Verification: 9-State Invariant Finite State Machine`
  - `Quorum: N ≥ 2 Independent Witnesses | Emergency Escalation Override at >42°C`
- **Narrator**:
  > *"A single isolated claim can never flip critical municipal status.*  
  > *HeatProof's core transition logic is governed by a formal 9-state invariant finite state machine.*  
  > *Under nominal conditions, transitioning an infrastructure asset to 'Verified Operational' strictly requires N ≥ 2 independent witness attestations with distinct key signatures.*  
  > *However, during extreme heat stress—when the heat index surpasses 42°C Danger levels—our safety escalation protocol lowers the outage challenge threshold to a single corroborated report.*  
  > *This immediately alerts municipal response teams to dispatch emergency emergency water tankers without bureaucratic delay."*

---

### [2:40 – 3:15] Scene 5: Cryptographic Proof Inspector & Merkle Adaptation Receipts
- **Timecode**: 2:40 – 3:15 (35 seconds)
- **Visual Action**:
  - Click "Inspect Cryptographic Proof" on the verified relief card (`docs/assets/screenshots/03_cryptographic_inspector.png`).
  - Highlight the canonical SHA-256 evidence digest, preimage JSON breakdown, and chronological block height.
  - Point out the active ledger mode indicator (`LOCAL_DEMO` cryptographic hash chain with dual Viem Arbitrum Sepolia adapter boundary).
  - Open browser DevTools Network tab, toggle offline mode, reload, and demonstrate Service Worker caching and IndexedDB offline persistence.
- **On-Screen Callout**:
  - `Cryptographic Primitive: Canonical SHA-256 Digest & Hash-Chained Blocks`
  - `Mode Disclosure: This demonstration uses local proof mode. The Arbitrum Sepolia adapter is implemented, but no confirmed testnet transaction is claimed in this recording.`
  - `Offline Capability: Tested Offline Reload & Local Workflow After Initial Online Load`
- **Narrator**:
  > *"Every verified adaptation event generates a tamper-evident local receipt.*  
  > *In the Cryptographic Evidence Inspector, auditors can examine the canonical SHA-256 digest calculated over the zero-PII preimage payload, verify the multi-signature witness list, and trace the hash-chained block history.*  
  > *This demonstration uses local proof mode. The Arbitrum Sepolia adapter is implemented, but no confirmed testnet transaction is claimed in this recording.*  
  > *The installed Service Worker passed automated offline reload and local-workflow testing after an initial online load, ensuring resilient civic wayfinding even when disaster conditions interrupt cellular connectivity."*

---

### [3:15 – 3:35] Scene 6: Operations & Policy Command, Verifiable JSON Audit Bundle
- **Timecode**: 3:15 – 3:35 (20 seconds)
- **Visual Action**:
  - Click the "Operations & Policy" tab (`docs/assets/screenshots/04_operations_dashboard.png`).
  - Highlight Heat Zone Coverage analytics, Priority Outage Queue with response time counters, and municipal tanker dispatch routing.
  - Click "Export Verifiable Audit Bundle (JSON)".
  - Briefly open the exported JSON file showing signed blocks, Merkle root, facility states, and environmental telemetry timestamps.
- **On-Screen Callout**:
  - `Municipal Policy Command: Live Heat Zone SLA Monitoring`
  - `Export: Machine-Readable Cryptographic Audit Bundle (JSON)`
- **Narrator**:
  > *"For municipal climate resilience directors and global climate finance institutions, the Operations Command provides end-to-end transparency: real-time heat zone coverage metrics, SLA response tracking, and priority triage queues.*  
  > *With one click, auditors can export the complete verifiable audit bundle in machine-readable JSON format, containing complete cryptographic proofs, witness signatures, and environmental sensor readings."*

---

### [3:35 – 3:40] Scene 7: Summary & Call to Action
- **Timecode**: 3:35 – 3:40 (5 seconds)
- **Visual Action**:
  - Cut to title slide showing the HeatProof logo, GitHub repository URL, and Devpost project link.
- **On-Screen Callout**:
  - `HeatProof: Verifiable Proof-of-Adaptation Network`
  - `Live Demo: abhijeetnardele24-hash.github.io/heatproof`
  - `GitHub: github.com/abhijeetnardele24-hash/heatproof`
- **Narrator**:
  > *"HeatProof: Transforming extreme-heat adaptation from unverified promises into cryptographically provable, life-saving reality. Thank you."*

---

## Technical Asset Checklist for Recording
- [x] High-contrast 1080p display (1920×1080 or 1536×864 retina)
- [x] Clear microphone recording at -14 LUFS, zero background hum
- [x] Live Open-Meteo REST API connection active
- [x] Demo data pre-seeded with Pune Central, Ahmedabad West, and North Delhi
- [x] Offline mode demonstrated via Chrome DevTools throttling
- [x] Exported audit bundle pre-validated with zero JSON syntax errors
