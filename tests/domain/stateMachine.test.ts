import { describe, it, expect } from "vitest";
import { evaluateFacilityState } from "../../src/domain/stateMachine";
import { Observation, Attestation } from "../../src/domain/types";

describe("Deterministic Attestation State Machine", () => {
  const baseTime = new Date("2026-10-19T12:00:00.000Z");
  const validExpiry = new Date("2026-10-19T14:00:00.000Z").toISOString();
  const pastExpiry = new Date("2026-10-19T11:00:00.000Z").toISOString();

  const mockObservation = (
    overrides?: Partial<Observation>
  ): Observation => ({
    observationId: "obs_water_1",
    facilityId: "fac_water_pune_1",
    proposedState: "available",
    humanConfirmedState: "available",
    accessibilityState: "clear",
    queueBand: "none",
    evidenceObservations: ["Clear flow rate", "clean basin"],
    evidenceDigest: "0x1111111111111111111111111111111111111111111111111111111111111111",
    createdAt: "2026-10-19T11:30:00.000Z",
    expiresAt: validExpiry,
    reporter: "0x1111111111111111111111111111111111111111",
    mode: "LIVE",
    schemaVersion: "1.0.0",
    ...overrides,
  });

  const mockAttestation = (
    overrides?: Partial<Attestation>
  ): Attestation => ({
    attestationId: "att_1",
    observationId: "obs_water_1",
    facilityId: "fac_water_pune_1",
    verdict: "CONFIRM",
    evidenceDigest: "0x2222222222222222222222222222222222222222222222222222222222222222",
    attester: "0x2222222222222222222222222222222222222222",
    createdAt: "2026-10-19T11:45:00.000Z",
    schemaVersion: "1.0.0",
    ...overrides,
  });

  it("1. returns UNVERIFIED when no observation exists", () => {
    const res = evaluateFacilityState(null, [], baseTime);
    expect(res.state).toBe("UNVERIFIED");
    expect(res.independentAttestationCount).toBe(0);
    expect(res.isExpired).toBe(false);
  });

  it("2. returns EXPIRED when current time exceeds observation expiry", () => {
    const obs = mockObservation({ expiresAt: pastExpiry });
    const res = evaluateFacilityState(obs, [], baseTime);
    expect(res.state).toBe("EXPIRED");
    expect(res.isExpired).toBe(true);
  });

  it("3. transitions to PROPOSED_AVAILABLE when a single available observation has no attestations", () => {
    const obs = mockObservation({ humanConfirmedState: "available" });
    const res = evaluateFacilityState(obs, [], baseTime);
    expect(res.state).toBe("PROPOSED_AVAILABLE");
    expect(res.independentAttestationCount).toBe(0);
    expect(res.activeDispute).toBe(false);
  });

  it("4. transitions to PROPOSED_UNAVAILABLE when a single unavailable observation has no attestations", () => {
    const obs = mockObservation({ humanConfirmedState: "unavailable" });
    const res = evaluateFacilityState(obs, [], baseTime);
    expect(res.state).toBe("PROPOSED_UNAVAILABLE");
    expect(res.independentAttestationCount).toBe(0);
    expect(res.effectiveOperationalState).toBe("unavailable");
  });

  it("5. strictly rejects self-attestation (reporter == attester)", () => {
    const obs = mockObservation({
      reporter: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      humanConfirmedState: "available",
    });
    const selfAttestation = mockAttestation({
      attester: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      verdict: "CONFIRM",
    });

    const res = evaluateFacilityState(obs, [selfAttestation], baseTime);
    expect(res.state).toBe("PROPOSED_AVAILABLE"); // Stays proposed, self-attestation rejected!
    expect(res.independentAttestationCount).toBe(0);
    expect(res.validAttestations.length).toBe(0);
    expect(res.rejectedAttestations.length).toBe(1);
    expect(res.rejectedAttestations[0].reason).toContain("Self-attestation rejected");
  });

  it("6. strictly deduplicates multiple attestations from the same address (Sybil protection)", () => {
    const obs = mockObservation({ reporter: "0x1111111111111111111111111111111111111111" });
    const att1 = mockAttestation({
      attestationId: "att_1",
      attester: "0x2222222222222222222222222222222222222222",
      verdict: "CONFIRM",
    });
    const att2 = mockAttestation({
      attestationId: "att_2",
      attester: "0x2222222222222222222222222222222222222222", // same attester!
      verdict: "CONFIRM",
    });

    const res = evaluateFacilityState(obs, [att1, att2], baseTime);
    expect(res.state).toBe("VERIFIED_AVAILABLE");
    expect(res.independentAttestationCount).toBe(1); // Not 2!
    expect(res.validAttestations.length).toBe(1);
    expect(res.rejectedAttestations.length).toBe(1);
    expect(res.rejectedAttestations[0].reason).toContain("Duplicate attestation rejected");
  });

  it("7. transitions to VERIFIED_AVAILABLE upon independent confirmation", () => {
    const obs = mockObservation({ humanConfirmedState: "available" });
    const att = mockAttestation({ verdict: "CONFIRM" });

    const res = evaluateFacilityState(obs, [att], baseTime);
    expect(res.state).toBe("VERIFIED_AVAILABLE");
    expect(res.independentAttestationCount).toBe(1);
    expect(res.effectiveOperationalState).toBe("available");
  });

  it("8. transitions to VERIFIED_UNAVAILABLE upon independent confirmation of outage", () => {
    const obs = mockObservation({ humanConfirmedState: "unavailable" });
    const att = mockAttestation({ verdict: "CONFIRM" });

    const res = evaluateFacilityState(obs, [att], baseTime);
    expect(res.state).toBe("VERIFIED_UNAVAILABLE");
    expect(res.independentAttestationCount).toBe(1);
    expect(res.effectiveOperationalState).toBe("unavailable");
  });

  it("9. transitions to DISPUTED immediately when challenged by an independent witness", () => {
    const obs = mockObservation({ humanConfirmedState: "available" });
    const attChallenge = mockAttestation({ verdict: "CHALLENGE" });

    const res = evaluateFacilityState(obs, [attChallenge], baseTime);
    expect(res.state).toBe("DISPUTED");
    expect(res.activeDispute).toBe(true);
    expect(res.effectiveOperationalState).toBe("uncertain");
  });

  it("10. transitions to RESTORED when an available observation references a prior outage ID", () => {
    const obs = mockObservation({
      humanConfirmedState: "available",
      restoredOutageId: "obs_outage_prior_99",
    });
    const att = mockAttestation({ verdict: "CONFIRM" });

    const res = evaluateFacilityState(obs, [att], baseTime);
    expect(res.state).toBe("RESTORED");
    expect(res.effectiveOperationalState).toBe("available");
    expect(res.reason).toContain("obs_outage_prior_99");
  });

  it("11. transitions to UNCERTAIN when reported state is uncertain or attestations are inconclusive", () => {
    const obs = mockObservation({ humanConfirmedState: "uncertain" });
    const res = evaluateFacilityState(obs, [], baseTime);
    expect(res.state).toBe("UNCERTAIN");
  });
});
