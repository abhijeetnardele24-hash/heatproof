/**
 * Adaptation Service Receipt (ASR) Engine
 *
 * Implements cryptographic aggregation, Merkle root calculation,
 * and fail-closed validation for extreme-heat relief delivery receipts.
 */

import {
  AdaptationServiceReceipt,
  AdaptationServiceReceiptSchema,
  Facility,
  HazardWindow,
  Observation,
  Attestation,
} from "./types";
import { canonicalSha256Hex } from "../privacy/evidenceHasher";

export interface GenerateReceiptInput {
  facility: Facility;
  hazardWindow: HazardWindow;
  serviceInterval: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  observations: Observation[];
  attestations: Attestation[];
  issuerAddress: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Computes a deterministic Merkle-style aggregate root for an ASR
 * from sorted observation digests, attestation digests, facility metadata, and hazard data.
 */
export function computeReceiptMerkleRoot(
  facilityId: string,
  zone: string,
  hazardId: string,
  observationDigests: string[],
  attestationDigests: string[]
): `0x${string}` {
  const sortedObs = [...observationDigests].sort();
  const sortedAtt = [...attestationDigests].sort();

  const preimage = {
    facilityId,
    zone,
    hazardId,
    observations: sortedObs,
    attestations: sortedAtt,
  };

  return canonicalSha256Hex(preimage);
}

/**
 * Generates an Adaptation Service Receipt (ASR) enforcing fail-closed preconditions.
 */
export function generateAdaptationReceipt(input: GenerateReceiptInput): AdaptationServiceReceipt {
  const { facility, hazardWindow, serviceInterval, observations, attestations, issuerAddress } = input;

  if (observations.length === 0) {
    throw new Error("ASR generation requires at least one verified source observation.");
  }
  if (attestations.length === 0) {
    throw new Error("ASR generation requires at least one corroborating attestation.");
  }

  // Precondition: All observations must belong to the facility
  for (const obs of observations) {
    if (obs.facilityId !== facility.facilityId) {
      throw new Error(`Observation ${obs.observationId} facilityId mismatch: ${obs.facilityId} != ${facility.facilityId}`);
    }
    if (obs.humanConfirmedState !== "available") {
      throw new Error(`Observation ${obs.observationId} is not available (state: ${obs.humanConfirmedState}).`);
    }
  }

  // Precondition: Attestations must confirm operational state
  const confirmingAttestations = attestations.filter(
    (att) => att.verdict === "CONFIRM"
  );
  if (confirmingAttestations.length === 0) {
    throw new Error("Cannot issue ASR: no confirming attestations found.");
  }

  // Extract digests
  const observationDigests = observations.map((o) => o.evidenceDigest);
  const attestationDigests = attestations.map((a) => a.evidenceDigest);

  // Compute aggregate Merkle root
  const evidenceMerkleRoot = computeReceiptMerkleRoot(
    facility.facilityId,
    facility.zone,
    hazardWindow.hazardId,
    observationDigests,
    attestationDigests
  );

  const hashPrefix = evidenceMerkleRoot.slice(2, 10);
  const startTimeClean = serviceInterval.start.replace(/[-:]/g, "").slice(0, 15);
  const receiptId = `asr_${facility.facilityId}_${startTimeClean}_${hashPrefix}`;

  const receipt: AdaptationServiceReceipt = {
    receiptId,
    version: "1.0.0",
    facilityId: facility.facilityId,
    facilityName: facility.name,
    resourceType: facility.resourceType,
    zone: facility.zone,
    hazardWindow,
    serviceInterval,
    sourceObservationIds: observations.map((o) => o.observationId),
    attestationIds: attestations.map((a) => a.attestationId),
    evidenceMerkleRoot,
    verificationStatus: "VERIFIED_SERVICE_DELIVERED",
    methodologyVersion: "IEEE-CLIMATECHAIN-ADAPTATION-V1",
    limitations: [
      "Receipt certifies verified operational status of the physical facility during the active hazard window.",
      "Does not measure individual civic hydration volume or medical outcome metrics.",
      "Evidence digests represent privacy-minimized public hashes; raw media is preserved off-chain under sanitization rules.",
    ],
    issuedAt: new Date().toISOString(),
    issuerAddress,
  };

  return AdaptationServiceReceiptSchema.parse(receipt);
}

/**
 * Validates an Adaptation Service Receipt against cryptographic integrity and domain rules.
 */
export function validateAdaptationReceipt(
  receipt: AdaptationServiceReceipt,
  knownObservations?: Observation[],
  knownAttestations?: Attestation[]
): ValidationResult {
  const errors: string[] = [];

  // 1. Schema check
  const parseResult = AdaptationServiceReceiptSchema.safeParse(receipt);
  if (!parseResult.success) {
    errors.push(`Schema validation failed: ${parseResult.error.message}`);
    return { valid: false, errors };
  }

  // 2. Hazard threshold check: Relief is only valid under elevated heat hazard
  const validHazardSeverities = ["CAUTION", "EXTREME_CAUTION", "DANGER", "EXTREME_DANGER"];
  if (!validHazardSeverities.includes(receipt.hazardWindow.severity)) {
    errors.push(`Hazard severity ${receipt.hazardWindow.severity} does not warrant emergency adaptation relief credit.`);
  }

  // 3. Service interval logic check
  const startTime = new Date(receipt.serviceInterval.start).getTime();
  const endTime = new Date(receipt.serviceInterval.end).getTime();
  if (endTime <= startTime) {
    errors.push(`Service interval end (${receipt.serviceInterval.end}) must be after start (${receipt.serviceInterval.start}).`);
  }

  // 4. Source count checks
  if (receipt.sourceObservationIds.length === 0) {
    errors.push("ASR contains zero source observation IDs.");
  }
  if (receipt.attestationIds.length === 0) {
    errors.push("ASR contains zero attestation IDs.");
  }

  // 5. Cryptographic Merkle root verification if source objects are provided
  if (knownObservations && knownAttestations) {
    const matchingObs = knownObservations.filter((o) =>
      receipt.sourceObservationIds.includes(o.observationId)
    );
    const matchingAtt = knownAttestations.filter((a) =>
      receipt.attestationIds.includes(a.attestationId)
    );

    if (matchingObs.length !== receipt.sourceObservationIds.length) {
      errors.push(`Missing source observations in verification set (${matchingObs.length}/${receipt.sourceObservationIds.length} found).`);
    }
    if (matchingAtt.length !== receipt.attestationIds.length) {
      errors.push(`Missing source attestations in verification set (${matchingAtt.length}/${receipt.attestationIds.length} found).`);
    }

    // Verify all observations are available
    for (const obs of matchingObs) {
      if (obs.humanConfirmedState !== "available") {
        errors.push(`Source observation ${obs.observationId} has invalid state ${obs.humanConfirmedState}; must be available.`);
      }
    }

    const recomputedRoot = computeReceiptMerkleRoot(
      receipt.facilityId,
      receipt.zone,
      receipt.hazardWindow.hazardId,
      matchingObs.map((o) => o.evidenceDigest),
      matchingAtt.map((a) => a.evidenceDigest)
    );

    if (recomputedRoot !== receipt.evidenceMerkleRoot) {
      errors.push(`Cryptographic digest mismatch: computed ${recomputedRoot} vs receipt ${receipt.evidenceMerkleRoot}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
