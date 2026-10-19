import { describe, it, expect, beforeEach, vi } from "vitest";
import { eventStore } from "../../src/domain/storage";
import { INITIAL_FACILITIES } from "../../src/domain/seedData";
import { Observation, Attestation } from "../../src/domain/types";
import { ProofRecord } from "../../src/ledger/types";
import { sha256Hex } from "../../src/privacy/evidenceHasher";

describe("PersistentEventStore (Storage)", () => {
  beforeEach(() => {
    localStorage.clear();
    eventStore.clearAll();
    vi.restoreAllMocks();
  });

  const mockFacility = INITIAL_FACILITIES[0];

  const sampleObs: Observation = {
    observationId: "obs-storage-01",
    facilityId: mockFacility.facilityId,
    proposedState: "available",
    humanConfirmedState: "available",
    accessibilityState: "clear",
    queueBand: "none",
    evidenceObservations: ["Operational drinking water fountain", "Clean tap"],
    evidenceDigest: sha256Hex("test:obs:evidence"),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    reporter: "0x1111111111111111111111111111111111111111",
    mode: "LIVE",
    schemaVersion: "1.0.0",
  };

  const sampleAtt1: Attestation = {
    attestationId: "att-storage-01",
    observationId: "obs-storage-01",
    facilityId: mockFacility.facilityId,
    verdict: "CONFIRM",
    evidenceDigest: sha256Hex("witness1:confirmed"),
    attester: "0x2222222222222222222222222222222222222222",
    createdAt: new Date().toISOString(),
    schemaVersion: "1.0.0",
  };

  const sampleAtt2: Attestation = {
    attestationId: "att-storage-02",
    observationId: "obs-storage-01",
    facilityId: mockFacility.facilityId,
    verdict: "CONFIRM",
    evidenceDigest: sha256Hex("witness2:confirmed"),
    attester: "0x3333333333333333333333333333333333333333",
    createdAt: new Date().toISOString(),
    schemaVersion: "1.0.0",
  };

  it("saves and retrieves observations by facilityId or all", () => {
    eventStore.saveObservation(sampleObs);
    expect(eventStore.getObservations()).toHaveLength(1);
    expect(eventStore.getObservations(mockFacility.facilityId)).toHaveLength(1);
    expect(eventStore.getObservations("non-existent")).toHaveLength(0);
    expect(eventStore.getLatestObservation(mockFacility.facilityId)?.observationId).toBe("obs-storage-01");
    expect(eventStore.getLatestObservation("non-existent")).toBeUndefined();
  });

  it("saves and retrieves attestations by observationId or all", () => {
    eventStore.saveObservation(sampleObs);
    eventStore.saveAttestation(sampleAtt1);
    expect(eventStore.getAttestations()).toHaveLength(1);
    expect(eventStore.getAttestations("obs-storage-01")).toHaveLength(1);
    expect(eventStore.getAttestations("non-existent")).toHaveLength(0);
  });

  it("saves and retrieves proof records", () => {
    const proof: ProofRecord = {
      recordId: "proof-storage-01",
      recordType: "OBSERVATION",
      facilityId: mockFacility.facilityId,
      recordDigest: sha256Hex("proof:digest"),
      mode: "LOCAL_DEMO",
      status: "LOCAL_RECORDED",
      isEvmTransaction: false,
      transactionHash: null,
      localProofHash: "c".repeat(64),
      sequenceNumber: 1,
      blockNumber: 1,
      timestamp: new Date().toISOString(),
      attesterOrReporter: "0x1111111111111111111111111111111111111111",
      network: "Local Secure Proof Log (SHA-256 Chain)",
      explorerUrl: null,
      explanation: "Testing proof storage",
    };

    eventStore.saveProofRecord(proof);
    expect(eventStore.getProofRecord("proof-storage-01")?.recordId).toBe("proof-storage-01");
    expect(eventStore.getProofRecord("non-existent")).toBeUndefined();
  });

  it("evaluates facility state using canonical state machine", () => {
    eventStore.saveObservation(sampleObs);
    eventStore.saveAttestation(sampleAtt1);
    eventStore.saveAttestation(sampleAtt2);

    const evalResult = eventStore.evaluateFacility(mockFacility.facilityId, new Date(), {
      hazardLevel: "DANGER",
      heatIndexCelsius: 42,
    });

    expect(evalResult.state).toBe("VERIFIED_AVAILABLE");
  });

  it("evaluates facility state when no observation exists", () => {
    const evalResult = eventStore.evaluateFacility("unobserved-facility", new Date());
    expect(evalResult.state).toBe("UNVERIFIED");
  });

  it("issues ASR receipt for verified available facility and saves receipt", () => {
    eventStore.saveObservation(sampleObs);
    eventStore.saveAttestation(sampleAtt1);
    eventStore.saveAttestation(sampleAtt2);

    const receipt = eventStore.issueReceiptForFacility(
      mockFacility,
      { hazardLevel: "DANGER", heatIndexCelsius: 43 },
      "0x1111111111111111111111111111111111111111"
    );

    expect(receipt.facilityId).toBe(mockFacility.facilityId);
    expect(eventStore.getReceipts()).toHaveLength(1);
    expect(eventStore.getReceipts(mockFacility.facilityId)).toHaveLength(1);
    expect(eventStore.getReceipts("other-facility")).toHaveLength(0);
  });

  it("throws error when issuing ASR for facility without observations", () => {
    expect(() =>
      eventStore.issueReceiptForFacility(mockFacility, { hazardLevel: "DANGER", heatIndexCelsius: 43 })
    ).toThrow(/No observation found for facility/);
  });

  it("throws error when issuing ASR for facility that is not available or restored", () => {
    const unavailableObs: Observation = {
      ...sampleObs,
      observationId: "obs-unavail",
      proposedState: "unavailable",
      humanConfirmedState: "unavailable",
      accessibilityState: "obstructed",
      evidenceObservations: ["Dry tap", "Gate locked"],
      evidenceDigest: sha256Hex("unavailable:evidence"),
    };
    eventStore.saveObservation(unavailableObs);

    expect(() =>
      eventStore.issueReceiptForFacility(mockFacility, { hazardLevel: "DANGER", heatIndexCelsius: 43 })
    ).toThrow(/Cannot issue ASR: Facility state is PROPOSED_UNAVAILABLE/);
  });

  it("exports a valid cryptographic audit bundle with integrity digest", () => {
    eventStore.saveObservation(sampleObs);
    eventStore.saveAttestation(sampleAtt1);

    const bundle = eventStore.exportAuditBundle(1);
    expect(bundle.bundleVersion).toBe("1.0.0");
    expect(bundle.environment).toBe("LOCAL_DEMO");
    expect(bundle.facilitiesCount).toBe(1);
    expect(bundle.observations).toHaveLength(1);
    expect(bundle.attestations).toHaveLength(1);
    expect(bundle.bundleIntegrityDigest).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it("handles storage quota errors gracefully without crashing", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => eventStore.saveObservation(sampleObs)).not.toThrow();
    setItemSpy.mockRestore();
  });
});
