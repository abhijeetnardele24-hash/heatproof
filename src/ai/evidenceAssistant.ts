/**
 * Truthful AI & Expert System Provider
 *
 * Implements the "Deterministic Evidence Rules Assistant" (HeatProof-Rules-v1.0).
 *
 * TRUTHFULNESS NOTICE:
 * This provider evaluates structured observations, checklist selections, and sanitized image metadata
 * against deterministic civic heat-adaptation rules and regular expressions.
 * It does NOT claim to run an unverified black-box neural multimodal vision model in the browser.
 * It serves strictly as a decision-support proposal generator; human verifiers must explicitly confirm
 * every observation before canonical state changes or ledger anchoring occur.
 */

import {
  AiEvidenceProposal,
  AiEvidenceProposalSchema,
  ResourceType,
  OperationalState,
  AccessibilityState,
  QueueBand,
} from "../domain/types";

export interface EvidenceAnalysisInput {
  resourceType: ResourceType;
  imageFingerprint?: string;
  sanitizedDigest?: string;
  userObservations?: string[];
  cleanNotes?: string;
  coarseZone?: string;
  isFixture?: boolean;
}

export interface EvidenceAnalysisProvider {
  analyzeEvidence(input: EvidenceAnalysisInput): Promise<AiEvidenceProposal>;
}

export const AI_MODEL_METADATA = {
  provider_mode: "DETERMINISTIC_RULES" as const,
  model_name: "Deterministic Evidence Rules Assistant",
  model_version: "HeatProof-Rules-v1.0",
  prompt_version: "2026.10-rules-strict",
};

/**
 * Deterministic Evidence Rules Assistant
 * High-performance rule-based expert engine for field evidence appraisal.
 */
export class DeterministicEvidenceRulesAssistant implements EvidenceAnalysisProvider {
  private isDegraded: boolean;

  constructor(isDegraded: boolean = false) {
    this.isDegraded = isDegraded;
  }

  async analyzeEvidence(input: EvidenceAnalysisInput): Promise<AiEvidenceProposal> {
    const startTime = performance.now();

    if (this.isDegraded) {
      const proposal: AiEvidenceProposal = {
        providerMode: "DETERMINISTIC_RULES",
        modelName: AI_MODEL_METADATA.model_name,
        modelVersion: AI_MODEL_METADATA.model_version,
        inputType: input.sanitizedDigest ? "SANITIZED_IMAGE_METADATA_AND_OBSERVATIONS" : "STRUCTURED_OBSERVATIONS",
        result: "UNCERTAIN",
        confidence: 0.0,
        uncertainties: ["Rule engine offline or degraded; defaulting strictly to manual human observation entry."],
        latencyMs: Math.round(performance.now() - startTime),
        degradedReason: "Rule engine offline or degraded",
        isFixture: !!input.isFixture,
        resource_visible: false,
        operational_state: "uncertain",
        accessibility_state: "uncertain",
        queue_band: "unknown",
        evidence_observations: ["Rule analysis service offline or degraded."],
        model_name: AI_MODEL_METADATA.model_name,
        model_version: AI_MODEL_METADATA.model_version,
        prompt_version: AI_MODEL_METADATA.prompt_version,
      };
      return AiEvidenceProposalSchema.parse(proposal);
    }

    const notesLower = (input.cleanNotes || "").toLowerCase();
    const obsList = input.userObservations || [];

    // Adversarial Defense: detect prompt injection directives attempting to hijack evaluation
    const INJECTION_PATTERNS = [
      "ignore previous instructions",
      "system override",
      "mark as available",
      "bypass validation",
      "disregard guidelines",
      "admin mode",
    ];
    const isInjectionAttempt = INJECTION_PATTERNS.some((pattern) => notesLower.includes(pattern));

    if (isInjectionAttempt) {
      const proposal: AiEvidenceProposal = {
        providerMode: "DETERMINISTIC_RULES",
        modelName: AI_MODEL_METADATA.model_name,
        modelVersion: AI_MODEL_METADATA.model_version,
        inputType: input.sanitizedDigest ? "SANITIZED_IMAGE_METADATA_AND_OBSERVATIONS" : "STRUCTURED_OBSERVATIONS",
        result: "UNCERTAIN",
        confidence: 0.1,
        uncertainties: [
          "Input text attempted prompt injection / guideline override; automated classification abstained.",
        ],
        latencyMs: Math.round(performance.now() - startTime),
        degradedReason: "Adversarial prompt injection pattern detected",
        isFixture: !!input.isFixture,
        resource_visible: false,
        operational_state: "uncertain",
        accessibility_state: "uncertain",
        queue_band: "unknown",
        evidence_observations: ["Suspicious adversarial directive detected in evidence text note."],
        model_name: AI_MODEL_METADATA.model_name,
        model_version: AI_MODEL_METADATA.model_version,
        prompt_version: AI_MODEL_METADATA.prompt_version,
      };
      return AiEvidenceProposalSchema.parse(proposal);
    }

    // Indicator keyword sets for deterministic evaluation
    const availableIndicators = [
      "running water",
      "tap flowing",
      "cold water",
      "water dispensing",
      "functioning",
      "ac on",
      "cool interior",
      "fan operating",
      "shade covered",
      "clean basin",
    ];

    const unavailableIndicators = [
      "dry tap",
      "no water",
      "broken",
      "locked",
      "padlock",
      "closed gate",
      "out of order",
      "power cut",
      "shuttered",
      "empty tank",
      "damaged pipe",
      "leaking severely",
      "no shade",
      "collapsed",
      "no staff present",
    ];

    const obstructedIndicators = [
      "stairs only",
      "steep step",
      "debris blocking",
      "construction rubble",
      "narrow doorway",
      "crowded entrance blocked",
      "locked turnstile",
    ];

    const lowVisibilityIndicators = [
      "dark",
      "blurry",
      "glare",
      "blinding sun",
      "lens fog",
      "too far",
      "unclear",
      "night time",
    ];

    // Compute evidence matches
    const allText = `${notesLower} ${obsList.join(" ").toLowerCase()}`;
    const availMatches = availableIndicators.filter((i) => allText.includes(i));
    const unavailMatches = unavailableIndicators.filter((i) => allText.includes(i));
    const obstructMatches = obstructedIndicators.filter((i) => allText.includes(i));
    const lowVisMatches = lowVisibilityIndicators.filter((i) => allText.includes(i));

    const evidence_observations: string[] = [];
    const uncertainties: string[] = [];
    let operational_state: OperationalState = "uncertain";
    let accessibility_state: AccessibilityState = "clear";
    let queue_band: QueueBand = "none";
    let confidence = 0.5;
    let resource_visible = true;

    // Determine Queue
    if (allText.includes("long line") || allText.includes("crowded") || allText.includes("high queue")) {
      queue_band = "high";
    } else if (allText.includes("moderate queue") || allText.includes("several waiting")) {
      queue_band = "medium";
    } else if (allText.includes("1-2 people") || allText.includes("short wait")) {
      queue_band = "low";
    }

    // Check for inconclusive visibility or no equipment
    if (allText.includes("no cooler visible") || allText.includes("pavement only") || allText.includes("empty road")) {
      resource_visible = false;
      operational_state = "uncertain";
      uncertainties.push("No relief facility or equipment identifiable in visual field.");
      confidence = 0.2;
    } else if (lowVisMatches.length > 0) {
      uncertainties.push(`Sub-optimal visual conditions noted: ${lowVisMatches.join(", ")}.`);
      confidence = Math.max(0.3, confidence - 0.25);
    }

    // Determine Operational State
    if (resource_visible) {
      if (unavailMatches.length > 0 && availMatches.length === 0) {
        operational_state = "unavailable";
        evidence_observations.push(`Definite outage indicators detected: ${unavailMatches.join(", ")}.`);
        confidence = Math.min(0.95, 0.75 + unavailMatches.length * 0.1);
      } else if (availMatches.length > 0 && unavailMatches.length === 0) {
        operational_state = "available";
        evidence_observations.push(`Positive operational indicators detected: ${availMatches.join(", ")}.`);
        confidence = Math.min(0.95, 0.75 + availMatches.length * 0.1);
      } else if (availMatches.length > 0 && unavailMatches.length > 0) {
        operational_state = "uncertain";
        uncertainties.push("Conflicting operational indicators present simultaneously.");
        confidence = 0.4;
      } else {
        operational_state = "uncertain";
        uncertainties.push("Visual evidence lacks conclusive tap/cooling flow indicators.");
        confidence = 0.35;
      }
    }

    // Accessibility
    if (obstructMatches.length > 0) {
      accessibility_state = "obstructed";
      evidence_observations.push(`Physical accessibility barrier identified: ${obstructMatches.join(", ")}.`);
    }

    if (evidence_observations.length === 0) {
      evidence_observations.push(`Rule evaluation completed for ${input.resourceType.replace("_", " ")}.`);
    }

    const proposalResult =
      operational_state === "available"
        ? "AVAILABLE"
        : operational_state === "unavailable"
        ? "UNAVAILABLE"
        : "UNCERTAIN";

    const proposal: AiEvidenceProposal = {
      providerMode: input.isFixture ? "FIXTURE_EVALUATION" : "DETERMINISTIC_RULES",
      modelName: AI_MODEL_METADATA.model_name,
      modelVersion: AI_MODEL_METADATA.model_version,
      inputType: input.sanitizedDigest
        ? "SANITIZED_IMAGE_METADATA_AND_OBSERVATIONS"
        : input.isFixture
        ? "FIXTURE"
        : "STRUCTURED_OBSERVATIONS",
      result: proposalResult,
      confidence: Number(confidence.toFixed(2)),
      uncertainties,
      latencyMs: Math.round(performance.now() - startTime),
      isFixture: !!input.isFixture,
      resource_visible,
      operational_state,
      accessibility_state,
      queue_band,
      evidence_observations,
      model_name: AI_MODEL_METADATA.model_name,
      model_version: AI_MODEL_METADATA.model_version,
      prompt_version: AI_MODEL_METADATA.prompt_version,
    };

    return AiEvidenceProposalSchema.parse(proposal);
  }
}

/** Backward-compatible export alias */
export { DeterministicEvidenceRulesAssistant as ClientEvidenceAssistant };
