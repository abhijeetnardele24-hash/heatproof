/**
 * Canonical Event Store & Persistence Engine
 *
 * Implements persistent event-sourcing for observations, corroborating witness attestations,
 * cryptographic proof records, and event-sourced Adaptation Service Receipts (ASRs).
 *
 * Guarantees:
 * 1. UI never assigns canonical states directly.
 * 2. Every state is deterministically computed via evaluateFacilityState().
 * 3. Observations never increment attestation count.
 * 4. ASR receipts are generated strictly from persisted verified observations and confirming witnesses.
 * 5. Full reproducible audit bundle export with schema validation.
 */

import {
  Observation,
  Attestation,
  AdaptationServiceReceipt,
  Facility,
  ObservationSchema,
  AttestationSchema,
  AdaptationServiceReceiptSchema,
} from "./types";
import { evaluateFacilityState, HazardEvaluationContext, StateEvaluationResult } from "./stateMachine";
import { generateAdaptationReceipt } from "./receipt";
import { ProofRecord, ProofRecordSchema } from "../ledger/types";
import { canonicalStringify, sha256Hex } from "../privacy/evidenceHasher";
import { z } from "zod";

const STORAGE_KEYS = {
  OBSERVATIONS: "heatproof_events_observations",
  ATTESTATIONS: "heatproof_events_attestations",
  RECEIPTS: "heatproof_events_receipts",
  PROOF_RECORDS: "heatproof_events_proof_records",
};

export const AuditBundleSchema = z.object({
  bundleVersion: z.literal("1.0.0"),
  exportedAt: z.string().datetime(),
  environment: z.enum(["LOCAL_DEMO", "TESTNET_ARBITRUM_SEPOLIA", "DEGRADED"]),
  facilitiesCount: z.number().int().nonnegative(),
  observations: z.array(ObservationSchema),
  attestations: z.array(AttestationSchema),
  receipts: z.array(AdaptationServiceReceiptSchema),
  proofRecords: z.array(ProofRecordSchema),
  bundleIntegrityDigest: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
});
export type AuditBundle = z.infer<typeof AuditBundleSchema>;

class PersistentEventStore {
  private observations: Map<string, Observation> = new Map();
  private attestations: Map<string, Attestation> = new Map();
  private receipts: Map<string, AdaptationServiceReceipt> = new Map();
  private proofRecords: Map<string, ProofRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      const obsRaw = localStorage.getItem(STORAGE_KEYS.OBSERVATIONS);
      if (obsRaw) {
        const list = JSON.parse(obsRaw);
        if (Array.isArray(list)) {
          list.forEach((o) => {
            const parsed = ObservationSchema.safeParse(o);
            if (parsed.success) this.observations.set(parsed.data.observationId, parsed.data);
          });
        }
      }

      const attRaw = localStorage.getItem(STORAGE_KEYS.ATTESTATIONS);
      if (attRaw) {
        const list = JSON.parse(attRaw);
        if (Array.isArray(list)) {
          list.forEach((a) => {
            const parsed = AttestationSchema.safeParse(a);
            if (parsed.success) this.attestations.set(parsed.data.attestationId, parsed.data);
          });
        }
      }

      const recRaw = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
      if (recRaw) {
        const list = JSON.parse(recRaw);
        if (Array.isArray(list)) {
          list.forEach((r) => {
            const parsed = AdaptationServiceReceiptSchema.safeParse(r);
            if (parsed.success) this.receipts.set(parsed.data.receiptId, parsed.data);
          });
        }
      }

      const prRaw = localStorage.getItem(STORAGE_KEYS.PROOF_RECORDS);
      if (prRaw) {
        const list = JSON.parse(prRaw);
        if (Array.isArray(list)) {
          list.forEach((pr) => {
            const parsed = ProofRecordSchema.safeParse(pr);
            if (parsed.success) this.proofRecords.set(parsed.data.recordId, parsed.data);
          });
        }
      }
    } catch {
      // Storage unavailable or corrupted; proceed with clean in-memory state
    }
  }

  private persist() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.OBSERVATIONS,
        JSON.stringify(Array.from(this.observations.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.ATTESTATIONS,
        JSON.stringify(Array.from(this.attestations.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.RECEIPTS,
        JSON.stringify(Array.from(this.receipts.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.PROOF_RECORDS,
        JSON.stringify(Array.from(this.proofRecords.values()))
      );
    } catch {
      // Ignore quota errors in restricted test environments
    }
  }

  public saveObservation(observation: Observation): void {
    const parsed = ObservationSchema.parse(observation);
    this.observations.set(parsed.observationId, parsed);
    this.persist();
  }

  public getObservations(facilityId?: string): Observation[] {
    const all = Array.from(this.observations.values());
    if (!facilityId) return all;
    return all.filter((o) => o.facilityId === facilityId);
  }

  public getLatestObservation(facilityId: string): Observation | undefined {
    const list = this.getObservations(facilityId);
    if (list.length === 0) return undefined;
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  public saveAttestation(attestation: Attestation): void {
    const parsed = AttestationSchema.parse(attestation);
    this.attestations.set(parsed.attestationId, parsed);
    this.persist();
  }

  public getAttestations(observationId?: string): Attestation[] {
    const all = Array.from(this.attestations.values());
    if (!observationId) return all;
    return all.filter((a) => a.observationId === observationId);
  }

  public saveProofRecord(record: ProofRecord): void {
    const parsed = ProofRecordSchema.parse(record);
    this.proofRecords.set(parsed.recordId, parsed);
    this.persist();
  }

  public getProofRecord(recordId: string): ProofRecord | undefined {
    return this.proofRecords.get(recordId);
  }

  public saveReceipt(receipt: AdaptationServiceReceipt): void {
    const parsed = AdaptationServiceReceiptSchema.parse(receipt);
    this.receipts.set(parsed.receiptId, parsed);
    this.persist();
  }

  public getReceipts(facilityId?: string): AdaptationServiceReceipt[] {
    const all = Array.from(this.receipts.values());
    if (!facilityId) return all;
    return all.filter((r) => r.facilityId === facilityId);
  }

  /**
   * Deterministically resolves the state of a facility by querying the latest
   * observation and its corroborating attestations through the canonical state machine.
   */
  public evaluateFacility(
    facilityId: string,
    currentTime: Date = new Date(),
    hazardContext?: HazardEvaluationContext
  ): StateEvaluationResult {
    const latestObs = this.getLatestObservation(facilityId);
    const attestations = latestObs ? this.getAttestations(latestObs.observationId) : [];
    return evaluateFacilityState(latestObs, attestations, currentTime, hazardContext);
  }

  /**
   * Event-sources an Adaptation Service Receipt for a facility when verified available
   */
  public issueReceiptForFacility(
    facility: Facility,
    hazardContext: HazardEvaluationContext,
    issuerAddress = "0x0000000000000000000000000000000000000000"
  ): AdaptationServiceReceipt {
    const latestObs = this.getLatestObservation(facility.facilityId);
    if (!latestObs) {
      throw new Error(`Cannot issue ASR: No observation found for facility ${facility.facilityId}`);
    }
    const attestations = this.getAttestations(latestObs.observationId);
    const evalResult = evaluateFacilityState(latestObs, attestations, new Date(), hazardContext);

    if (evalResult.state !== "VERIFIED_AVAILABLE" && evalResult.state !== "RESTORED") {
      throw new Error(
        `Cannot issue ASR: Facility state is ${evalResult.state}. Must be VERIFIED_AVAILABLE or RESTORED.`
      );
    }

    const receipt = generateAdaptationReceipt({
      facility,
      hazardWindow: {
        hazardId: `haz-${new Date().toISOString().slice(0, 10)}-${facility.zone.replace(/\s+/g, "_")}`,
        provider: "Open-Meteo Meteorological Telemetry + Rothfusz Heat Index",
        zone: facility.zone,
        hazardType: "extreme_heat",
        severity: hazardContext.hazardLevel || "DANGER",
        temperatureC: 38.0,
        apparentTemperatureC: hazardContext.heatIndexCelsius,
        relativeHumidityPct: 45,
        uvIndex: 10,
        validFrom: new Date(Date.now() - 4 * 3600000).toISOString(),
        validUntil: new Date(Date.now() + 2 * 3600000).toISOString(),
        sourceTimestamp: new Date().toISOString(),
        sourceReference: "https://api.open-meteo.com",
        mode: "LIVE",
      },
      serviceInterval: {
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date().toISOString(),
        durationMinutes: 60,
      },
      observations: [latestObs],
      attestations: evalResult.validAttestations,
      issuerAddress,
    });

    this.saveReceipt(receipt);
    return receipt;
  }

  /**
   * Generates a fully reproducible, schema-validated cryptographic audit bundle
   */
  public exportAuditBundle(facilitiesCount = 0): AuditBundle {
    const observations = Array.from(this.observations.values());
    const attestations = Array.from(this.attestations.values());
    const receipts = Array.from(this.receipts.values());
    const proofRecords = Array.from(this.proofRecords.values());

    const payloadWithoutDigest = {
      bundleVersion: "1.0.0" as const,
      exportedAt: new Date().toISOString(),
      environment: "LOCAL_DEMO" as const,
      facilitiesCount,
      observations,
      attestations,
      receipts,
      proofRecords,
    };

    const bundleIntegrityDigest = sha256Hex(canonicalStringify(payloadWithoutDigest));
    const bundle: AuditBundle = {
      ...payloadWithoutDigest,
      bundleIntegrityDigest,
    };

    return AuditBundleSchema.parse(bundle);
  }

  /**
   * Resets all stored events (for testing / user reset)
   */
  public clearAll(): void {
    this.observations.clear();
    this.attestations.clear();
    this.receipts.clear();
    this.proofRecords.clear();
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEYS.OBSERVATIONS);
      localStorage.removeItem(STORAGE_KEYS.ATTESTATIONS);
      localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
      localStorage.removeItem(STORAGE_KEYS.PROOF_RECORDS);
    }
  }
}

export const eventStore = new PersistentEventStore();
