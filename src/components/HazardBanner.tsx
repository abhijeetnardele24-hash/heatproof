import React from "react";
import { ClimateRiskObservation, MONITORED_ZONES } from "../climate/climateProvider";
import { Language, TRANSLATIONS } from "../i18n/translations";
import { AlertTriangle, Droplets, Thermometer, Sun, Wind, RefreshCw } from "lucide-react";

interface HazardBannerProps {
  observation: ClimateRiskObservation;
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lang: Language;
}

export const HazardBanner: React.FC<HazardBannerProps> = ({
  observation,
  selectedZone,
  setSelectedZone,
  onRefresh,
  isLoading,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "EXTREME_DANGER":
        return "#7F1D1D";
      case "DANGER":
        return "#DC2626";
      case "EXTREME_CAUTION":
        return "#EA580C";
      case "CAUTION":
        return "#D97706";
      default:
        return "#10B981";
    }
  };

  const getSeverityBg = (sev: string) => {
    switch (sev) {
      case "EXTREME_DANGER":
        return "rgba(127, 29, 29, 0.08)";
      case "DANGER":
        return "rgba(220, 38, 38, 0.08)";
      case "EXTREME_CAUTION":
        return "rgba(234, 88, 12, 0.08)";
      case "CAUTION":
        return "rgba(217, 119, 6, 0.08)";
      default:
        return "rgba(16, 185, 129, 0.08)";
    }
  };

  const severityColor = getSeverityColor(observation.severity);
  const severityBg = getSeverityBg(observation.severity);

  return (
    <section
      aria-label="Climate Hazard Intelligence"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${severityColor}40`,
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        boxShadow: "var(--shadow-sm)",
        background: `linear-gradient(135deg, var(--bg-surface) 60%, ${severityBg} 100%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Zone Selector & Hazard Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-pill)",
              backgroundColor: severityColor,
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              letterSpacing: "0.04em",
            }}
          >
            <AlertTriangle size={15} />
            {observation.severity}
          </div>

          <label htmlFor="zone-select" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)" }}>
            {t.selectZone}:
          </label>
          <select
            id="zone-select"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-main)",
              fontWeight: "600",
              fontSize: "0.9rem",
              minHeight: "38px",
              cursor: "pointer",
            }}
          >
            {Object.values(MONITORED_ZONES).map((z) => (
              <option key={z.zoneId} value={z.zoneId}>
                {z.name} ({z.state})
              </option>
            ))}
          </select>
        </div>

        {/* Action: Live Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {observation.isCached ? "Cached (10m TTL)" : "Live Telemetry"}
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh Meteorological Hazard Data"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-main)",
              fontSize: "0.8rem",
              fontWeight: "600",
              minHeight: "36px",
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Meteorological Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Heat Index Primary KPI */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
            borderLeft: `4px solid ${severityColor}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
            <Thermometer size={14} style={{ color: severityColor }} />
            {t.heatIndex}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: severityColor, letterSpacing: "-0.03em" }}>
            {observation.heatIndexC.toFixed(1)}°C
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            NOAA / Steadman Metric
          </div>
        </div>

        {/* Ambient Temperature */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
            <Sun size={14} />
            {t.currentTemp}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.03em" }}>
            {observation.temperatureC.toFixed(1)}°C
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Apparent {observation.apparentTemperatureC.toFixed(1)}°C
          </div>
        </div>

        {/* Relative Humidity */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
            <Droplets size={14} style={{ color: "#0284C7" }} />
            {t.humidity}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.03em" }}>
            {observation.relativeHumidityPct}%
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            High Evaporative Stress
          </div>
        </div>

        {/* Wind & Solar UV */}
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "600" }}>
            <Wind size={14} />
            Wind & Solar UV
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)", marginTop: "0.25rem" }}>
            {observation.windSpeedKmh} km/h • UV {observation.uvIndex}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {observation.providerName.split("(")[0]}
          </div>
        </div>
      </div>
    </section>
  );
};
