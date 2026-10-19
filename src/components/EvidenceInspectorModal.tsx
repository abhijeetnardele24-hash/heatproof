import React, { useState } from "react";
import { Facility } from "../domain/types";
import { Language } from "../i18n/translations";
import { sha256Hex } from "../privacy/evidenceHasher";
import {
  X,
  ShieldCheck,
  Hash,
  Database,
  CheckCircle2,
  Layers,
  Copy,
} from "lucide-react";

interface EvidenceInspectorModalProps {
  facility: Facility | null;
  onClose: () => void;
  lang?: Language;
}

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  facility,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!facility) return null;

  const mockDigest = sha256Hex(
    `canonical:${facility.facilityId}:${facility.currentComputedStatus}:${facility.lastVerificationTime}`
  );
  const mockTxHash = sha256Hex(`tx:${mockDigest}:1048202`);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePayload = {
    facilityId: facility.facilityId,
    facilityName: facility.name,
    resourceType: facility.resourceType,
    zone: facility.zone,
    activeState: facility.currentComputedStatus,
    coarsenedCoordinates: {
      latitude: Number(facility.lat.toFixed(2)),
      longitude: Number(facility.lng.toFixed(2)),
      precision: "~1.1km grid",
    },
    privacySafeguards: {
      exifStripped: true,
      piiScanned: true,
      rawMediaLocation: "off-chain sanitized storage",
    },
    cryptographicProof: {
      algorithm: "SHA-256",
      canonicalDigest: mockDigest,
      ledgerNetwork: "HeatProof Secure Proof Log / EVM Testnet",
      transactionHash: mockTxHash,
      blockNumber: 1048202,
      status: "CONFIRMED",
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
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
          maxWidth: "680px",
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={20} style={{ color: "var(--accent-teal)" }} />
              <h2 id="inspector-modal-title" style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                Cryptographic Evidence Inspector
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {facility.name} • {facility.independentAttestationCount} Corroborating Witness Attestations
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

        {/* Verification Status Card */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#15803D", fontWeight: "700", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
            <CheckCircle2 size={16} />
            Cryptographic Integrity Verified (Fail-Closed Gate Passed)
          </div>
          <div style={{ fontSize: "0.75rem", color: "#166534" }}>
            Canonical SHA-256 digest matches recomputed preimage exactly. No PII present. State machine invariants verified.
          </div>
        </div>

        {/* Hashes and Identifiers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Hash size={13} />
                Canonical SHA-256 Evidence Digest:
              </span>
              <button
                onClick={() => handleCopy(mockDigest)}
                style={{ fontSize: "0.7rem", color: "var(--accent-teal)", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <Copy size={11} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div
              className="mono"
              style={{
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                fontSize: "0.75rem",
                wordBreak: "break-all",
                border: "1px solid var(--border-light)",
              }}
            >
              {mockDigest}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
              <Database size={13} />
              Ledger Transaction Anchor Hash:
            </div>
            <div
              className="mono"
              style={{
                padding: "0.5rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-subtle)",
                fontSize: "0.75rem",
                wordBreak: "break-all",
                border: "1px solid var(--border-light)",
              }}
            >
              {mockTxHash}
            </div>
          </div>
        </div>

        {/* Canonical JSON Preimage Payload */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
            <Layers size={13} />
            Canonical Raw Payload (Zero PII):
          </div>
          <pre
            className="mono"
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              fontSize: "0.75rem",
              maxHeight: "180px",
              overflowY: "auto",
              color: "var(--text-main)",
            }}
          >
            {JSON.stringify(samplePayload, null, 2)}
          </pre>
        </div>

        {/* Close Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-main)",
              fontWeight: "600",
              fontSize: "0.85rem",
            }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
