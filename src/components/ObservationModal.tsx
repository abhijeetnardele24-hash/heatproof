import React, { useState, useEffect } from "react";
import { Facility, OperationalState } from "../domain/types";
import { Language, TRANSLATIONS } from "../i18n/translations";
import { ClientEvidenceAssistant } from "../ai/evidenceAssistant";
import { sanitizeEvidenceText, coarsenCoordinates } from "../privacy/sanitizer";
import { createObservationEvidenceDigest } from "../privacy/evidenceHasher";
import { UnifiedLedgerManager } from "../ledger/ledgerProvider";
import {
  X,
  Shield,
  Sparkles,
  AlertTriangle,
  Camera,
} from "lucide-react";

interface ObservationModalProps {
  facility: Facility | null;
  onClose: () => void;
  onSubmitSuccess: (facilityId: string, newState: OperationalState, digest: string) => void;
  lang: Language;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  facility,
  onClose,
  onSubmitSuccess,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const [operationalState, setOperationalState] = useState<OperationalState>("available");
  const [attributes, setAttributes] = useState<string[]>([
    "potable_water_flowing",
    "dispenser_intact",
  ]);
  const [rawNotes, setRawNotes] = useState("");
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>("operational_flow");
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [aiAccepted, setAiAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger AI analysis when photo / inputs change
  useEffect(() => {
    if (!facility) return;

    let sampleNotes = rawNotes || "Clean drinking water flowing properly with canopy open.";
    if (selectedPhotoType === "padlocked_closed") {
      sampleNotes = "Facility gate is locked with heavy chain padlock. Inoperable.";
    } else if (selectedPhotoType === "dry_broken_tap") {
      sampleNotes = "Dry tap. No water pressure. Broken handle.";
    }

    const assistant = new ClientEvidenceAssistant();
    assistant
      .analyzeEvidence({
        resourceType: facility.resourceType,
        imageFingerprint: selectedPhotoType,
        userObservations: attributes,
        cleanNotes: sampleNotes,
        coarseZone: facility.zone,
      })
      .then((proposal) => {
        setAiProposal(proposal);
        if (proposal.operational_state !== "uncertain" && aiAccepted) {
          setOperationalState(proposal.operational_state);
        }
      });
  }, [facility, selectedPhotoType, rawNotes, attributes, aiAccepted]);

  if (!facility) return null;

  const sanitization = sanitizeEvidenceText(rawNotes);
  const coarsened = coarsenCoordinates(facility.lat, facility.lng);

  const toggleAttribute = (attr: string) => {
    setAttributes((prev) =>
      prev.includes(attr) ? prev.filter((a) => a !== attr) : [...prev, attr]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const digest = await createObservationEvidenceDigest({
        facilityId: facility.facilityId,
        operationalState,
        accessibilityState: "clear",
        queueBand: "low",
        evidenceObservations: attributes,
        coarsenedLat: coarsened.lat,
        coarsenedLng: coarsened.lng,
        photoFingerprint: selectedPhotoType,
        createdAt: now,
      });

      // Record on Ledger
      const ledger = UnifiedLedgerManager.getInstance().getProvider();
      await ledger.recordObservationDigest(
        `obs-${Date.now().toString(36)}`,
        facility.facilityId,
        digest,
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      );

      onSubmitSuccess(facility.facilityId, operationalState, digest);
      onClose();
    } catch (err: any) {
      alert(`Submission error: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="obs-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 100,
      }}
    >
      <div
        className="civic-card"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--bg-surface)",
          padding: "1.5rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1rem",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "0.75rem",
          }}
        >
          <div>
            <h2 id="obs-modal-title" style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              Submit Civic Evidence
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {facility.name} • {facility.zone}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              padding: "0.25rem",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Privacy Boundary Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem",
            backgroundColor: "rgba(13, 148, 136, 0.08)",
            border: "1px solid rgba(13, 148, 136, 0.2)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            color: "var(--text-main)",
            marginBottom: "1rem",
          }}
        >
          <Shield size={16} style={{ color: "var(--accent-teal)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Client-Side Privacy Boundary Active:</strong> All photos have EXIF GPS stripped before upload. Coords coarsened to ~1.1km ({coarsened.lat}, {coarsened.lng}). No phone numbers or PII are logged on-chain.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Operational State Selection */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Reported Operational State:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {[
                { val: "available", label: "Available" },
                { val: "uncertain", label: "Uncertain" },
                { val: "unavailable", label: "Unavailable" },
              ].map((st) => (
                <button
                  type="button"
                  key={st.val}
                  onClick={() => {
                    setOperationalState(st.val as OperationalState);
                    setAiAccepted(false);
                  }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "var(--radius-md)",
                    border: operationalState === st.val ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                    backgroundColor: operationalState === st.val ? "var(--bg-subtle)" : "var(--bg-surface)",
                    fontWeight: operationalState === st.val ? "700" : "500",
                    fontSize: "0.8rem",
                    color: operationalState === st.val ? "var(--text-main)" : "var(--text-muted)",
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Evidence Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Evidence Photo Verification:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setSelectedPhotoType("operational_flow")}
                style={{
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: selectedPhotoType === "operational_flow" ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                <Camera size={16} style={{ margin: "0 auto 4px" }} />
                Clean Flow (Active)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhotoType("padlocked_closed")}
                style={{
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: selectedPhotoType === "padlocked_closed" ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                <AlertTriangle size={16} style={{ margin: "0 auto 4px", color: "#DC2626" }} />
                Padlocked Gate
              </button>
              <button
                type="button"
                onClick={() => setSelectedPhotoType("dry_broken_tap")}
                style={{
                  padding: "0.5rem",
                  borderRadius: "var(--radius-md)",
                  border: selectedPhotoType === "dry_broken_tap" ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                <AlertTriangle size={16} style={{ margin: "0 auto 4px", color: "#D97706" }} />
                Dry Tap / Broken
              </button>
            </div>
          </div>

          {/* Multimodal AI Assistant Proposal Card */}
          {aiProposal && (
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-subtle)",
                border: "1px solid var(--border-strong)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: "700" }}>
                  <Sparkles size={14} style={{ color: "var(--accent-teal)" }} />
                  {t.aiProposalTitle}
                </span>
                <span className="badge badge-demo">
                  {Math.round(aiProposal.confidence * 100)}% Confidence
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", marginBottom: "0.35rem" }}>
                Proposed State: <strong>{aiProposal.operational_state}</strong>
              </div>

              <ul style={{ fontSize: "0.75rem", color: "var(--text-muted)", paddingLeft: "1.2rem", margin: "0.25rem 0" }}>
                {aiProposal.evidence_observations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.75rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={aiAccepted}
                    onChange={(e) => {
                      setAiAccepted(e.target.checked);
                      if (e.target.checked && aiProposal.operational_state !== "uncertain") {
                        setOperationalState(aiProposal.operational_state);
                      }
                    }}
                  />
                  <span>Accept AI Proposal ({t.aiProposalDisclaimer})</span>
                </label>
              </div>
            </div>
          )}

          {/* Verifiable Attributes */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Verifiable Physical Attributes:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  checked={attributes.includes("potable_water_flowing")}
                  onChange={() => toggleAttribute("potable_water_flowing")}
                />
                Clean Drinking Water Flowing
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  checked={attributes.includes("shade_structure_intact")}
                  onChange={() => toggleAttribute("shade_structure_intact")}
                />
                Shaded Canopy Deployed
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  checked={attributes.includes("dispenser_intact")}
                  onChange={() => toggleAttribute("dispenser_intact")}
                />
                Hardware Intact & Clean
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  checked={attributes.includes("no_physical_obstruction")}
                  onChange={() => toggleAttribute("no_physical_obstruction")}
                />
                Unobstructed Wheelchair Access
              </label>
            </div>
          </div>

          {/* Civic Notes Input */}
          <div>
            <label htmlFor="civic-notes" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Field Notes & Civic Observations:
            </label>
            <textarea
              id="civic-notes"
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="e.g. Dispenser working well, cold water available, queue moves smoothly..."
              rows={3}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
              }}
            />
            {!sanitization.valid && (
              <div style={{ fontSize: "0.75rem", color: "var(--heat-danger)", marginTop: "0.25rem" }}>
                Privacy Warning: {sanitization.violations.join("; ")}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !sanitization.valid}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-teal)",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "0.85rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {isSubmitting ? "Hashing & Anchoring..." : t.submitReport}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
