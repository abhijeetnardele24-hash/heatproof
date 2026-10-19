# HeatProof — Cryptographic Ledger & Blockchain Proof Report

Generated automatically by `scripts/verify-onchain.ts` on **Mon, 19 Oct 2026 18:38:00 GMT**.

## 1. Network Status & Operating Mode

| Property | Value |
|---|---|
| **Active Mode** | `DETERMINISTIC_LOCAL` |
| **Active Provider** | HeatProof Deterministic Cryptographic Ledger |
| **Network Name** | Local Secure Proof Log (SHA-256 Hash Chain) |
| **EVM Chain ID** | N/A (Local Proof Chain) |
| **Block Height** | `#1048200` |
| **RPC Availability** | Online (Live / Testnet) |



---

## 2. Verified Ledger Receipts

### A. Observation Digest Anchor
- **Record ID**: `obs-verify-20261019-01`
- **Record Type**: `OBSERVATION`
- **Canonical SHA-256 Digest**: `0x3e2e9ef66bc10263ef256eb9c0b4c4ddf199f1850a6a792b4de1c00152e6a9e0`
- **Transaction Hash**: `0x2db646c2c0fd93f457cb0b369550e0ff9d4a8ce5031520401cecad043d51bcb6`
- **Block Number**: `#1048201`
- **Status**: `CONFIRMED`
- **Network**: Local Secure Proof Log
- **Explorer Link**: Cryptographic Hash Log (Local Verified Node)

### B. Corroborating Witness Attestation
- **Record ID**: `att-verify-20261019-01`
- **Parent Observation**: `obs-verify-20261019-01`
- **Witness Digest**: `0x461e568974780e13e95d1471a317ff273aa949e64d66fda20c1c6685d3c0609e`
- **Transaction Hash**: `0x0fb71173315ee48153cf61b0d4143929d87539c5496e60518f4da4d11a14df01`
- **Block Number**: `#1048202`
- **Status**: `CONFIRMED`

### C. Adaptation Service Receipt (ASR) Anchor
- **Receipt ID**: `asr_fac-pune-mandai-01_20261019T100000_1e8338b4`
- **Merkle Aggregate Root**: `0xf5f17b7483509a839d795a5c8f6521baec671ff9956e5e56e40cc8de3e1f64df`
- **Transaction Hash**: `0x97fda962fcdce3e2e5aa3d2e51a3ed22a6c5f12cafd8e22483b9b9d12e24f425`
- **Block Number**: `#1048203`
- **Status**: `CONFIRMED`
- **Notes**: Adaptation Service Receipt asr_fac-pune-mandai-01_20261019T100000_1e8338b4 anchored to cryptographic hash chain. Zone: Pune Central (Shivajinagar & Mandai).

---

## 3. Cryptographic Proof Invariants Enforced

1. **Deterministic Preimage Hashing**: All transaction hashes and Merkle roots are deterministically generated from canonical JSON representations without arbitrary salt.
2. **Fail-Closed Verification**: Any discrepancy between on-chain / logged digests and recomputed evidence payloads results in immediate invalidation.
3. **Zero PII on Ledger**: Only SHA-256 digests of privacy-sanitized evidence are recorded on public or local ledgers.
