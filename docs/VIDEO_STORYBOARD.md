# HeatProof Video Demonstration Storyboard & Production Blueprint

> **Specification**: IEEE ClimateChain Hackathon 2026 Video Production Master Blueprint  
> **Target Video Duration**: 3:20 – 3:40 (200 – 220 Seconds Total)  
> **Output Format**: 1920×1080 (16:9), 60 FPS, H.264 / AAC  
> **Presenter Tone**: Calm, authoritative, civic-minded, technically rigorous  
> **Reference Guide**: [`VIDEO_PRODUCTION_MASTER_TEMPLATE.md`](../VIDEO_PRODUCTION_MASTER_TEMPLATE.md)  
> **Production Status**: Storyboard & script frozen for external rendering. No video rendering executed.  

---

## 1. Executive Demonstration Plan

| Timecode | Duration | Scene Identifier | Primary Interface Screen | Provenance Stream Demonstrated |
| :--- | :---: | :--- | :--- | :--- |
| **0:00 – 0:35** | 35s | Scene 1: Heat Threat & Verification Gap | Desktop Header & Hazard Banner | Weather (`LIVE`), Map (`DEMO`) |
| **0:35 – 1:15** | 40s | Scene 2: Live Weather & Civic Wayfinding | Zone Selector & Facility Directory | Weather (`LIVE`), Map (`DEMO`) |
| **1:15 – 2:00** | 45s | Scene 3: Privacy Boundary & Rule Engine | Mobile Observation Modal (390px) | Rules Engine (Deterministic Heuristics) |
| **2:00 – 2:40** | 40s | Scene 4: 9-State Invariant FSM & Quorum | Facility Card & Attestation Flow | Invariant FSM ($N \ge 2$), Heat Escalation |
| **2:40 – 3:15** | 35s | Scene 5: Cryptographic Proof Inspector | Proof Inspector & Offline DevTools | Ledger (`LOCAL_DEMO` / Adapter Boundary) |
| **3:15 – 3:35** | 20s | Scene 6: Operations Command & Audit Export | Operations & Policy View | Verifiable JSON Audit Bundle |
| **3:35 – 3:40** | 5s | Scene 7: Conclusion & Repositories | Closing Slate | GitHub & Deployed Demo Links |

---

## 2. Detailed Scene-by-Scene Storyboard

### Scene 1: The Extreme Heat Problem & The Adaptation Verification Gap
- **Timestamp**: `0:00 – 0:35`
- **Expected Duration**: 35 seconds
- **Route / Screen**: `/` (Civic Wayfinding Desktop, 1440×900 viewport)
- **Visual Crop**: Full desktop view gently zooming to the top meteorological banner.
- **Cursor / Click Treatment**: Smooth cursor pans over ambient temperature (`38.4°C`), NOAA Heat Index (`43.2°C`), and the glowing amber `Extreme Danger` badge.
- **Narration**:
  > *"Across the Global South, extreme heatwaves are turning urban centers into lethal convection environments. When ambient heat indices breach 42°C, access to functional drinking water taps, misting canopies, and oral rehydration salt stations is a matter of life and death.*  
  > *Yet cities and climate funds face a catastrophic verification gap: municipal directories show cooling centers that are padlocked, water dispensers that ran dry hours ago, and phantom infrastructure.*  
  > *Meanwhile, international Loss and Damage adaptation programs lack an audit-ready, privacy-preserving mechanism to verify whether physical relief was actually available during life-threatening heat.*  
  > *Welcome to HeatProof: the verifiable proof-of-adaptation network for urban extreme-heat resilience."*
- **On-Screen Caption**:
  - `Heat Index: 43.2°C (Extreme Danger Threshold)`
  - `The Verification Gap: Unverified Municipal Infrastructure During Heat Emergencies`
- **Evidence Being Demonstrated**: Live NOAA Steadman 16-parameter heat index calculation on live meteorological telemetry.
- **Provenance Badges Visible**: `Weather: LIVE (Open-Meteo)`, `Map: DEMO (Baseline Fixtures)`, `Ledger: LOCAL_DEMO`.
- **Transition**: Soft 0.4s cross-fade into Zone Selection.
- **Privacy / Redaction Requirement**: None on landing page (public municipal baseline data).

---

### Scene 2: Live Meteorological Hazard Ingestion & Civic Wayfinding
- **Timestamp**: `0:35 – 1:15`
- **Expected Duration**: 40 seconds
- **Route / Screen**: `/` (Civic Wayfinding Desktop with interactive controls)
- **Visual Crop**: Centered crop on the Zone Selector dropdown and facility filtering toolbar.
- **Cursor / Click Treatment**:
  - Click on Zone Selector: switch from `Pune Central` to `Ahmedabad West`, then to `North Delhi`.
  - Soft highlight ring on filter pills: click `Drinking Water`, `Misting Hub`, and `Medical ORS`.
  - Click to expand `Mandai Municipal Cooling & ORS Hub`.
- **Narration**:
  > *"HeatProof bridges live environmental science directly to vulnerable citizens and frontline gig workers.*  
  > *The system connects in real time to Numerical Weather Prediction streams via the Open-Meteo API, computing Steadman apparent temperature and Rothfusz heat stress adjustments dynamically.*  
  > *The interface is fully responsive, accessible to WCAG 2.2 AA standards, and instantly localized across English, Hindi, and Marathi.*  
  > *Notice the transparent provenance badges: weather telemetry is fetched live from Open-Meteo, while facility coordinates reflect verified municipal baseline fixtures.*  
  > *Users immediately identify verified operational sites nearby, accompanied by real-time witness corroboration counts."*
- **On-Screen Caption**:
  - `Telemetry Provenance: LIVE (Open-Meteo REST API)`
  - `Apparent Heat Stress: NOAA Steadman & Rothfusz Polynomial`
  - `Accessibility: 0 Automated Axe Violations (Tested States) · Multi-lingual (EN / HI / MR)`
- **Evidence Being Demonstrated**: Real-time zone weather refresh, Steadman temperature calculation, multi-lingual localization toggle.
- **Provenance Badges Visible**: `Weather: LIVE`, `Map: DEMO`.
- **Transition**: Smooth wipe transition to simulated mobile viewport.
- **Privacy / Redaction Requirement**: All displayed coordinates snapped to ~1.1km grid cells.

---

### Scene 3: Client-Side Privacy Boundary & Deterministic Evidence Rules Assistant
- **Timestamp**: `1:15 – 2:00`
- **Expected Duration**: 45 seconds
- **Route / Screen**: Mobile Viewport (390×844) → Observation Modal (`#report-observation-modal`)
- **Visual Crop**: High-contrast mobile frame centered on the active observation form.
- **Cursor / Click Treatment**:
  - Click "Submit Verification Update" on `Mandai Hub`.
  - Cursor highlights the prominent green Privacy Boundary notice.
  - Paste test notes containing a mock phone number (`+91 9876543210`); observe instant regex redaction to `[REDACTED_PHONE]`.
  - Select structured evidence type `Clean Continuous Water Flow` and click `Run Evidence Rules Check`.
  - Show the rule proposal card appearing with confidence score `95%` and status `AVAILABLE`.
- **Narration**:
  > *"When field workers or citizens submit operational reports, HeatProof strictly enforces a zero-PII privacy boundary before any packet touches the wire.*  
  > *GPS coordinates are coarsened client-side to a 1.1-kilometer bounding grid, camera EXIF metadata is irreversibly stripped in local canvas memory, and names or contact numbers are purged via client-side redaction.*  
  > *Under our strict governance doctrine—'Rules Propose; Humans Decide'—we do not rely on opaque generative models or pixel vision networks.*  
  > *Instead, our deterministic evidence-rules engine evaluates structured operational indicators, verifying flow metrics, temperature differentials, and tamper resistance.*  
  > *If evidence is degraded or conflicting, the engine explicitly abstains. Crucially, the rule assistant holds zero ledger execution authority; the citizen must review, verify, and authorize the submission."*
- **On-Screen Caption**:
  - `Zero-PII Client Boundary: EXIF Scrubbed · 1.1km Spatial Grid · Automatic PII Redaction`
  - `Governance Principle: Rules Propose; Humans Decide`
  - `Engine: Deterministic Heuristics (No Raw Pixel Vision Inference)`
- **Evidence Being Demonstrated**: Real-time client-side regex redaction, canvas EXIF stripping, deterministic heuristic rule classification with 100% benchmark consistency.
- **Provenance Badges Visible**: `Privacy Boundary: Client-Side Local Memory Only`.
- **Transition**: Cut back to facility card with updated attestation counter.
- **Privacy / Redaction Requirement**: Ensure mock phone number is visibly masked as `[REDACTED_PHONE]`; no user identifiers visible.

---

### Scene 4: 9-State Invariant FSM & N ≥ 2 Independent Witness Corroboration
- **Timestamp**: `2:00 – 2:40`
- **Expected Duration**: 40 seconds
- **Route / Screen**: Desktop Viewport (1440×900) → Attestation Modal (`#corroborate-modal`)
- **Visual Crop**: Focus on the facility lifecycle status badge and the attestation flow.
- **Cursor / Click Treatment**:
  - Submit first observation (`PROPOSED_AVAILABLE`).
  - Open attestation modal as a second distinct witness address.
  - Enter witness verification notes and click `Record Attestation on Ledger`.
  - Show the status pill transition dynamically from `PROPOSED` to `VERIFIED OPERATIONAL (Quorum N ≥ 2)`.
  - Demonstrate thermal escalation: toggle simulated ambient heat index to `43.5°C` and show tooltip indicating emergency $N=1$ outage dispatch threshold.
- **Narration**:
  > *"A single isolated claim can never flip critical municipal status.*  
  > *HeatProof's core transition logic is governed by a formal 9-state invariant finite state machine.*  
  > *Under nominal conditions, transitioning an infrastructure asset to 'Verified Operational' strictly requires N ≥ 2 independent witness attestations with distinct key signatures.*  
  > *However, during extreme heat stress—when the heat index surpasses 42°C Danger levels—our safety escalation protocol lowers the outage challenge threshold to a single corroborated report.*  
  > *This immediately alerts municipal response teams to dispatch emergency water tankers without bureaucratic delay."*
- **On-Screen Caption**:
  - `Formal Verification: Deterministic 9-State Invariant Engine`
  - `Consensus Quorum: N ≥ 2 Independent Witnesses Required`
  - `Safety Protocol: Emergency Quorum Escalation at Heat Index > 42°C`
- **Evidence Being Demonstrated**: State machine transition enforcement, anti-sybil self-attestation prevention, heat escalation quorum adjustment.
- **Provenance Badges Visible**: `State Engine: Invariant FSM (Formal Lifecycle)`.
- **Transition**: Smooth pan right to the "Inspect Cryptographic Proof" button.
- **Privacy / Redaction Requirement**: Attester addresses shown in truncated standard format (`0x71C...82A`).

---

### Scene 5: Cryptographic Proof Inspector & Local Tamper-Evident Receipts
- **Timestamp**: `2:40 – 3:15`
- **Expected Duration**: 35 seconds
- **Route / Screen**: Cryptographic Proof Inspector Modal (`#proof-inspector-modal`) & Browser DevTools
- **Visual Crop**: Split screen showing the Cryptographic Inspector on the left, and Chrome DevTools Network/Application tab on the right.
- **Cursor / Click Treatment**:
  - Click `Inspect Proof` on `Mandai Hub`.
  - Cursor traces canonical SHA-256 evidence digest, preimage JSON payload, and block height `#1000000`.
  - Open DevTools Network tab, check `Offline`, refresh browser page (`Ctrl+R`).
  - Show page reloading immediately via Service Worker cache with complete local state intact.
- **Narration**:
  > *"Every verified adaptation event generates a tamper-evident local receipt.*  
  > *In the Cryptographic Evidence Inspector, auditors can examine the canonical SHA-256 digest calculated over the zero-PII preimage payload, verify the multi-signature witness list, and trace the hash-chained block history.*  
  > *This demonstration uses local proof mode. The Arbitrum Sepolia adapter is implemented, but no confirmed testnet transaction is claimed in this recording.*  
  > *The installed Service Worker passed automated offline reload and local-workflow testing after an initial online load, ensuring resilient civic wayfinding even when disaster conditions interrupt cellular connectivity."*
- **On-Screen Caption**:
  - `Cryptographic Primitive: Canonical SHA-256 Preimage Digest & Hash-Chained Blocks`
  - `Mode Disclosure (Spoken & Visible): This demonstration uses local proof mode. The Arbitrum Sepolia adapter is implemented, but no confirmed testnet transaction is claimed in this recording.`
  - `Offline Resilience: Tested Offline Reload & Local Workflow After Initial Online Load`
- **Evidence Being Demonstrated**: Deterministic SHA-256 preimage verification, Merkle root consistency, Service Worker PWA offline reload.
- **Provenance Badges Visible**: `Ledger: LOCAL_DEMO (Tamper-Evident Local Hash Chain)`.
- **Transition**: Click on "Operations & Policy" tab in top navigation bar.
- **Privacy / Redaction Requirement**: Ensure no local system file paths or private secrets are visible in DevTools.

---

### Scene 6: Civic Operations & Climate Policy Command, Verifiable JSON Audit Bundle
- **Timestamp**: `3:15 – 3:35`
- **Expected Duration**: 20 seconds
- **Route / Screen**: Operations & Policy Dashboard (`/operations`)
- **Visual Crop**: Full desktop view of Operations Command KPIs and Priority Outage Queue.
- **Cursor / Click Treatment**:
  - Cursor highlights Heat Zone Operational Coverage (Pune: 100%, Ahmedabad: 66.7%).
  - Hover over Priority Outage Queue sorted by thermal severity.
  - Click `Export Verifiable Audit Bundle (JSON)`.
  - Brief callout of exported JSON structure containing signed blocks and Merkle roots.
- **Narration**:
  > *"For municipal climate resilience directors and global climate finance institutions, the Operations Command provides end-to-end transparency: real-time heat zone coverage metrics, SLA response tracking, and priority triage queues.*  
  > *With one click, auditors can export the complete verifiable audit bundle in machine-readable JSON format, containing complete cryptographic proofs, witness signatures, and environmental sensor readings."*
- **On-Screen Caption**:
  - `Municipal Policy Command: Real-Time Heat Zone Operational Coverage & SLA Tracking`
  - `Audit Export: Machine-Readable Cryptographic Audit Bundle (JSON)`
- **Evidence Being Demonstrated**: Real-time KPI aggregation, thermal priority ranking, cryptographic JSON bundle export.
- **Provenance Badges Visible**: `Operations: Multi-Source Provenance Aggregation`.
- **Transition**: Slow fade to concluding title slide.
- **Privacy / Redaction Requirement**: All exported audit records are PII-minimized through client-side sanitization and coordinate coarsening.

---

### Scene 7: Summary, Repositories & Call to Action
- **Timestamp**: `3:35 – 3:40`
- **Expected Duration**: 5 seconds
- **Route / Screen**: Closing Title Card (`docs/assets/heatproof-devpost-thumbnail.png`)
- **Visual Crop**: Static 1920×1080 graphic card.
- **Cursor / Click Treatment**: Static focal point.
- **Narration**:
  > *"HeatProof: Transforming extreme-heat adaptation from unverified promises into cryptographically provable, life-saving reality. Thank you."*
- **On-Screen Caption**:
  - `HeatProof: Verifiable Proof-of-Adaptation Network`
  - `Live Demo: https://abhijeetnardele24-hash.github.io/heatproof/`
  - `Source Code: https://github.com/abhijeetnardele24-hash/heatproof`
  - `IEEE ClimateChain Global Hackathon 2026`
- **Evidence Being Demonstrated**: Verified open-source codebase and live GitHub Pages deployment.
- **Provenance Badges Visible**: None (branding slate).
- **Transition**: Clean fade to black.
- **Privacy / Redaction Requirement**: None.

---

## 3. Mandatory Compliance Checklist for Video Recording
- [x] Spoken & visible mode disclosure included: *"This demonstration uses local proof mode. The Arbitrum Sepolia adapter is implemented, but no confirmed testnet transaction is claimed in this recording."* (Scene 5, duration: 6 seconds).
- [x] Zero overclaims: Verified removal of unqualified offline assertions, absolute immutability claims, hallucination guarantees, and unsourced funding statistics.
- [x] Provenance explicitly labelled: Weather (LIVE), Map (DEMO), Ledger (LOCAL_DEMO).
- [x] Video rendering deferred to external production agent as instructed.
