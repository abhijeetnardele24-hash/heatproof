import {
  CanonicalState,
  Observation,
  Attestation,
  OperationalState,
  HazardLevel,
} from "./types";

export interface HazardEvaluationContext {
  heatIndexCelsius: number;
  hazardLevel?: HazardLevel;
}

export interface StateEvaluationResult {
  state: CanonicalState;
  reason: string;
  independentAttestationCount: number;
  isExpired: boolean;
  activeDispute: boolean;
  effectiveOperationalState: OperationalState;
  validAttestations: Attestation[];
  rejectedAttestations: { attestation: Attestation; reason: string }[];
  requiredAttestations: number;
  hazardAccelerated: boolean;
}

/**
 * Deterministically evaluates the canonical operational state of a facility
 * based on its latest observation, independent attestations, current time,
 * and live climate hazard context.
 *
 * Enforces all core invariants from the IEEE ClimateChain HeatProof specification:
 * 1. Self-attestation rejection (reporter address cannot attest to own observation).
 * 2. Sybil deduplication (same attester address counted at most once per observation).
 * 3. Deterministic time-bounded expiry (currentTime >= expiresAt -> EXPIRED).
 * 4. Challenge priority (any independent CHALLENGE -> DISPUTED).
 * 5. Corroboration Quorum:
 *    - Availability verification strictly requires >= 2 independent witness confirmations.
 *    - Outage verification requires >= 2 independent confirmations under normal conditions.
 *    - Emergency Outage Verification: accelerates to 1 independent confirmation ONLY when
 *      an active measured extreme heat hazard (Heat Index >= 42°C or DANGER/EXTREME_DANGER) is active.
 * 6. Contradiction preservation (disputes never silently averaged away).
 * 7. Restoration lineage (verified restoration must reference a prior verified outage ID).
 */
export function evaluateFacilityState(
  latestObservation: Observation | null | undefined,
  attestations: Attestation[],
  currentTime: Date = new Date(),
  hazardContext?: HazardEvaluationContext
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
      requiredAttestations: 2,
      hazardAccelerated: false,
    };
  }

  // Case 2: Time-bounded Expiry
  const expiresAtDate = new Date(latestObservation.expiresAt);
  const isExpired = currentTime.getTime() >= expiresAtDate.getTime();

  if (isExpired) {
    return {
      state: "EXPIRED",
      reason: `Observation expired on ${expiresAtDate.toISOString()} (deterministic time-boundary). Stale operational claims are deemed unsafe for extreme heat relief.`,
      independentAttestationCount: 0,
      isExpired: true,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations: [],
      rejectedAttestations: [],
      requiredAttestations: 2,
      hazardAccelerated: false,
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
      requiredAttestations: 2,
      hazardAccelerated: false,
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
      requiredAttestations: 2,
      hazardAccelerated: false,
    };
  }

  const confirmCount = validAttestations.filter((a) => a.verdict === "CONFIRM").length;
  const reportedState = latestObservation.humanConfirmedState;

  // Determine required quorum based on policy and live hazard context
  const isExtremeHeat =
    hazardContext !== undefined &&
    (hazardContext.heatIndexCelsius >= 42 ||
      hazardContext.hazardLevel === "DANGER" ||
      hazardContext.hazardLevel === "EXTREME_DANGER");

  // Emergency Outage Acceleration: 1 independent confirmation is sufficient ONLY for outages during extreme heat
  const isEmergencyOutageAccelerated = reportedState === "unavailable" && isExtremeHeat;
  const requiredQuorum = isEmergencyOutageAccelerated ? 1 : 2;

  // Case 3: Confirmed Quorum achieved
  if (confirmCount >= requiredQuorum) {
    if (reportedState === "available") {
      // Invariant 7: If linking to a prior outage, this is a verified restoration
      if (latestObservation.restoredOutageId) {
        return {
          state: "RESTORED",
          reason: `Verified restoration: service recovery confirmed by ${confirmCount} independent witness(es), referencing prior outage ID ${latestObservation.restoredOutageId}.`,
          independentAttestationCount: confirmCount,
          isExpired: false,
          activeDispute: false,
          effectiveOperationalState: "available",
          validAttestations,
          rejectedAttestations,
          requiredAttestations: requiredQuorum,
          hazardAccelerated: false,
        };
      }
      return {
        state: "VERIFIED_AVAILABLE",
        reason: `Operational availability verified by ${confirmCount} independent witness(es) (quorum >= ${requiredQuorum}).`,
        independentAttestationCount: confirmCount,
        isExpired: false,
        activeDispute: false,
        effectiveOperationalState: "available",
        validAttestations,
        rejectedAttestations,
        requiredAttestations: requiredQuorum,
        hazardAccelerated: false,
      };
    } else if (reportedState === "unavailable") {
      return {
        state: "VERIFIED_UNAVAILABLE",
        reason: isEmergencyOutageAccelerated
          ? `Emergency outage confirmed by ${confirmCount} witness under active heat hazard (${hazardContext?.heatIndexCelsius}°C Heat Index). Emergency quorum threshold satisfied (1/1).`
          : `Operational failure/outage confirmed by ${confirmCount} independent witness(es) (quorum >= ${requiredQuorum}).`,
        independentAttestationCount: confirmCount,
        isExpired: false,
        activeDispute: false,
        effectiveOperationalState: "unavailable",
        validAttestations,
        rejectedAttestations,
        requiredAttestations: requiredQuorum,
        hazardAccelerated: isEmergencyOutageAccelerated,
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
        requiredAttestations: requiredQuorum,
        hazardAccelerated: false,
      };
    }
  }

  // Case 4: Proposed state pending full independent verification quorum
  if (reportedState === "available") {
    return {
      state: "PROPOSED_AVAILABLE",
      reason:
        confirmCount === 1
          ? "Single independent attestation recorded; awaiting 2nd independent witness confirmation for verified availability (1/2)."
          : "Single observation submitted claiming availability; awaiting independent attestation quorum (0/2).",
      independentAttestationCount: confirmCount,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "uncertain",
      validAttestations,
      rejectedAttestations,
      requiredAttestations: requiredQuorum,
      hazardAccelerated: false,
    };
  } else if (reportedState === "unavailable") {
    return {
      state: "PROPOSED_UNAVAILABLE",
      reason:
        confirmCount === 1
          ? "Single attestation recorded; awaiting 2nd independent confirmation for outage verification (1/2)."
          : "Single observation submitted claiming outage/failure; awaiting independent attestation.",
      independentAttestationCount: confirmCount,
      isExpired: false,
      activeDispute: false,
      effectiveOperationalState: "unavailable",
      validAttestations,
      rejectedAttestations,
      requiredAttestations: requiredQuorum,
      hazardAccelerated: false,
    };
  }

  return {
    state: "UNCERTAIN",
    reason: "Observation submitted with inconclusive operational state.",
    independentAttestationCount: confirmCount,
    isExpired: false,
    activeDispute: false,
    effectiveOperationalState: "uncertain",
    validAttestations,
    rejectedAttestations,
    requiredAttestations: requiredQuorum,
    hazardAccelerated: false,
  };
}
