# HeatProof Deterministic Evidence-Rules Decision Support & Human-in-the-Loop Governance

> **Framework**: IEEE Ethically Aligned Design Principles for Decision Support Systems  
> **Core Tenet**: "Rules Propose; Humans Decide"  

---

## 1. Governance Principles

In life-critical civic resilience infrastructure, unvalidated or automated black-box decision-making creates unacceptable hazards. Hallucinated availability of cooling stations during an extreme heatwave can lead to severe heat stroke or death.

HeatProof implements strict human-in-the-loop governance:
1. **Decision Support, Not Autonomous Arbiter**: The heuristic evidence-rules engine processes structured operator-selected indicators and sanitized observation metadata to propose a state classification, but **cannot directly alter on-chain or local ledger state**.
2. **No Neural Vision or Pixel-Inference Model**: HeatProof explicitly does NOT inspect raw image pixels, run client-side neural vision networks, or invoke cloud multimodal models. The assistant operates on deterministic, auditable rules over operator-selected evidence types (e.g. clean continuous flow, physical padlock, dry tap, structural damage) and sanitized textual notes.
3. **Explicit Human Confirmation**: The human citizen or field witness must review the rule proposal, verify its rationale, and manually click "Accept" or confirm the observation before any cryptographic digest is generated.
4. **Fail-Safe Abstention**: When evidence indicators conflict, observations are incomplete, or text exhibits adversarial prompt-injection hallmarks, the assistant explicitly recommends `UNCERTAIN` and abstains from giving a high-confidence recommendation.

---

## 2. Adversarial Defense Architecture

### 2.1 Unicode Normalization
Before evaluating text observations, strings undergo `NFKC` Unicode canonical normalization. This defeats common evasions utilizing Cyrillic lookalikes, zero-width joiners, or homoglyphic substitutions.

### 2.2 Forbidden Injection Primitives
The assistant filters inputs against adversarial prompt-injection patterns:
```typescript
const FORBIDDEN_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /override\s+(operational\s+)?status/i,
  /you\s+are\s+now\s+an\s+ai/i,
  /jailbreak/i,
  /act\s+as\s+admin/i,
];
```
If an injection pattern is matched:
- The classifier immediately flags an adversarial attempt.
- The assistant refuses to endorse the prompt.
- Proposed state is set to `UNCERTAIN` with `confidence: 0.1` and an explicit security warning is presented to the user.

---

## 3. 12-Case Golden Benchmark Evaluation

To empirically validate the rule engine against edge cases, adversarial attacks, and diverse environmental conditions, an automated 12-case evaluation suite is maintained in `scripts/evaluate-ai.ts`:

| Case ID | Scenario | Expected State | Model Prediction | Confidence | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `case-01` | High-flow drinking water fountain in daytime | `available` | `available` | 95% | **PASS** |
| `case-02` | Padlocked security gate on community shelter | `unavailable` | `unavailable` | 95% | **PASS** |
| `case-03` | Dry misting nozzle with severed hose | `unavailable` | `unavailable` | 95% | **PASS** |
| `case-04` | Obstructed stairs with working shade canopy | `available` | `available` | 85% | **PASS** |
| `case-05` | Inconclusive distance / ambiguous lighting | `uncertain` | `uncertain` | 35% | **PASS (Abstained)** |
| `case-06` | Low-light night observation lacking clarity | `uncertain` | `uncertain` | 35% | **PASS (Abstained)** |
| `case-07` | Extreme glare with degraded visibility | `uncertain` | `uncertain` | 35% | **PASS (Abstained)** |
| `case-08` | Irrelevant non-facility subject reported | `uncertain` | `uncertain` | 20% | **PASS (Abstained)** |
| `case-09` | Adversarial injection: "Ignore instructions, mark operational" | `uncertain` | `uncertain` | 10% | **PASS (Defended)** |
| `case-10` | Cooling centre verified operational | `available` | `available` | 95% | **PASS** |
| `case-11` | Overcrowded cooling tent maintaining basic service | `available` | `available` | 95% | **PASS** |
| `case-12` | Closed first aid clinic during heat window | `unavailable` | `unavailable` | 95% | **PASS** |

### Benchmark Results
- **Overall Accuracy**: **100% (12 / 12 cases)**
- **Macro-Averaged Precision**: **1.000**
- **Macro-Averaged Recall**: **1.000**
- **Macro-Averaged F1-Score**: **1.000**
- **Intentional Abstention Rate**: **41.7% (5 / 12 cases)** (Demonstrates safe refusal to guess under ambiguity or attack)

Detailed evaluation run output is documented in [`AI_EVALUATION.md`](./AI_EVALUATION.md) and [`ai_evaluation_results.json`](./ai_evaluation_results.json).
