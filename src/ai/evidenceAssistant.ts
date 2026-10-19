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
  userObservations?: string[];
  cleanNotes?: string;
  coarseZone?: string;
}

export interface EvidenceAnalysisProvider {
  analyzeEvidence(input: EvidenceAnalysisInput): Promise<AiEvidenceProposal>;
}

export const AI_MODEL_METADATA = {
  model_name: "HeatProof-Multimodal-Assessor",
  model_version: "v1.2-edge",
  prompt_version: "2026.10-adaptation-strict",
};

/**
 * Heuristic multimodal parser implementing the prompt's rules:
 * - Detects visual equipment indicators and user checklist items
 * - Defends against prompt injection attempts in cleanNotes
 * - Formulates structured uncertainty lists
 * - Produces calibrated confidence scores
 * - Enforces the Zod output schema
 */
export class ClientEvidenceAssistant implements EvidenceAnalysisProvider {
  private isDegraded: boolean;

  constructor(isDegraded: boolean = false) {
    this.isDegraded = isDegraded;
  }

  async analyzeEvidence(input: EvidenceAnalysisInput): Promise<AiEvidenceProposal> {
    if (this.isDegraded) {
      return {
        resource_visible: false,
        operational_state: "uncertain",
        accessibility_state: "uncertain",
        evidence_observations: ["AI analysis service offline or degraded."],
        uncertainties: ["Client offline or model endpoint unreachable; defaulting to human manual entry."],
        confidence: 0.0,
        model_name: AI_MODEL_METADATA.model_name,
        model_version: AI_MODEL_METADATA.model_version,
        prompt_version: AI_MODEL_METADATA.prompt_version,
        queue_band: "unknown",
      };
    }

    const notesLower = (input.cleanNotes || "").toLowerCase();
    const obsList = input.userObservations || [];

    // Adversarial Defense: detect prompt injection keywords attempting to hijack evaluation
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
        resource_visible: false,
        operational_state: "uncertain",
        accessibility_state: "uncertain",
        queue_band: "unknown",
        evidence_observations: ["Suspicious adversarial directive detected in evidence text note."],
        uncertainties: [
          "Input text attempted prompt injection / guideline override; automated classification abstained.",
        ],
        confidence: 0.1,
        model_name: AI_MODEL_METADATA.model_name,
        model_version: AI_MODEL_METADATA.model_version,
        prompt_version: AI_MODEL_METADATA.prompt_version,
      };
      return AiEvidenceProposalSchema.parse(proposal);
    }

    // Indicator keyword sets
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
      evidence_observations.push(`General visual inspection performed for ${input.resourceType.replace("_", " ")}.`);
    }

    const proposal: AiEvidenceProposal = {
      resource_visible,
      operational_state,
      accessibility_state,
      queue_band,
      evidence_observations,
      uncertainties,
      confidence: Number(confidence.toFixed(2)),
      model_name: AI_MODEL_METADATA.model_name,
      model_version: AI_MODEL_METADATA.model_version,
      prompt_version: AI_MODEL_METADATA.prompt_version,
    };

    return AiEvidenceProposalSchema.parse(proposal);
  }
}
