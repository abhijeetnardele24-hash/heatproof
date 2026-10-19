import { z } from "zod";

/* =========================================================================
   1. Resource and Operational Enums
   ========================================================================= */

export const ResourceTypeSchema = z.enum([
  "drinking_water",
  "shaded_rest",
  "cooling_centre",
  "first_aid",
  "hydration_point",
]);
export type ResourceType = z.infer<typeof ResourceTypeSchema>;

export const OperationalStateSchema = z.enum([
  "available",
  "unavailable",
  "uncertain",
]);
export type OperationalState = z.infer<typeof OperationalStateSchema>;

export const AccessibilityStateSchema = z.enum([
  "clear",
  "obstructed",
  "uncertain",
]);
export type AccessibilityState = z.infer<typeof AccessibilityStateSchema>;

export const QueueBandSchema = z.enum([
  "none",
  "low",
  "medium",
  "high",
  "unknown",
]);
export type QueueBand = z.infer<typeof QueueBandSchema>;

export const CanonicalStateSchema = z.enum([
  "UNVERIFIED",
  "PROPOSED_AVAILABLE",
  "PROPOSED_UNAVAILABLE",
  "VERIFIED_AVAILABLE",
  "VERIFIED_UNAVAILABLE",
  "DISPUTED",
  "UNCERTAIN",
  "EXPIRED",
  "RESTORED",
]);
export type CanonicalState = z.infer<typeof CanonicalStateSchema>;

export const AttestationVerdictSchema = z.enum([
  "CONFIRM",
  "CHALLENGE",
  "UNCERTAIN",
]);
export type AttestationVerdict = z.infer<typeof AttestationVerdictSchema>;

export const DisputeStatusSchema = z.enum([
  "none",
  "active_dispute",
  "resolved",
]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

export const HazardLevelSchema = z.enum([
  "NORMAL",
  "CAUTION",
  "EXTREME_CAUTION",
  "DANGER",
  "EXTREME_DANGER",
]);
export type HazardLevel = z.infer<typeof HazardLevelSchema>;

export const DataModeSchema = z.enum(["LIVE", "DEMO", "CACHED", "DEGRADED", "SYNTHETIC"]);
export type DataMode = z.infer<typeof DataModeSchema>;

/* =========================================================================
   2. AI Evidence Proposal Schema (Structured Output)
   ========================================================================= */

export const AiEvidenceProposalSchema = z.object({
  resource_visible: z.boolean(),
  operational_state: OperationalStateSchema,
  accessibility_state: AccessibilityStateSchema,
  queue_band: QueueBandSchema,
  evidence_observations: z.array(z.string().min(1)).max(10),
  uncertainties: z.array(z.string().min(1)).max(10),
  confidence: z.number().min(0.0).max(1.0),
  model_name: z.string().min(1),
  model_version: z.string().min(1),
  prompt_version: z.string().min(1),
  evaluated_at: z.string().datetime().optional(),
});
export type AiEvidenceProposal = z.infer<typeof AiEvidenceProposalSchema>;

/* =========================================================================
   3. Facility Domain Schema
   ========================================================================= */

export const FacilityAccessibilitySchema = z.object({
  wheelchair: z.boolean(),
  stepFree: z.boolean(),
  covered: z.boolean(),
  seating: z.boolean(),
  power: z.boolean(),
});
export type FacilityAccessibility = z.infer<typeof FacilityAccessibilitySchema>;

export const FacilitySchema = z.object({
  facilityId: z.string().min(1),
  name: z.string().min(1),
  resourceType: ResourceTypeSchema,
  zone: z.string().min(1),
  geohash: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  landmark: z.string().min(1),
  accessibility: FacilityAccessibilitySchema,
  expectedHours: z.string().min(1),
  sourceType: z.enum(["municipal_registry", "ngo_partner", "crowdsourced", "synthetic"]),
  sourceReference: z.string().min(1),
  currentComputedStatus: CanonicalStateSchema,
  lastVerificationTime: z.string().datetime(),
  expiryTime: z.string().datetime(),
  independentAttestationCount: z.number().int().min(0),
  disputeStatus: DisputeStatusSchema,
});
export type Facility = z.infer<typeof FacilitySchema>;

/* =========================================================================
   4. Observation Domain Schema
   ========================================================================= */

export const ObservationSchema = z.object({
  observationId: z.string().min(1),
  facilityId: z.string().min(1),
  proposedState: OperationalStateSchema,
  humanConfirmedState: OperationalStateSchema,
  accessibilityState: AccessibilityStateSchema,
  queueBand: QueueBandSchema,
  evidenceObservations: z.array(z.string()),
  evidenceDigest: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 32-byte hex digest"),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  reporter: z.string().min(1),
  mode: DataModeSchema,
  schemaVersion: z.literal("1.0.0"),
  restoredOutageId: z.string().optional(),
  aiProposal: AiEvidenceProposalSchema.optional(),
});
export type Observation = z.infer<typeof ObservationSchema>;

/* =========================================================================
   5. Attestation Domain Schema
   ========================================================================= */

export const AttestationSchema = z.object({
  attestationId: z.string().min(1),
  observationId: z.string().min(1),
  facilityId: z.string().min(1),
  verdict: AttestationVerdictSchema,
  evidenceDigest: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 32-byte hex digest"),
  attester: z.string().min(1),
  notes: z.string().max(280).optional(),
  createdAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
});
export type Attestation = z.infer<typeof AttestationSchema>;

/* =========================================================================
   6. Hazard Window Schema
   ========================================================================= */

export const HazardWindowSchema = z.object({
  hazardId: z.string().min(1),
  provider: z.string().min(1),
  zone: z.string().min(1),
  hazardType: z.enum(["extreme_heat", "high_humidity", "severe_heatwave"]),
  severity: HazardLevelSchema,
  temperatureC: z.number(),
  apparentTemperatureC: z.number(),
  relativeHumidityPct: z.number().min(0).max(100),
  uvIndex: z.number().min(0),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  sourceTimestamp: z.string().datetime(),
  sourceReference: z.string().url(),
  mode: DataModeSchema,
});
export type HazardWindow = z.infer<typeof HazardWindowSchema>;

/* =========================================================================
   7. Adaptation Service Receipt (ASR) Schema
   ========================================================================= */

export const ServiceIntervalSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  durationMinutes: z.number().positive(),
});
export type ServiceInterval = z.infer<typeof ServiceIntervalSchema>;

export const AdaptationServiceReceiptSchema = z.object({
  receiptId: z.string().min(1),
  version: z.literal("1.0.0"),
  facilityId: z.string().min(1),
  facilityName: z.string().min(1),
  resourceType: ResourceTypeSchema,
  zone: z.string().min(1),
  hazardWindow: HazardWindowSchema,
  serviceInterval: ServiceIntervalSchema,
  sourceObservationIds: z.array(z.string().min(1)).min(1),
  attestationIds: z.array(z.string().min(1)).min(1),
  evidenceMerkleRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 32-byte hex digest"),
  verificationStatus: z.literal("VERIFIED_SERVICE_DELIVERED"),
  methodologyVersion: z.literal("IEEE-CLIMATECHAIN-ADAPTATION-V1"),
  limitations: z.array(z.string()),
  issuedAt: z.string().datetime(),
  issuerAddress: z.string().min(1),
});
export type AdaptationServiceReceipt = z.infer<typeof AdaptationServiceReceiptSchema>;
