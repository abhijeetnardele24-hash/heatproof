/**
 * Generates an authentic sample Adaptation Service Receipt (ASR)
 * and writes it to docs/sample_receipt.json.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { generateAdaptationReceipt, validateAdaptationReceipt } from "../src/domain/receipt";
import { Facility, HazardWindow, Observation, Attestation } from "../src/domain/types";
import { sha256Hex } from "../src/privacy/evidenceHasher";

async function main() {
  const facility: Facility = {
    facilityId: "fac-pune-mandai-01",
    name: "Mandai Central Municipal Hydration & Misting Hub",
    resourceType: "hydration_point",
    zone: "Pune Central (Shivajinagar & Mandai)",
    geohash: "te7ue5",
    lat: 18.5144,
    lng: 73.8553,
    landmark: "Near Mahatma Phule Mandai Main Gate",
    accessibility: {
      wheelchair: true,
      stepFree: true,
      covered: true,
      seating: true,
      power: true,
    },
    expectedHours: "06:00 - 22:00",
    sourceType: "municipal_registry",
    sourceReference: "PMC-HEAT-ACTION-PLAN-2026/WARD-07",
    currentComputedStatus: "VERIFIED_AVAILABLE",
    lastVerificationTime: "2026-10-19T11:30:00Z",
    expiryTime: "2026-10-19T17:30:00Z",
    independentAttestationCount: 2,
    disputeStatus: "none",
  };

  const hazardWindow: HazardWindow = {
    hazardId: "haz-20261019-1100-pune",
    provider: "Open-Meteo Free Weather API (ECMWF IFS Model) + NOAA Rothfusz Heat Index",
    zone: "Pune Central (Shivajinagar & Mandai)",
    hazardType: "extreme_heat",
    severity: "DANGER",
    temperatureC: 38.6,
    apparentTemperatureC: 45.2,
    relativeHumidityPct: 48,
    uvIndex: 10.4,
    validFrom: "2026-10-19T10:00:00Z",
    validUntil: "2026-10-19T14:00:00Z",
    sourceTimestamp: "2026-10-19T10:30:00Z",
    sourceReference: "https://api.open-meteo.com/v1/forecast?latitude=18.5144&longitude=73.8553",
    mode: "LIVE",
  };

  const obsDigest = sha256Hex("mandai-obs-operational-clean-water-active-chilled");
  const attDigest1 = sha256Hex("mandai-att-witness-civic-corroboration-01");
  const attDigest2 = sha256Hex("mandai-att-witness-civic-corroboration-02");

  const observation: Observation = {
    observationId: "obs-pune-20261019-01",
    facilityId: facility.facilityId,
    proposedState: "available",
    humanConfirmedState: "available",
    accessibilityState: "clear",
    queueBand: "low",
    evidenceObservations: ["Clean chilled water flowing", "Misting fan functional"],
    evidenceDigest: obsDigest,
    createdAt: "2026-10-19T11:05:00Z",
    expiresAt: "2026-10-19T17:05:00Z",
    reporter: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    mode: "LIVE",
    schemaVersion: "1.0.0",
  };

  const attestations: Attestation[] = [
    {
      attestationId: "att-pune-01",
      observationId: observation.observationId,
      facilityId: facility.facilityId,
      verdict: "CONFIRM",
      evidenceDigest: attDigest1,
      attester: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      notes: "Confirmed operational. Clean drinking water flowing, shaded misting fan active.",
      createdAt: "2026-10-19T11:15:00Z",
      schemaVersion: "1.0.0",
    },
    {
      attestationId: "att-pune-02",
      observationId: observation.observationId,
      facilityId: facility.facilityId,
      verdict: "CONFIRM",
      evidenceDigest: attDigest2,
      attester: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      notes: "Second independent witness verification. High queue of 15 people under shade.",
      createdAt: "2026-10-19T11:22:00Z",
      schemaVersion: "1.0.0",
    },
  ];

  const receipt = generateAdaptationReceipt({
    facility,
    hazardWindow,
    serviceInterval: {
      start: "2026-10-19T10:00:00Z",
      end: "2026-10-19T14:00:00Z",
      durationMinutes: 240,
    },
    observations: [observation],
    attestations,
    issuerAddress: "0x1234567890123456789012345678901234567890",
  });

  const validation = validateAdaptationReceipt(receipt, [observation], attestations);
  if (!validation.valid) {
    throw new Error(`Generated receipt failed validation: ${validation.errors.join("; ")}`);
  }

  const outDir = path.resolve(process.cwd(), "docs");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "sample_receipt.json");
  fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2), "utf8");
  console.log(`Successfully generated and verified sample ASR at ${outPath}`);
  console.log(`Receipt ID: ${receipt.receiptId}`);
  console.log(`Aggregate Merkle Root: ${receipt.evidenceMerkleRoot}`);
}

main().catch((err) => {
  console.error("Failed to generate sample receipt:", err);
  process.exit(1);
});
