# HeatProof — Cryptographic Proof Ledger Report

Generated automatically by `scripts/verify-onchain.ts` on **Mon, 19 Oct 2026 21:48:18 GMT**.

## 1. Truthful Ledger Operating Modes

HeatProof strictly enforces four explicit operating modes to prevent misleading users or judges:

| Mode | Description | Explorer Link Rule |
|---|---|---|
| `LOCAL_DEMO` | Client-side append-only SHA-256 hash chain sequence. Zero simulated EVM hashes. | `null` (No explorer URL) |
| `TESTNET_PENDING_SIGNATURE` | Web3 browser wallet requested (EIP-1193); waiting for human user approval. | `null` until broadcast |
| `TESTNET_CONFIRMED` | Real transaction broadcast to Arbitrum Sepolia (Chain ID 421614) and confirmed by on-chain receipt. | `https://sepolia.arbiscan.io/tx/{hash}` |
| `DEGRADED` | Wallet rejected, network error, or RPC unavailable. System operates offline with local evidence queue. | `null` |

---

## 2. Active Verification Status (Headless / CI Environment)

| Property | Value |
|---|---|
| **Active Mode** | `LOCAL_DEMO` |
| **Active Provider** | HeatProof Local Cryptographic Proof Log |
| **Network Name** | Local Deterministic Proof Log (Demo) |
| **Block / Sequence Height** | `#1000000` |
| **Is EVM Transaction** | `false` (Truthful: In CI/Headless, no browser wallet is injected) |
| **Explorer URL** | `null` (Truthful: Never fabricated for local proofs) |

---

## 3. Verified Cryptographic Records

### A. Observation Digest Anchor
- **Record ID**: `obs-verify-20261019-01`
- **Record Type**: `OBSERVATION`
- **Canonical SHA-256 Digest**: `0x3e2e9ef66bc10263ef256eb9c0b4c4ddf199f1850a6a792b4de1c00152e6a9e0`
- **Local Proof Hash**: `189cae8ddbf49e6c42766dd91596f72b59bfceec1237cd6a72dda15f6d443e40`
- **EVM Transaction Hash**: `null (Local proof log)`
- **Sequence Number**: `#1000001`
- **Status**: `LOCAL_RECORDED`
- **Network**: Local Secure Proof Log (SHA-256 Chain)
- **Explorer Link**: None (Cryptographic Hash Log)

### B. Corroborating Witness Attestation
- **Record ID**: `att-verify-20261019-01`
- **Parent Observation**: `obs-verify-20261019-01`
- **Witness Digest**: `0x461e568974780e13e95d1471a317ff273aa949e64d66fda20c1c6685d3c0609e`
- **Local Proof Hash**: `7d0fcf74aa2b9d605c199653a6ba454131bb9b0917a05a061ead1cbc28774e5d`
- **Status**: `CONFIRMED`

### C. Adaptation Service Receipt (ASR) Anchor
- **Receipt ID**: `asr_fac-pune-mandai-01_20261019T100000_1e8338b4`
- **Merkle Aggregate Root**: `0xf5f17b7483509a839d795a5c8f6521baec671ff9956e5e56e40cc8de3e1f64df`
- **Local Proof Hash**: `bbc856b7922ca24cd191d1fd9c1d469aacb528bcc4be0ae72fbf71c69cda53c7`
- **Status**: `CONFIRMED`
- **Notes**: Zone: Pune Central (Shivajinagar & Mandai)

---

## 4. Cryptographic Proof Invariants Enforced

1. **Deterministic Preimage Hashing**: All hashes are deterministically generated from canonical JSON representations without arbitrary salt.
2. **Fail-Closed Verification**: Any discrepancy between logged digests and recomputed evidence payloads results in immediate invalidation.
3. **Zero PII on Ledger**: Only SHA-256 digests of privacy-sanitized evidence are recorded.
4. **No Simulated EVM Hashes**: A local SHA-256 hash is never formatted or represented as an EVM transaction hash.
