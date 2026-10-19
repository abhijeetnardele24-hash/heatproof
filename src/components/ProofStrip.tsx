import React from "react";
import { CheckCircle2, Eye } from "lucide-react";

interface ProofStripProps {
  status: "OPERATIONAL" | "RESTORING" | "INOPERABLE";
  witnessCount: number;
  evidenceDigest?: string;
  lastReportedAt?: string;
  onInspect: () => void;
}

export const ProofStrip: React.FC<ProofStripProps> = ({
  status,
  witnessCount,
  evidenceDigest,
  onInspect,
}) => {
  const digestPreview = evidenceDigest
    ? `${evidenceDigest.slice(0, 8)}...${evidenceDigest.slice(-6)}`
    : "0x1e8338...e583cc";

  const getStatusBadge = () => {
    if (status === "OPERATIONAL") {
      return {
        bg: "#F0FDF4",
        border: "#BBF7D0",
        color: "#15803D",
        label: "Proof Verified",
      };
    } else if (status === "RESTORING") {
      return {
        bg: "#FFFBEB",
        border: "#FDE68A",
        color: "#B45309",
        label: "Restoration Tracked",
      };
    } else {
      return {
        bg: "#FEF2F2",
        border: "#FECACA",
        color: "#B91C1C",
        label: "Outage Witnessed",
      };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        backgroundColor: badge.bg,
        border: `1px solid ${badge.border}`,
        borderRadius: "var(--radius-sm)",
        fontSize: "0.75rem",
        marginTop: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span
          style={{
            fontWeight: "700",
            color: badge.color,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <CheckCircle2 size={13} />
          {badge.label}
        </span>

        <span style={{ color: "var(--text-muted)" }}>•</span>

        <span style={{ color: "var(--text-main)", fontWeight: "600" }}>
          {witnessCount} {witnessCount === 1 ? "Witness" : "Witnesses"}
        </span>

        <span style={{ color: "var(--text-muted)" }}>•</span>

        <span className="mono" style={{ color: "var(--text-muted)" }}>
          {digestPreview}
        </span>
      </div>

      <button
        onClick={onInspect}
        aria-label="Inspect Proof"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          color: "var(--accent-teal-dark)",
          fontWeight: "700",
          fontSize: "0.75rem",
          padding: "0.4rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          backgroundColor: "rgba(13, 148, 136, 0.1)",
          minHeight: "44px",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Eye size={14} />
        Inspect Proof
      </button>
    </div>
  );
};
