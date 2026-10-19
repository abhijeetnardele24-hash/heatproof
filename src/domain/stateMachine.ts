import {
  CanonicalState,
  Observation,
  Attestation,
  OperationalState,
} from "./types";

export interface StateEvaluationResult {
  state: CanonicalState;
  reason: string;
  independentAttestationCount: number;
  isExpired: boolean;
  activeDispute: boolean;
  effectiveOperationalState: OperationalState;
  validAttestations: Attestation[];
  rejectedAttestations: { attestation: Attestation; reason: string }[];
}

/**
 * Deterministically evaluates the canonical operational state of a facility
 * based on its latest observation, independent attestations, and current time.
 *
 * Enforces all 7 core invariants from the IEEE ClimateChain HeatProof specification:
 * 1. Self-attestation rejection (reporter cannot attest to own observation).
 * 2. Sybil deduplication (same attester address counted at most once).
 * 3. Deterministic expiry boundary (currentTime >= expiresAt -> EXPIRED).
 * 4. Challenge priority (independent CHALLENGE -> DISPUTED).
 * 5. Quorum threshold (>= 1 valid independent confirmation -> VERIFIED).
 * 6. Contradiction visibility (disputes are never silently averaged away).
 * 7. Restoration lineage (confirmed restoration links to previous outage).
 */
export function evaluateFacilityState(
  latestObservation: Observation | null | undefined,
  attestations: Attestation[],
  currentTime: Date = new Date()
): StateEvaluationResult {
  // Case 1: No observations exist yet
  if (!latestObservation) {
    return {
      state: "UNVERIFIED",
      reason: "No observation has been recorded for this facility.",
      independentAttestationCount: 0,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations: [],
      rejectedAttestations: [],
    };
  }

  // Case 2: Time-bounded Expiry
  const expiresAtDate = new Date(latestObservation.expiresAt);
  const isExpired = currentTime.getTime() >= expiresAtDate.getTime();

  if (isExpired) {
    return {
      state: "EXPIRED",
      reason: `Observation expired on ${expiresAtDate.toISOString()} (deterministic time-boundary). Stale operational claims are deemed unsafe.`,
      independentAttestationCount: 0,
      isExpired: true,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations: [],
      rejectedAttestations: [],
    };
  }

  // Filter attestations relevant to this observation
  const observationAttestations = attestations.filter(
    (a) => a.observationId === latestObservation.observationId
  );

  const reporterNormalized = latestObservation.reporter.trim().toLowerCase();
  const validAttestations: Attestation[] = [];
  const rejectedAttestations: { attestation: Attestation; reason: string }[] = [];
  const seenAttesters = new Set<string>();

  let hasIndependentChallenge = false;
  let hasIndependentUncertain = false;

  for (const attestation of observationAttestations) {
    const attesterNormalized = attestation.attester.trim().toLowerCase();

    // Invariant 1: Reporter cannot attest to their own observation
    if (attesterNormalized === reporterNormalized) {
      rejectedAttestations.push({
        attestation,
        reason: "Self-attestation rejected: reporter address matches attester address.",
      });
      continue;
    }

    // Invariant 2: Sybil protection: deduplicate multiple submissions from the same address
    if (seenAttesters.has(attesterNormalized)) {
      rejectedAttestations.push({
        attestation,
        reason: "Duplicate attestation rejected: address already contributed an attestation for this observation.",
      });
      continue;
    }

    seenAttesters.add(attesterNormalized);
    validAttestations.push(attestation);

    if (attestation.verdict === "CHALLENGE") {
      hasIndependentChallenge = true;
    } else if (attestation.verdict === "UNCERTAIN") {
      hasIndependentUncertain = true;
    }
  }

  // Invariant 4: Challenge priority -> DISPUTED
  if (hasIndependentChallenge) {
    return {
      state: "DISPUTED",
      reason: "An independent verifier submitted a CHALLENGE contesting the operational claim. Contradiction is preserved.",
      independentAttestationCount: validAttestations.length,
      isExpired: false,
      activeDispute: true,
      effectiveOperationalState: "uncertain",
      validAttestations,
      rejectedAttestations,
    };
  }

  // Invariant 6: Inconclusive reports -> UNCERTAIN
  if (hasIndependentUncertain && validAttestations.filter((a) => a.verdict === "CONFIRM").length === 0) {
    return {
      state: "UNCERTAIN",
      reason: "Independent attestations reported uncertain or inconclusive evidence.",
      independentAttestationCount: validAttestations.length,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations,
      rejectedAttestations,
    };
  }

  const confirmCount = validAttestations.filter((a) => a.verdict === "CONFIRM").length;
  const reportedState = latestObservation.humanConfirmedState;

  // Case 3: Confirmed Quorum (>= 1 valid independent confirmation)
  if (confirmCount >= 1) {
    if (reportedState === "available") {
      // Invariant 7: If linking to a prior outage, this is a verified restoration
      if (latestObservation.restoredOutageId) {
        return {
          state: "RESTORED",
          reason: `Verified restoration: service recovery confirmed by ${confirmCount} independent verifier(s), referencing outage ID ${latestObservation.restoredOutageId}.`,
          independentAttestationCount: confirmCount,
          isExpired: false,
          activeDispute: false,
          effectiveOperationalState: "available",
          validAttestations,
          rejectedAttestations,
        };
      }
      return {
        state: "VERIFIED_AVAILABLE",
        reason: `Operational availability verified by ${confirmCount} independent witness(es).`,
        independentAttestationCount: confirmCount,
        isExpired: false,
        activeDispute: false,
        effectiveOperationalState: "available",
        validAttestations,
        rejectedAttestations,
      };
    } else if (reportedState === "unavailable") {
      return {
        state: "VERIFIED_UNAVAILABLE",
        reason: `Operational failure/outage confirmed by ${confirmCount} independent witness(es).`,
        independentAttestationCount: confirmCount,
        isExpired: false,
        activeDispute: false,
        effectiveOperationalState: "unavailable",
        validAttestations,
        rejectedAttestations,
      };
    } else {
      return {
        state: "UNCERTAIN",
        reason: "Reported state was marked uncertain by reporter.",
        independentAttestationCount: confirmCount,
        isExpired: false,
        activeDispute: false,
        effectiveOperationalState: "uncertain",
        validAttestations,
        rejectedAttestations,
      };
    }
  }

  // Case 4: Proposed state pending independent verification
  if (reportedState === "available") {
    return {
      state: "PROPOSED_AVAILABLE",
      reason: "Single observation submitted claiming availability; awaiting independent attestation.",
      independentAttestationCount: 0,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations,
      rejectedAttestations,
    };
  } else if (reportedState === "unavailable") {
    return {
      state: "PROPOSED_UNAVAILABLE",
      reason: "Single observation submitted claiming outage/failure; awaiting independent attestation.",
      independentAttestationCount: 0,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "unavailable",
      validAttestations,
      rejectedAttestations,
    };
  }

  return {
    state: "UNCERTAIN",
    reason: "Observation submitted with inconclusive operational state.",
    independentAttestationCount: 0,
    isExpired: false,
    activeDispute: false,
    effectiveOperationalState: "uncertain",
    validAttestations,
    rejectedAttestations,
  };
}
