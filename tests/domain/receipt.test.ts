import { describe, it, expect } from "vitest";
import {
  generateAdaptationReceipt,
  validateAdaptationReceipt,
  computeReceiptMerkleRoot,
} from "../../src/domain/receipt";
import { Facility, HazardWindow, Observation, Attestation } from "../../src/domain/types";

describe("Adaptation Service Receipt Engine", () => {
  const mockFacility: Facility = {
    facilityId: "fac-cst-01",
    name: "CST Terminus High-Volume Hydration Hub",
    resourceType: "hydration_point",
    zone: "Zone 1 - CST Transit Hub",
    geohash: "te7uk2",
    lat: 18.9401,
    lng: 72.8354,
    landmark: "CST Station Gate 2",
    accessibility: {
      wheelchair: true,
      stepFree: true,
      covered: true,
      seating: true,
      power: false,
    },
    expectedHours: "06:00 - 23:00",
    sourceType: "municipal_registry",
    sourceReference: "MUMBAI-RELIEF-2026",
    currentComputedStatus: "VERIFIED_AVAILABLE",
    lastVerificationTime: "2026-10-19T11:00:00Z",
    expiryTime: "2026-10-19T17:00:00Z",
    independentAttestationCount: 2,
    disputeStatus: "none",
  };

  const mockHazardWindow: HazardWindow = {
    hazardId: "haz-20261019-1100-cst",
    provider: "Open-Meteo-NOAA",
    zone: "Zone 1 - CST Transit Hub",
    hazardType: "extreme_heat",
    severity: "DANGER",
    temperatureC: 38.2,
    apparentTemperatureC: 44.5,
    relativeHumidityPct: 52,
    uvIndex: 10.2,
    validFrom: "2026-10-19T10:00:00Z",
    validUntil: "2026-10-19T14:00:00Z",
    sourceTimestamp: "2026-10-19T10:00:00Z",
    sourceReference: "https://api.open-meteo.com/v1/forecast?latitude=18.9401&longitude=72.8354",
    mode: "LIVE",
  };

  const mockObservation: Observation = {
    observationId: "obs-001",
    facilityId: "fac-cst-01",
    proposedState: "available",
    humanConfirmedState: "available",
    accessibilityState: "clear",
    queueBand: "low",
    evidenceObservations: ["water flowing", "clean"],
    evidenceDigest: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    createdAt: "2026-10-19T11:05:00Z",
    expiresAt: "2026-10-19T17:05:00Z",
    reporter: "0x1111111111111111111111111111111111111111",
    mode: "LIVE",
    schemaVersion: "1.0.0",
  };

  const mockAttestation: Attestation = {
    attestationId: "att-001",
    observationId: "obs-001",
    facilityId: "fac-cst-01",
    verdict: "CONFIRM",
    evidenceDigest: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    attester: "0x2222222222222222222222222222222222222222",
    createdAt: "2026-10-19T11:15:00Z",
    schemaVersion: "1.0.0",
  };

  it("computes a deterministic Merkle aggregate root independent of input ordering", () => {
    const root1 = computeReceiptMerkleRoot(
      "fac-01",
      "Zone 1",
      "haz-01",
      ["0x2222", "0x1111"],
      ["0xbbbb", "0xaaaa"]
    );
    const root2 = computeReceiptMerkleRoot(
      "fac-01",
      "Zone 1",
      "haz-01",
      ["0x1111", "0x2222"],
      ["0xaaaa", "0xbbbb"]
    );
    expect(root1).toBe(root2);
    expect(root1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("generates a valid Adaptation Service Receipt with correct metadata", () => {
    const receipt = generateAdaptationReceipt({
      facility: mockFacility,
      hazardWindow: mockHazardWindow,
      serviceInterval: {
        start: "2026-10-19T10:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 240,
      },
      observations: [mockObservation],
      attestations: [mockAttestation],
      issuerAddress: "0x3333333333333333333333333333333333333333",
    });

    expect(receipt.receiptId).toContain("asr_fac-cst-01");
    expect(receipt.verificationStatus).toBe("VERIFIED_SERVICE_DELIVERED");
    expect(receipt.evidenceMerkleRoot).toMatch(/^0x[0-9a-f]{64}$/);
    expect(receipt.limitations.length).toBeGreaterThan(0);

    const validation = validateAdaptationReceipt(receipt, [mockObservation], [mockAttestation]);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("rejects receipt generation if an observation is not in available state", () => {
    const unverifiedObs: Observation = {
      ...mockObservation,
      humanConfirmedState: "unavailable",
    };

    expect(() =>
      generateAdaptationReceipt({
        facility: mockFacility,
        hazardWindow: mockHazardWindow,
        serviceInterval: {
          start: "2026-10-19T10:00:00Z",
          end: "2026-10-19T14:00:00Z",
          durationMinutes: 240,
        },
        observations: [unverifiedObs],
        attestations: [mockAttestation],
        issuerAddress: "0x3333333333333333333333333333333333333333",
      })
    ).toThrow(/is not available/);
  });

  it("rejects receipt validation if evidence root has been tampered with", () => {
    const receipt = generateAdaptationReceipt({
      facility: mockFacility,
      hazardWindow: mockHazardWindow,
      serviceInterval: {
        start: "2026-10-19T10:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 240,
      },
      observations: [mockObservation],
      attestations: [mockAttestation],
      issuerAddress: "0x3333333333333333333333333333333333333333",
    });

    // Tamper with root
    const tamperedReceipt = {
      ...receipt,
      evidenceMerkleRoot: "0x9999999999999999999999999999999999999999999999999999999999999999" as `0x${string}`,
    };

    const validation = validateAdaptationReceipt(tamperedReceipt, [mockObservation], [mockAttestation]);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Cryptographic digest mismatch"))).toBe(true);
  });

  it("rejects validation when hazard severity is below relief activation threshold", () => {
    const receipt = generateAdaptationReceipt({
      facility: mockFacility,
      hazardWindow: mockHazardWindow,
      serviceInterval: {
        start: "2026-10-19T10:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 240,
      },
      observations: [mockObservation],
      attestations: [mockAttestation],
      issuerAddress: "0x3333333333333333333333333333333333333333",
    });

    const benignReceipt: typeof receipt = {
      ...receipt,
      hazardWindow: {
        ...mockHazardWindow,
        severity: "NORMAL",
      },
    };

    const validation = validateAdaptationReceipt(benignReceipt);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes("does not warrant emergency adaptation relief credit"))).toBe(true);
  });

  it("throws during generation if observations or attestations are empty", () => {
    expect(() =>
      generateAdaptationReceipt({
        facility: mockFacility,
        hazardWindow: mockHazardWindow,
        serviceInterval: {
          start: "2026-10-19T10:00:00Z",
          end: "2026-10-19T14:00:00Z",
          durationMinutes: 240,
        },
        observations: [],
        attestations: [mockAttestation],
        issuerAddress: "0x3333333333333333333333333333333333333333",
      })
    ).toThrow(/requires at least one verified source observation/);

    expect(() =>
      generateAdaptationReceipt({
        facility: mockFacility,
        hazardWindow: mockHazardWindow,
        serviceInterval: {
          start: "2026-10-19T10:00:00Z",
          end: "2026-10-19T14:00:00Z",
          durationMinutes: 240,
        },
        observations: [mockObservation],
        attestations: [],
        issuerAddress: "0x3333333333333333333333333333333333333333",
      })
    ).toThrow(/requires at least one corroborating attestation/);
  });

  it("throws during generation if facilityId mismatches or no confirming attestations", () => {
    const wrongFacilityObs: Observation = {
      ...mockObservation,
      facilityId: "wrong-facility",
    };

    expect(() =>
      generateAdaptationReceipt({
        facility: mockFacility,
        hazardWindow: mockHazardWindow,
        serviceInterval: {
          start: "2026-10-19T10:00:00Z",
          end: "2026-10-19T14:00:00Z",
          durationMinutes: 240,
        },
        observations: [wrongFacilityObs],
        attestations: [mockAttestation],
        issuerAddress: "0x3333333333333333333333333333333333333333",
      })
    ).toThrow(/facilityId mismatch/);

    const disputeAttestation: Attestation = {
      ...mockAttestation,
      verdict: "CHALLENGE",
    };

    expect(() =>
      generateAdaptationReceipt({
        facility: mockFacility,
        hazardWindow: mockHazardWindow,
        serviceInterval: {
          start: "2026-10-19T10:00:00Z",
          end: "2026-10-19T14:00:00Z",
          durationMinutes: 240,
        },
        observations: [mockObservation],
        attestations: [disputeAttestation],
        issuerAddress: "0x3333333333333333333333333333333333333333",
      })
    ).toThrow(/no confirming attestations found/);
  });

  it("validates receipt failure when serviceInterval end is before start or missing source items", () => {
    const receipt = generateAdaptationReceipt({
      facility: mockFacility,
      hazardWindow: mockHazardWindow,
      serviceInterval: {
        start: "2026-10-19T10:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 240,
      },
      observations: [mockObservation],
      attestations: [mockAttestation],
      issuerAddress: "0x3333333333333333333333333333333333333333",
    });

    const invalidTimingReceipt = {
      ...receipt,
      serviceInterval: {
        start: "2026-10-19T15:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 60,
      },
    };
    const timingValidation = validateAdaptationReceipt(invalidTimingReceipt);
    expect(timingValidation.valid).toBe(false);
    expect(timingValidation.errors.some((e) => e.includes("must be after start"))).toBe(true);

    // Missing observations in verification set
    const missingValidation = validateAdaptationReceipt(receipt, [], [mockAttestation]);
    expect(missingValidation.valid).toBe(false);
    expect(missingValidation.errors.some((e) => e.includes("Missing source observations"))).toBe(true);
  });
});
