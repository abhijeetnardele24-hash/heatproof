import React, { useState } from "react";
import { Facility, AttestationVerdict } from "../domain/types";
import { Language, TRANSLATIONS } from "../i18n/translations";
import { sha256Hex } from "../privacy/evidenceHasher";
import { UnifiedLedgerManager } from "../ledger/ledgerProvider";
import { X, ShieldAlert, CheckCircle, AlertOctagon } from "lucide-react";

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
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const [verdict, setVerdict] = useState<AttestationVerdict>("CONFIRM");
  const [attesterAddress, setAttesterAddress] = useState(
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const digest = sha256Hex(
        `attestation:${facility.facilityId}:${verdict}:${attesterAddress}:${notes}:${now}`
      );

      const ledger = UnifiedLedgerManager.getInstance().getProvider();
      await ledger.recordAttestationDigest(
        `att-${Date.now().toString(36)}`,
        `obs-${facility.facilityId}`,
        digest,
        attesterAddress
      );

      onAttestSuccess(facility.facilityId, verdict, digest);
      onClose();
    } catch (err: any) {
      alert(`Attestation error: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attest-modal-title"
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
          maxWidth: "520px",
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
            <h2 id="attest-modal-title" style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              Corroborating Witness Attestation
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {facility.name} • Status: <strong>{facility.currentComputedStatus}</strong>
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  borderRadius: "var(--radius-md)",
                  border: verdict === "CONFIRM" ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                  backgroundColor: verdict === "CONFIRM" ? "var(--accent-teal-bg)" : "var(--bg-surface)",
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
                <CheckCircle size={16} style={{ color: "var(--accent-teal)" }} />
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>Confirm Operational State</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Facility is dispensing water / shade relief to citizens right now.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: verdict === "CHALLENGE" ? "2px solid #DC2626" : "1px solid var(--border-light)",
                  backgroundColor: verdict === "CHALLENGE" ? "#FEE2E2" : "var(--bg-surface)",
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
                <AlertOctagon size={16} style={{ color: "#DC2626" }} />
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#991B1B" }}>
                    Challenge as Inoperable / Broken
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Facility is padlocked, dry, contaminated, or non-functional.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: verdict === "UNCERTAIN" ? "2px solid #D97706" : "1px solid var(--border-light)",
                  backgroundColor: verdict === "UNCERTAIN" ? "#FEF3C7" : "var(--bg-surface)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="verdict"
                  value="UNCERTAIN"
                  checked={verdict === "UNCERTAIN"}
                  onChange={() => setVerdict("UNCERTAIN")}
                />
                <ShieldAlert size={16} style={{ color: "#D97706" }} />
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#92400E" }}>
                    Uncertain / Inconclusive Evidence
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Cannot conclusively verify operational status from available physical evidence.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Attester Public Identifier */}
          <div>
            <label htmlFor="attester-address" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Witness Public Key / Ethereum Address:
            </label>
            <input
              id="attester-address"
              type="text"
              value={attesterAddress}
              onChange={(e) => setAttesterAddress(e.target.value)}
              className="mono"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "0.8rem",
              }}
            />
          </div>

          {/* Attester Verification Notes */}
          <div>
            <label htmlFor="attest-notes" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "0.35rem" }}>
              Witness Verification Notes:
            </label>
            <textarea
              id="attest-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visited in person at 11:20 AM. Verified dispenser tap 1 is flowing cold water."
              rows={2}
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
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
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
              disabled={isSubmitting}
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
              {isSubmitting ? "Anchoring Attestation..." : t.submitAttestation}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
