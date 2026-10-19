/**
 * Truthful Civic Evidence Observation Modal
 *
 * Implements a real client-side evidence capture pipeline:
 * 1. File / Camera capture supporting JPEG, PNG, and WebP.
 * 2. MIME and size validation (max 5MB) with human-readable feedback.
 * 3. Client-side canvas re-encoding to strip EXIF/GPS tags before hashing.
 * 4. Transparent display of original vs sanitized metadata and SHA-256 digest.
 * 5. Memory safety: explicit object URL revocation and user reset.
 * 6. Deterministic Evidence Rules Assistant for calibrated proposal.
 * 7. Human confirmation required before ledger anchoring or canonical state update.
 */

import React, { useState, useEffect, useRef } from "react";
import { Facility, OperationalState } from "../domain/types";
import { Language } from "../i18n/translations";
import { DeterministicEvidenceRulesAssistant } from "../ai/evidenceAssistant";
import { sanitizeEvidenceText, coarsenCoordinates } from "../privacy/sanitizer";
import { sanitizeEvidenceImage, revokeSanitizedPreview, SanitizedImageResult } from "../privacy/imageSanitizer";
import { createObservationEvidenceDigest } from "../privacy/evidenceHasher";
import { UnifiedLedgerManager } from "../ledger/ledgerProvider";
import { eventStore } from "../domain/storage";
import {
  X,
  Shield,
  Sparkles,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [operationalState, setOperationalState] = useState<OperationalState>("available");
  const [attributes, setAttributes] = useState<string[]>([
    "potable_water_flowing",
    "dispenser_intact",
  ]);
  const [rawNotes, setRawNotes] = useState("");
  const [sanitizedImage, setSanitizedImage] = useState<SanitizedImageResult | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      revokeSanitizedPreview(sanitizedImage);
    };
  }, [sanitizedImage]);

  // Handle Real File / Camera Input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessingImage(true);
    setImageError(null);

    // Clean up previous image if exists
    revokeSanitizedPreview(sanitizedImage);

    try {
      const result = await sanitizeEvidenceImage(file);
      if (!result.success) {
        setImageError(result.error || "Image validation or EXIF stripping failed.");
        setSanitizedImage(null);
      } else {
        setSanitizedImage(result);
        setImageError(null);
      }
    } catch (err: any) {
      setImageError(`Image processing error: ${err?.message || "Failed to process photo"}`);
      setSanitizedImage(null);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleResetImage = () => {
    revokeSanitizedPreview(sanitizedImage);
    setSanitizedImage(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger Deterministic Evidence Rules Assistant appraisal
  useEffect(() => {
    if (!facility) return;

    const assistant = new DeterministicEvidenceRulesAssistant();
    assistant
      .analyzeEvidence({
        resourceType: facility.resourceType,
        sanitizedDigest: sanitizedImage?.sanitizedDigest,
        userObservations: attributes,
        cleanNotes: rawNotes || "Clean drinking water flowing properly with canopy open.",
        coarseZone: facility.zone,
      })
      .then((proposal) => {
        setAiProposal(proposal);
      });
  }, [facility, sanitizedImage, rawNotes, attributes]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
      const expiresAt = new Date(Date.now() + 6 * 3600000).toISOString();
      const observationId = `obs-${Date.now().toString(36)}`;
      const reporter = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

      const digest = await createObservationEvidenceDigest({
        facilityId: facility.facilityId,
        operationalState,
        accessibilityState: "clear",
        queueBand: "low",
        evidenceObservations: attributes,
        coarsenedLat: coarsened.lat,
        coarsenedLng: coarsened.lng,
        photoFingerprint: sanitizedImage?.sanitizedDigest,
        createdAt: now,
      });

      // Save observation to persistent event store
      eventStore.saveObservation({
        observationId,
        facilityId: facility.facilityId,
        proposedState: operationalState,
        humanConfirmedState: operationalState,
        accessibilityState: "clear",
        queueBand: "none",
        evidenceObservations: attributes,
        evidenceDigest: digest,
        createdAt: now,
        expiresAt,
        reporter,
        mode: "LIVE",
        schemaVersion: "1.0.0",
      });

      // Record on truthful ledger
      const ledger = UnifiedLedgerManager.getInstance().getProvider();
      const proofRecord = await ledger.recordObservationDigest(
        observationId,
        facility.facilityId,
        digest,
        reporter
      );
      eventStore.saveProofRecord(proofRecord);

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
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.5rem",
        zIndex: 100,
      }}
    >
      <div
        className="modal-card"
        style={{
          width: "100%",
          maxWidth: "640px",
          height: "min(94vh, 680px)",
          maxHeight: "calc(100vh - 1rem)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-surface)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
          {/* Fixed Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border-light)",
              padding: "1.25rem 1.5rem",
              flexShrink: 0,
            }}
          >
            <div>
              <h2 id="obs-modal-title" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                Submit Civic Evidence Observation
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {facility.name} • {facility.zone}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close dialog"
              style={{
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              overflowY: "auto",
              flex: "1 1 auto",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Privacy Boundary Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "rgba(13, 148, 136, 0.08)",
                border: "1px solid rgba(13, 148, 136, 0.25)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.78rem",
                color: "var(--text-main)",
              }}
            >
              <Shield size={18} style={{ color: "var(--accent-teal)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Client-Side Privacy Boundary:</strong> Photos are decoded and re-encoded locally in browser memory to strip all EXIF GPS tags before hashing. Coordinates coarsened to ~1.1km ({coarsened.lat}, {coarsened.lng}). Zero raw images uploaded automatically.
              </div>
            </div>

            {/* Operational State Selection */}
            <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Human Confirmed State (Required):
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
                  onClick={() => setOperationalState(st.val as OperationalState)}
                  style={{
                    minHeight: "44px",
                    padding: "0.5rem",
                    borderRadius: "var(--radius-md)",
                    border: operationalState === st.val ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                    backgroundColor: operationalState === st.val ? "var(--bg-subtle)" : "var(--bg-surface)",
                    fontWeight: operationalState === st.val ? "700" : "500",
                    fontSize: "0.85rem",
                    color: operationalState === st.val ? "var(--text-main)" : "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genuine Camera / File Capture Pipeline */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Real Photo Capture (JPEG, PNG, WebP — Max 5MB):
            </label>

            {!sanitizedImage ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="evidence-file-input"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  id="btn-trigger-upload"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    minHeight: "64px",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "2px dashed var(--border-strong)",
                    backgroundColor: "var(--bg-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "var(--text-main)",
                  }}
                >
                  <Camera size={20} style={{ color: "var(--accent-teal)" }} />
                  <span>{isProcessingImage ? "Sanitizing in-memory..." : "Capture or Upload Field Evidence Photo"}</span>
                </button>
                {imageError && (
                  <div style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <AlertCircle size={14} />
                    {imageError}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  backgroundColor: "var(--bg-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <CheckCircle2 size={16} style={{ color: "var(--accent-teal)" }} />
                    Sanitized Client-Side Image
                  </span>
                  <button
                    type="button"
                    onClick={handleResetImage}
                    aria-label="Remove image"
                    style={{
                      minHeight: "36px",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid #DC2626",
                      color: "#DC2626",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    Reset Photo
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Original: </span>
                    <strong>{sanitizedImage.originalFileName}</strong> ({(sanitizedImage.originalSizeBytes / 1024).toFixed(1)} KB)
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Sanitized: </span>
                    <strong>{(sanitizedImage.sanitizedSizeBytes / 1024).toFixed(1)} KB</strong> ({sanitizedImage.sanitizedMimeType})
                  </div>
                </div>

                <div style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", wordBreak: "break-all", backgroundColor: "var(--bg-surface)", padding: "0.4rem", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ color: "var(--text-muted)" }}>SHA-256 Digest: </span>
                  {sanitizedImage.sanitizedDigest}
                </div>

                <div style={{ fontSize: "0.72rem", color: "var(--accent-teal)" }}>
                  Privacy Status: <strong>{sanitizedImage.privacyStatus}</strong> (All EXIF GPS stripped)
                </div>
              </div>
            )}
          </div>

          {/* Deterministic Evidence Rules Assistant Proposal */}
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
                  {aiProposal.modelName} Proposal
                </span>
                <span className="badge badge-demo" style={{ fontSize: "0.72rem" }}>
                  {Math.round(aiProposal.confidence * 100)}% Confidence • {aiProposal.modelVersion}
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-main)", margin: "0 0 0.35rem" }}>
                Rule Recommendation: <strong>{aiProposal.result}</strong> (Human approval required before state transition).
              </p>
              {aiProposal.uncertainties.length > 0 && (
                <div style={{ fontSize: "0.72rem", color: "#D97706" }}>
                  Uncertainty Notice: {aiProposal.uncertainties.join(" • ")}
                </div>
              )}
            </div>
          )}

          {/* Evidence Observations Checkboxes */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Field Checklist Indicators:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
              {[
                { id: "potable_water_flowing", label: "Water Flowing / Cold" },
                { id: "dispenser_intact", label: "Dispenser Clean & Intact" },
                { id: "shade_covered", label: "Canopy / Shade Intact" },
                { id: "ac_cooling_active", label: "AC / Fan Operating" },
                { id: "locked_or_padlocked", label: "Padlocked / Inoperable" },
                { id: "debris_blocking", label: "Debris Blocking Entrance" },
              ].map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={attributes.includes(item.id)}
                    onChange={() => toggleAttribute(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Sanitized Notes Input */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Field Notes (PII Filtered):
            </label>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="e.g. Water station running cold; minor queue of 2 workers under shade canopy."
              rows={2}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                fontSize: "0.85rem",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
              }}
            />
            {!sanitization.valid && (
              <div style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                PII Filter Triggered: {sanitization.violations.join(" ")}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-surface)",
            flexShrink: 0,
            position: "relative",
            zIndex: 20,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minHeight: "44px", minWidth: "88px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !sanitization.valid}
            style={{ minHeight: "44px", minWidth: "140px" }}
          >
            {isSubmitting ? "Anchoring..." : "Submit Evidence"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
