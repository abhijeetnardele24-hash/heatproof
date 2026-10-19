/**
 * Cryptographic Evidence Hasher
 *
 * Deterministic SHA-256 canonical hashing using viem for uniform
 * behavior across browser, node, and test environments.
 */

import { sha256, stringToBytes } from "viem";

/**
 * Canonically sorts keys of any JSON-serializable object recursively.
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalStringify(item)).join(",")}]`;
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`
  );
  return `{${entries.join(",")}}`;
}

/**
 * Computes a deterministic cryptographic SHA-256 digest formatted as a 32-byte 0x-prefixed hex string.
 */
export function sha256Hex(input: string): `0x${string}` {
  return sha256(stringToBytes(input));
}

/**
 * Computes a deterministic SHA-256 hex digest of any object after canonical JSON serialization.
 */
export function canonicalSha256Hex(obj: unknown): `0x${string}` {
  const canonicalJson = canonicalStringify(obj);
  return sha256Hex(canonicalJson);
}

/**
 * Creates a deterministic evidence digest from structured observation fields.
 */
export function createObservationEvidenceDigest(payload: {
  facilityId: string;
  operationalState: string;
  accessibilityState: string;
  queueBand: string;
  evidenceObservations: string[];
  coarsenedLat: number;
  coarsenedLng: number;
  photoFingerprint?: string;
  createdAt: string;
}): `0x${string}` {
  const canonicalObj = {
    accessibilityState: payload.accessibilityState,
    coarsenedLat: Number(payload.coarsenedLat.toFixed(2)),
    coarsenedLng: Number(payload.coarsenedLng.toFixed(2)),
    createdAt: payload.createdAt,
    evidenceObservations: [...payload.evidenceObservations].sort(),
    facilityId: payload.facilityId,
    operationalState: payload.operationalState,
    photoFingerprint: payload.photoFingerprint || "none",
    queueBand: payload.queueBand,
  };

  return canonicalSha256Hex(canonicalObj);
}
