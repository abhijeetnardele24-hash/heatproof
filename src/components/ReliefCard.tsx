import React from "react";
import { Facility, ResourceType } from "../domain/types";
import { Language, TRANSLATIONS } from "../i18n/translations";
import { ProofStrip } from "./ProofStrip";
import {
  Droplets,
  Umbrella,
  Wind,
  HeartPulse,
  Clock,
  MapPin,
  FileCheck,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ReliefCardProps {
  facility: Facility;
  isSelected: boolean;
  onSelect: () => void;
  onOpenReport: (facility: Facility) => void;
  onOpenAttest: (facility: Facility) => void;
  onOpenInspect: (facility: Facility) => void;
  lang: Language;
}

export const ReliefCard: React.FC<ReliefCardProps> = ({
  facility,
  isSelected,
  onSelect,
  onOpenReport,
  onOpenAttest,
  onOpenInspect,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "drinking_water":
      case "hydration_point":
        return <Droplets size={18} style={{ color: "#0284C7" }} />;
      case "shaded_rest":
        return <Umbrella size={18} style={{ color: "#D97706" }} />;
      case "cooling_centre":
        return <Wind size={18} style={{ color: "#0D9488" }} />;
      case "first_aid":
        return <HeartPulse size={18} style={{ color: "#DC2626" }} />;
    }
  };

  const getResourceLabel = (type: ResourceType) => {
    switch (type) {
      case "drinking_water":
      case "hydration_point":
        return t.filterWater;
      case "shaded_rest":
        return t.filterShade;
      case "cooling_centre":
        return t.filterCooling;
      case "first_aid":
        return t.filterFirstAid;
    }
  };

  const isOperational =
    facility.currentComputedStatus === "VERIFIED_AVAILABLE" ||
    facility.currentComputedStatus === "RESTORED";
  const isRestoring =
    facility.currentComputedStatus === "PROPOSED_AVAILABLE" ||
    facility.currentComputedStatus === "UNCERTAIN";

  const getStatusDisplay = () => {
    if (isOperational) {
      return {
        label: t.statusOperational,
        color: "#0D9488",
        bg: "#F0FDFA",
        border: "#99F6E4",
      };
    } else if (isRestoring) {
      return {
        label: t.statusRestoring,
        color: "#D97706",
        bg: "#FEF3C7",
        border: "#FDE68A",
      };
    } else {
      return {
        label: t.statusInoperable,
        color: "#DC2626",
        bg: "#FEE2E2",
        border: "#FECACA",
      };
    }
  };

  const statusInfo = getStatusDisplay();
  const simpleStatus = isOperational
    ? "OPERATIONAL"
    : isRestoring
    ? "RESTORING"
    : "INOPERABLE";

  return (
    <article
      className="civic-card"
      id={`facility-${facility.facilityId}`}
      onClick={onSelect}
      style={{
        border: isSelected ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
        boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* Top Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.6rem",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.75rem",
                fontWeight: "600",
              }}
            >
              {getResourceIcon(facility.resourceType)}
              {getResourceLabel(facility.resourceType)}
            </span>

            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: "600",
                color: "var(--text-muted)",
              }}
            >
              {facility.sourceType === "municipal_registry" ? "Official Municipal Hub" : "Civic Network"}
            </span>
          </div>

          <div
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "var(--radius-pill)",
              backgroundColor: statusInfo.bg,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.border}`,
              fontWeight: "700",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            {isOperational ? (
              <CheckCircle size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
            {statusInfo.label}
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: "700",
            marginBottom: "0.35rem",
            lineHeight: 1.3,
          }}
        >
          {facility.name}
        </h3>

        {/* Zone, Landmark & Expected Hours */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <MapPin size={14} style={{ flexShrink: 0 }} />
            <span>{facility.landmark} ({facility.zone})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Clock size={14} style={{ flexShrink: 0 }} />
            <span>
              {t.hours}: {facility.expectedHours}
            </span>
            <span style={{ marginLeft: "auto", fontWeight: "600", color: "var(--accent-teal)" }}>
              {facility.independentAttestationCount} Corroborations
            </span>
          </div>
        </div>

        {/* Proof Strip */}
        <ProofStrip
          status={simpleStatus}
          witnessCount={facility.independentAttestationCount}
          lastReportedAt={facility.lastVerificationTime}
          onInspect={() => onOpenInspect(facility)}
        />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginTop: "1rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <button
          onClick={() => onOpenReport(facility)}
          aria-label={`${t.actionReport}: ${facility.name}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-strong)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-main)",
            fontWeight: "600",
            fontSize: "0.8rem",
          }}
        >
          <FileCheck size={14} />
          {t.actionReport}
        </button>

        <button
          onClick={() => onOpenAttest(facility)}
          aria-label={`${t.actionAttest}: ${facility.name}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--accent-teal)",
            color: "#FFFFFF",
            fontWeight: "600",
            fontSize: "0.8rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <UserCheck size={14} />
          {t.actionAttest}
        </button>
      </div>
    </article>
  );
};
