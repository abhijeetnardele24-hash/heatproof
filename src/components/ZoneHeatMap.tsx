import React from "react";
import { Facility, CanonicalState } from "../domain/types";
import { ClimateRiskObservation } from "../climate/climateProvider";
import { Navigation } from "lucide-react";

interface ZoneHeatMapProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (id: string) => void;
  climateObservation: ClimateRiskObservation;
}

export const ZoneHeatMap: React.FC<ZoneHeatMapProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  climateObservation,
}) => {
  const getMarkerCoords = (lat: number, lng: number) => {
    const minLat = 18.49;
    const maxLat = 18.55;
    const minLng = 73.83;
    const maxLng = 73.94;

    const x = ((lng - minLng) / (maxLng - minLng)) * 740 + 30;
    const y = 330 - ((lat - minLat) / (maxLat - minLat)) * 300;
    return {
      x: Math.max(40, Math.min(760, x)),
      y: Math.max(30, Math.min(330, y)),
    };
  };

  const getStatusColor = (status: CanonicalState) => {
    switch (status) {
      case "VERIFIED_AVAILABLE":
      case "RESTORED":
        return "#0D9488"; // Verified Teal
      case "PROPOSED_AVAILABLE":
      case "UNCERTAIN":
        return "#D97706"; // Amber
      case "VERIFIED_UNAVAILABLE":
      case "PROPOSED_UNAVAILABLE":
      case "DISPUTED":
      case "EXPIRED":
        return "#DC2626"; // Crimson
      default:
        return "#64748B";
    }
  };

  return (
    <div
      className="civic-card"
      style={{
        padding: "1rem",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
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
          <Navigation size={18} style={{ color: "var(--accent-teal)" }} />
          <h2 style={{ fontSize: "1rem", fontWeight: "700" }}>
            Urban Thermal Topology & Relief Corridors
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0D9488" }}></span>
            Operational
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#D97706" }}></span>
            Restoring
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#DC2626" }}></span>
            Inoperable
          </span>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: "260px",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "var(--radius-md)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid var(--border-light)",
        }}
      >
        <svg
          viewBox="0 0 800 360"
          style={{ width: "100%", height: "100%", display: "block" }}
          aria-label="Interactive Thermal Map with Relief Facilities"
        >
          <defs>
            <radialGradient id="heat-core" cx="35%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#EA580C" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-east" cx="70%" cy="55%" r="45%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#D97706" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="800" height="360" fill="url(#grid-pattern)" />

          {/* Thermal plume overlays */}
          <ellipse cx="320" cy="180" rx="260" ry="140" fill="url(#heat-core)" />
          <ellipse cx="580" cy="200" rx="190" ry="120" fill="url(#heat-east)" />

          {/* Civic River corridor simulation */}
          <path
            d="M 50 220 Q 240 180 380 200 T 750 140"
            fill="none"
            stroke="#0284C7"
            strokeWidth="8"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />

          {/* Isotherm Contour Lines */}
          <path
            d="M 120 120 C 220 90, 420 110, 520 140 S 720 180, 780 210"
            fill="none"
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
          />
          <text x="690" y="200" fill="#EA580C" fontSize="10" fontWeight="600" opacity="0.7">
            Isotherm 42°C
          </text>

          <path
            d="M 160 170 C 260 150, 400 160, 500 190 S 680 240, 750 270"
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
          />
          <text x="660" y="260" fill="#DC2626" fontSize="10" fontWeight="600" opacity="0.7">
            Isotherm 45°C
          </text>

          {/* Monitored Facility Pins */}
          {facilities.map((fac) => {
            const coords = getMarkerCoords(fac.lat, fac.lng);
            const isSelected = fac.facilityId === selectedFacilityId;
            const markerColor = getStatusColor(fac.currentComputedStatus);

            return (
              <g
                key={fac.facilityId}
                tabIndex={0}
                role="button"
                aria-label={`${fac.name} - Status: ${fac.currentComputedStatus}`}
                onClick={() => onSelectFacility(fac.facilityId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectFacility(fac.facilityId);
                  }
                }}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {isSelected && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="20"
                    fill={markerColor}
                    fillOpacity="0.2"
                    stroke={markerColor}
                    strokeWidth="1.5"
                  />
                )}

                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? "11" : "8"}
                  fill={markerColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
                />

                <circle cx={coords.x} cy={coords.y} r="3" fill="#FFFFFF" />

                <text
                  x={coords.x}
                  y={coords.y - 14}
                  textAnchor="middle"
                  fill="var(--text-main)"
                  fontSize={isSelected ? "12" : "10"}
                  fontWeight={isSelected ? "700" : "600"}
                  style={{
                    textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                    userSelect: "none",
                  }}
                >
                  {fac.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: "0.35rem 0.65rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-light)",
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "var(--text-main)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {climateObservation.zoneName}: Heat Index {climateObservation.heatIndexC.toFixed(1)}°C
        </div>
      </div>
    </div>
  );
};
