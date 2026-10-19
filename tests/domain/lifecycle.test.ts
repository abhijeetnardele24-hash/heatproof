import { describe, it, expect, beforeEach } from "vitest";
import { eventStore, AuditBundleSchema } from "../../src/domain/storage";
import { INITIAL_FACILITIES } from "../../src/domain/seedData";
import { Observation, Attestation } from "../../src/domain/types";
import { sha256Hex } from "../../src/privacy/evidenceHasher";
import { LocalDeterministicLedgerProvider } from "../../src/ledger/ledgerProvider";

describe("Complete End-to-End Proof Lifecycle", () => {
  beforeEach(() => {
    eventStore.clearAll();
  });

  it("executes the full lifecycle: report → proposed → attestations → verified → receipt → ledger → export", async () => {
    const facility = INITIAL_FACILITIES[0];
    const ledger = new LocalDeterministicLedgerProvider();

    // 1. Initial State: Unverified
    const initialEval = eventStore.evaluateFacility(facility.facilityId);
    expect(initialEval.state).toBe("UNVERIFIED");

    // 2. Step 1: Citizen Field Report
    const reporter = "0x1111111111111111111111111111111111111111";
    const obsDigest = sha256Hex("mandai:cooler:active_flow:clean");
    const observation: Observation = {
      observationId: "obs-mandai-001",
      facilityId: facility.facilityId,
      proposedState: "available",
      humanConfirmedState: "available",
      accessibilityState: "clear",
      queueBand: "none",
      evidenceObservations: ["Cold water running", "Canopy shaded"],
      evidenceDigest: obsDigest,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 6 * 3600000).toISOString(),
      reporter,
      mode: "LIVE",
      schemaVersion: "1.0.0",
    };

    eventStore.saveObservation(observation);
    const obsProof = await ledger.recordObservationDigest(
      observation.observationId,
      facility.facilityId,
      obsDigest,
      reporter
    );
    eventStore.saveProofRecord(obsProof);

    // 3. Verify state transition to PROPOSED_AVAILABLE (Quorum 0/2)
    const proposedEval = eventStore.evaluateFacility(facility.facilityId);
    expect(proposedEval.state).toBe("PROPOSED_AVAILABLE");
    expect(proposedEval.independentAttestationCount).toBe(0);

    // 4. Step 2: First independent witness confirmation
    const witness1 = "0x2222222222222222222222222222222222222222";
    const att1Digest = sha256Hex("witness1:confirmed");
    const attestation1: Attestation = {
      attestationId: "att-mandai-001",
      observationId: observation.observationId,
      facilityId: facility.facilityId,
      verdict: "CONFIRM",
      evidenceDigest: att1Digest,
      attester: witness1,
      createdAt: new Date().toISOString(),
      schemaVersion: "1.0.0",
    };
    eventStore.saveAttestation(attestation1);
    const att1Proof = await ledger.recordAttestationDigest(
      attestation1.attestationId,
      observation.observationId,
      facility.facilityId,
      att1Digest,
      witness1
    );
    eventStore.saveProofRecord(att1Proof);

    // Still PROPOSED_AVAILABLE because 2 independent confirmations are required (1/2)
    const afterAtt1Eval = eventStore.evaluateFacility(facility.facilityId);
    expect(afterAtt1Eval.state).toBe("PROPOSED_AVAILABLE");
    expect(afterAtt1Eval.independentAttestationCount).toBe(1);

    // 5. Attempt Self-Attestation by Reporter (Must be rejected!)
    const selfAttestation: Attestation = {
      attestationId: "att-mandai-self",
      observationId: observation.observationId,
      facilityId: facility.facilityId,
      verdict: "CONFIRM",
      evidenceDigest: sha256Hex("self"),
      attester: reporter, // Reporter trying to attest!
      createdAt: new Date().toISOString(),
      schemaVersion: "1.0.0",
    };
    eventStore.saveAttestation(selfAttestation);
    const selfEval = eventStore.evaluateFacility(facility.facilityId);
    expect(selfEval.independentAttestationCount).toBe(1); // Not incremented!
    expect(selfEval.rejectedAttestations.some((r) => r.reason.includes("Self-attestation rejected"))).toBe(true);

    // 6. Step 3: Second independent witness confirmation (Quorum 2/2 achieved!)
    const witness2 = "0x3333333333333333333333333333333333333333";
    const att2Digest = sha256Hex("witness2:confirmed");
    const attestation2: Attestation = {
      attestationId: "att-mandai-002",
      observationId: observation.observationId,
      facilityId: facility.facilityId,
      verdict: "CONFIRM",
      evidenceDigest: att2Digest,
      attester: witness2,
      createdAt: new Date().toISOString(),
      schemaVersion: "1.0.0",
    };
    eventStore.saveAttestation(attestation2);
    const att2Proof = await ledger.recordAttestationDigest(
      attestation2.attestationId,
      observation.observationId,
      facility.facilityId,
      att2Digest,
      witness2
    );
    eventStore.saveProofRecord(att2Proof);

    // State transitions to VERIFIED_AVAILABLE
    const verifiedEval = eventStore.evaluateFacility(facility.facilityId);
    expect(verifiedEval.state).toBe("VERIFIED_AVAILABLE");
    expect(verifiedEval.independentAttestationCount).toBe(2);
    expect(verifiedEval.effectiveOperationalState).toBe("available");

    // 7. Step 4: Generate Adaptation Service Receipt (ASR)
    const asr = eventStore.issueReceiptForFacility(facility, {
      heatIndexCelsius: 43.8,
      hazardLevel: "DANGER",
    });
    expect(asr.facilityId).toBe(facility.facilityId);
    expect(asr.verificationStatus).toBe("VERIFIED_SERVICE_DELIVERED");
    expect(asr.sourceObservationIds).toContain(observation.observationId);
    expect(asr.attestationIds).toHaveLength(2);

    // 8. Step 5: Anchor ASR to Proof Ledger
    const asrProof = await ledger.anchorServiceReceipt(
      asr.receiptId,
      asr.evidenceMerkleRoot as `0x${string}`,
      facility.facilityId,
      facility.zone
    );
    eventStore.saveProofRecord(asrProof);
    expect(asrProof.recordDigest).toBe(asr.evidenceMerkleRoot);

    // 9. Step 6: Export and Validate Audit Bundle
    const bundle = eventStore.exportAuditBundle(1);
    expect(bundle.bundleVersion).toBe("1.0.0");
    expect(bundle.observations).toHaveLength(1);
    expect(bundle.attestations).toHaveLength(3); // 2 valid + 1 rejected self
    expect(bundle.receipts).toHaveLength(1);
    expect(bundle.proofRecords).toHaveLength(4); // obs + att1 + att2 + asr
    expect(bundle.bundleIntegrityDigest).toMatch(/^0x[0-9a-f]{64}$/);

    // Schema validation succeeds
    const validated = AuditBundleSchema.safeParse(bundle);
    expect(validated.success).toBe(true);

    // Verify getter filters
    expect(eventStore.getObservations(facility.facilityId)).toHaveLength(1);
    expect(eventStore.getReceipts(facility.facilityId)).toHaveLength(1);
    expect(eventStore.getProofRecord(obsProof.recordId)).toBeDefined();

    // Verify error throws when attempting to issue receipt for unverified facility
    const unverifiedFacility = { ...facility, facilityId: "fac-unverified-99" };
    expect(() =>
      eventStore.issueReceiptForFacility(unverifiedFacility, { heatIndexCelsius: 40 })
    ).toThrow("No observation found");

    // Clear storage
    eventStore.clearAll();
    expect(eventStore.getObservations()).toHaveLength(0);
  });
});
