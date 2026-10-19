# HeatProof Privacy Boundary & Data Minimization Protocol

> **Specification**: Privacy-Preserving Civic Observation Protocol  
> **Standard**: Zero-PII Cryptographic State Anchoring  

---

## 1. Core Privacy Philosophy

HeatProof operates under a strict **Zero Personally Identifiable Information (Zero-PII)** architecture. In crisis response and civic resilience networks, collecting user identities, precise residence locations, or device metadata exposes community members to physical surveillance, targeted scams, or harassment.

---

## 2. The Four Privacy Filters

```
[Raw Citizen Input]
       │
       ▼ (1) Client-Side EXIF Scrubbing: GPS & Camera Serial Stripped
[Sanitized Image Asset]
       │
       ▼ (2) Coordinate Coarsening: ~1.1km Bounding Grid (0.01° Snap)
[Coarsened Spatial Anchor]
       │
       ▼ (3) Text PII Regex Redaction: Phone, Aadhaar, Email Dropped
[Clean Preimage Payload]
       │
       ▼ (4) Deterministic SHA-256 Hasher
[Canonical 32-Byte Evidence Digest (Committed On-Chain)]
```

---

## 3. Detailed Filter Specifications

### 3.1 Client-Side EXIF Metadata Scrubbing
When a volunteer uploads a photo of a water tap or shaded canopy:
- The image is loaded into an HTML5 offscreen `<canvas>` element.
- The pixel data is redrawn and re-exported as clean PNG/WebP without EXIF headers.
- Tags stripped include:
  - `GPSLatitude` / `GPSLongitude` / `GPSAltitude`
  - `Make` / `Model` / `BodySerialNumber`
  - `DateTimeOriginal` / `OffsetTime`

### 3.2 Coordinate Coarsening Algorithm
Precise GPS coordinates are coarsened client-side before any hash is computed:
```typescript
export function coarsenCoordinates(lat: number, lng: number, precisionDecimals = 2): CoarseCoordinates {
  const factor = Math.pow(10, precisionDecimals); // 100 for 2 decimal places
  const coarseLat = Math.round(lat * factor) / factor;
  const coarseLng = Math.round(lng * factor) / factor;
  return {
    lat: coarseLat,
    lng: coarseLng,
    precisionKm: 1.11, // At the equator, 0.01° ≈ 1.11 km
  };
}
```
- **Privacy Guarantee**: Any coordinate pair identifies an entire neighborhood sector of $\approx 1.2\text{ km}^2$, never a single building, doorstep, or person.

### 3.3 Zero-PII Regex Redactor
All user-entered text passes through regex sanitizers:
- **Phone Numbers**: Matches 10-digit Indian mobile formats (`(\+91[\-\s]?)?[6789]\d{9}`), US formats, and generic international numbers.
- **Aadhaar Numbers**: Matches 12-digit Indian national identity numbers (`\d{4}[\s\-]?\d{4}[\s\-]?\d{4}`).
- **Email Addresses**: Matches standard RFC-5322 email patterns.
- **Vehicle License Plates**: Matches Indian RTO registration formats (`[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}`).

If any violation is detected:
1. The client UI highlights the violation and displays a descriptive privacy warning.
2. The user is prompted to remove personal details.
3. If auto-sanitized, the string is replaced with `[REDACTED_PII]`.

---

## 4. On-Chain vs. Off-Chain Separation

| Data Element | Storage Location | Privacy Status |
| :--- | :--- | :--- |
| **Facility ID & Name** | On-chain & Registry | Public Civic Knowledge |
| **Zone Name (`Pune Central`)** | On-chain & Registry | Public Civic Knowledge |
| **Operational State (`VERIFIED_AVAILABLE`)** | On-chain Smart Contract | Public Verifiable State |
| **Attester Ethereum Address** | On-chain Event Log | Pseudonymous Witness Address |
| **SHA-256 Evidence Digest** | On-chain Event Log | One-Way Cryptographic Hash |
| **Raw Field Observation Notes** | Ephemeral Client-Side | Never Stored on Chain |
| **Physical Image Pixels** | Local Device Only | Never Stored on Chain |
| **Exact User GPS Coordinates** | Discarded Client-Side | Never Stored or Transmitted |
| **Phone Numbers / Names** | Rejected by Filter | Strictly Prohibited |
