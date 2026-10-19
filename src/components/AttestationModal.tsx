import React, { useState, useEffect } from "react";
import { Facility, AttestationVerdict } from "../domain/types";
import { Language } from "../i18n/translations";
import { sha256Hex } from "../privacy/evidenceHasher";
import { UnifiedLedgerManager } from "../ledger/ledgerProvider";
import { eventStore } from "../domain/storage";
import { X, CheckCircle, AlertOctagon } from "lucide-react";

interface AttestationModalProps {
  facility: Facility | null;
  onClose: () => void;
  onAttestSuccess: (facilityId: string, verdict: AttestationVerdict, digest: string) => void;
  lang: Language;
}

export const AttestationModal: React.FC<AttestationModalProps> = ({
  facility,
  onClose,
  onAttestSuccess,
}) => {

  const [verdict, setVerdict] = useState<AttestationVerdict>("CONFIRM");
  const [attesterAddress, setAttesterAddress] = useState(
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!facility) return null;

  const latestObs = eventStore.getLatestObservation(facility.facilityId);
  const parentObsId = latestObs ? latestObs.observationId : `obs-${facility.facilityId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const attestationId = `att-${Date.now().toString(36)}`;
      const digest = sha256Hex(
        `attestation:${facility.facilityId}:${parentObsId}:${verdict}:${attesterAddress}:${notes}:${now}`
      );

      // Save attestation to event store
      eventStore.saveAttestation({
        attestationId,
        observationId: parentObsId,
        facilityId: facility.facilityId,
        verdict,
        evidenceDigest: digest,
        attester: attesterAddress,
        createdAt: now,
        schemaVersion: "1.0.0",
      });

      // Anchor to proof ledger
      const ledger = UnifiedLedgerManager.getInstance().getProvider();
      const proofRecord = await ledger.recordAttestationDigest(
        attestationId,
        parentObsId,
        facility.facilityId,
        digest,
        attesterAddress
      );
      eventStore.saveProofRecord(proofRecord);

      onAttestSuccess(facility.facilityId, verdict, digest);
      onClose();
    } catch (err: any) {
      alert(`Attestation error: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attest-modal-title"
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
          maxWidth: "540px",
          height: "min(94vh, 620px)",
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
              <h2 id="attest-modal-title" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                Corroborating Witness Attestation
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {facility.name} • Status: <strong>{facility.currentComputedStatus}</strong>
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
            {/* Witness Verdict Selector */}
            <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Independent Witness Verdict:
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  minHeight: "44px",
                  borderRadius: "var(--radius-md)",
                  border: verdict === "CONFIRM" ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                  backgroundColor: verdict === "CONFIRM" ? "rgba(13, 148, 136, 0.08)" : "var(--bg-surface)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="verdict"
                  value="CONFIRM"
                  checked={verdict === "CONFIRM"}
                  onChange={() => setVerdict("CONFIRM")}
                />
                <CheckCircle size={18} style={{ color: "var(--accent-teal)" }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>CONFIRM Operation</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    I independently verify this facility is currently operational and dispensing relief.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  minHeight: "44px",
                  borderRadius: "var(--radius-md)",
                  border: verdict === "CHALLENGE" ? "2px solid #DC2626" : "1px solid var(--border-light)",
                  backgroundColor: verdict === "CHALLENGE" ? "rgba(220, 38, 38, 0.08)" : "var(--bg-surface)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="verdict"
                  value="CHALLENGE"
                  checked={verdict === "CHALLENGE"}
                  onChange={() => setVerdict("CHALLENGE")}
                />
                <AlertOctagon size={18} style={{ color: "#DC2626" }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#DC2626" }}>CHALLENGE / Dispute</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Facility is broken, closed, dry, or inaccessible. Enforces DISPUTED state transition.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Attester Wallet Identifier */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Witness Public Address / Identifier:
            </label>
            <input
              type="text"
              value={attesterAddress}
              onChange={(e) => setAttesterAddress(e.target.value)}
              placeholder="0x..."
              style={{
                width: "100%",
                minHeight: "44px",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
              }}
            />
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Sybil Protection Active: Duplicate submissions from the same address and self-attestations by the reporter are strictly filtered out by the canonical state machine.
            </div>
          </div>

          {/* Witness Notes */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Witness Field Notes (Optional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited at 12:15 PM; cold water flow confirmed."
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
            disabled={isSubmitting}
            style={{ minHeight: "44px", minWidth: "150px" }}
          >
            {isSubmitting ? "Recording..." : "Record Attestation"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};
