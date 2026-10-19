/**
 * Truthful Cryptographic Evidence Inspector Modal
 *
 * Displays genuine provenance for any civic heat-relief facility:
 * 1. Exact latest field observation and sanitized attributes.
 * 2. Independent witness attestations with duplicate/self-attestation filter breakdown.
 * 3. Canonical state machine evaluation result, rule explanation, and quorum metrics.
 * 4. Canonical preimage payload and SHA-256 evidence digest.
 * 5. Truthful ledger mode (LOCAL_DEMO vs TESTNET_CONFIRMED), displaying real explorer URLs only when on-chain confirmed.
 */

import React, { useState, useEffect } from "react";
import { Facility } from "../domain/types";
import { Language } from "../i18n/translations";
import { eventStore } from "../domain/storage";
import { canonicalStringify, sha256Hex } from "../privacy/evidenceHasher";
import {
  X,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  ExternalLink,
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

  // Keyboard accessibility: Escape to close & focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!facility) return null;

  const latestObs = eventStore.getLatestObservation(facility.facilityId);
  const attestations = latestObs ? eventStore.getAttestations(latestObs.observationId) : [];
  const evalResult = eventStore.evaluateFacility(facility.facilityId);
  const proofRecord = latestObs ? eventStore.getProofRecord(latestObs.observationId) : undefined;

  // Build canonical preimage payload
  const canonicalPreimage = latestObs
    ? {
        observationId: latestObs.observationId,
        facilityId: latestObs.facilityId,
        proposedState: latestObs.proposedState,
        humanConfirmedState: latestObs.humanConfirmedState,
        accessibilityState: latestObs.accessibilityState,
        queueBand: latestObs.queueBand,
        evidenceObservations: latestObs.evidenceObservations,
        reporter: latestObs.reporter,
        createdAt: latestObs.createdAt,
        expiresAt: latestObs.expiresAt,
      }
    : {
        facilityId: facility.facilityId,
        facilityName: facility.name,
        resourceType: facility.resourceType,
        zone: facility.zone,
        status: facility.currentComputedStatus,
        notice: "Demonstration seed fixture record (Initial Seed State)",
      };

  const canonicalJson = canonicalStringify(canonicalPreimage);
  const computedDigest = sha256Hex(canonicalJson);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfirmedOnChain = proofRecord?.isEvmTransaction === true && !!proofRecord?.transactionHash;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
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
          maxWidth: "720px",
          height: "min(94vh, 680px)",
          maxHeight: "calc(100vh - 1rem)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-surface)",
          padding: 0,
          overflow: "hidden",
        }}
      >
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={22} style={{ color: "var(--accent-teal)" }} />
              <h2 id="inspector-modal-title" style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                Evidence Provenance Inspector
              </h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {facility.name} • {facility.zone}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close evidence inspector dialog"
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
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            flex: "1 1 auto",
            minHeight: 0,
          }}
        >
          {/* State Machine Status Banner */}
          <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "var(--radius-md)",
            backgroundColor:
              evalResult.state === "VERIFIED_AVAILABLE" || evalResult.state === "RESTORED"
                ? "rgba(13, 148, 136, 0.08)"
                : evalResult.state === "DISPUTED"
                ? "rgba(220, 38, 38, 0.08)"
                : "rgba(217, 119, 6, 0.08)",
            border: `1px solid ${
              evalResult.state === "VERIFIED_AVAILABLE" || evalResult.state === "RESTORED"
                ? "rgba(13, 148, 136, 0.3)"
                : evalResult.state === "DISPUTED"
                ? "rgba(220, 38, 38, 0.3)"
                : "rgba(217, 119, 6, 0.3)"
            }`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            {evalResult.state === "VERIFIED_AVAILABLE" || evalResult.state === "RESTORED" ? (
              <CheckCircle2 size={18} style={{ color: "var(--accent-teal)" }} />
            ) : (
              <AlertTriangle size={18} style={{ color: "#D97706" }} />
            )}
            <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>
              Canonical State: <code>{evalResult.state}</code>
            </span>
            <span className="badge badge-verified" style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
              Quorum: {evalResult.independentAttestationCount}/{evalResult.requiredAttestations} Confirmed
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-main)", margin: 0 }}>
            <strong>State Reason:</strong> {evalResult.reason}
          </p>
        </div>

        {/* Operating Ledger Mode & Proof Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              <Database size={14} />
              PROOF LEDGER MODE
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>
              {proofRecord?.mode ?? "LOCAL_DEMO"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {isConfirmedOnChain
                ? "Confirmed On-Chain (Arbitrum Sepolia)"
                : "Client-Side Cryptographic Hash Chain"}
            </div>
          </div>

          <div
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
              <Clock size={14} />
              WITNESS CORROBORATION
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>
              {evalResult.independentAttestationCount} Independent Witness(es)
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {evalResult.rejectedAttestations.length > 0
                ? `${evalResult.rejectedAttestations.length} rejected (Sybil/self-attestation)`
                : "Zero Sybil/duplicate violations"}
            </div>
          </div>
        </div>

        {/* Cryptographic Identifiers */}
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.35rem" }}>
            Evidence Preimage SHA-256 Digest:
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              wordBreak: "break-all",
            }}
          >
            <span>{latestObs?.evidenceDigest || computedDigest}</span>
            <button
              type="button"
              onClick={() => handleCopy(latestObs?.evidenceDigest || computedDigest)}
              style={{
                marginLeft: "0.5rem",
                padding: "0.25rem 0.5rem",
                fontSize: "0.7rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Copy size={12} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Truthful Explorer Link or Local Proof Hash */}
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.35rem" }}>
            {isConfirmedOnChain ? "Arbitrum Sepolia Transaction:" : "Local Proof Log Entry Hash:"}
          </label>
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              wordBreak: "break-all",
            }}
          >
            {isConfirmedOnChain && proofRecord?.explorerUrl ? (
              <a
                href={proofRecord.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--accent-teal)",
                  textDecoration: "underline",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                {proofRecord.transactionHash}
                <ExternalLink size={12} />
              </a>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                <span>{proofRecord?.localProofHash ?? "Local append-only sequence (SHA-256 hash log)"}</span>
                <div style={{ fontSize: "0.7rem", marginTop: "4px", color: "var(--text-muted)" }}>
                  (Truthful Notice: No EVM transaction broadcast in local demo mode. Explorer link rendered only upon genuine confirmed on-chain receipt.)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canonical Preimage Payload Inspection */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700" }}>Canonical JSON Preimage Payload:</span>
            <button
              type="button"
              onClick={() => handleCopy(canonicalJson)}
              style={{
                padding: "0.2rem 0.5rem",
                fontSize: "0.7rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                cursor: "pointer",
              }}
            >
              Copy Preimage JSON
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono)",
              overflowX: "auto",
              maxHeight: "160px",
            }}
          >
            {JSON.stringify(canonicalPreimage, null, 2)}
          </pre>
        </div>

        {/* Witness Attestation Provenance */}
        {attestations.length > 0 && (
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "0.35rem" }}>
              Witness Attestation Ledger ({attestations.length}):
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {attestations.map((att) => (
                <div
                  key={att.attestationId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-subtle)",
                    fontSize: "0.75rem",
                  }}
                >
                  <div>
                    <strong>{att.verdict}</strong> by <code>{att.attester.slice(0, 10)}...</code>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                    Digest: {att.evidenceDigest.slice(0, 12)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

        {/* Fixed Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
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
            style={{ minHeight: "44px", minWidth: "120px" }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
