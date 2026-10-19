import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HazardBanner } from "./components/HazardBanner";
import { ZoneHeatMap } from "./components/ZoneHeatMap";
import { ReliefCard } from "./components/ReliefCard";
import { ObservationModal } from "./components/ObservationModal";
import { AttestationModal } from "./components/AttestationModal";
import { EvidenceInspectorModal } from "./components/EvidenceInspectorModal";
import { OperationsDashboard } from "./components/OperationsDashboard";
import { INITIAL_FACILITIES } from "./domain/seedData";
import { Facility, OperationalState, AttestationVerdict, AdaptationServiceReceipt } from "./domain/types";
import {
  OpenMeteoProvider,
  SyntheticFixtureProvider,
  ClimateRiskObservation,
} from "./climate/climateProvider";
import { Language, TRANSLATIONS } from "./i18n/translations";
import { Search, ShieldCheck, CheckCircle2, WifiOff } from "lucide-react";

import { eventStore } from "./domain/storage";

export const App: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [selectedZone, setSelectedZone] = useState<string>("pune_core");
  const [currentTab, setCurrentTab] = useState<"wayfinding" | "witness" | "operations">("wayfinding");
  const [lang, setLang] = useState<Language>("en");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<{
    type: "report" | "attest" | "inspect";
    facility: Facility;
  } | null>(null);

  const [climateObservation, setClimateObservation] = useState<ClimateRiskObservation>({
    zoneId: "pune_core",
    zoneName: "Pune Central (Shivajinagar & Mandai)",
    providerName: "Open-Meteo Free Weather API (ECMWF IFS Model)",
    sourceUrl: "https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567",
    observationTimestamp: new Date().toISOString(),
    temperatureC: 38.6,
    apparentTemperatureC: 45.2,
    relativeHumidityPct: 48,
    windSpeedKmh: 14.2,
    uvIndex: 10.4,
    heatIndexC: 44.8,
    severity: "DANGER",
    mode: "LIVE",
    freshnessSeconds: 0,
    isCached: false,
    notes: "Live meteorological telemetry.",
  });

  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [asrs, setAsrs] = useState<AdaptationServiceReceipt[]>(() => {
    const stored = eventStore.getReceipts();
    if (stored.length > 0) return stored;
    const seedAsr: AdaptationServiceReceipt = {
      receiptId: "asr_fac-pune-mandai-01_20261019T100000_1e8338b4",
      version: "1.0.0",
      facilityId: "fac-pune-mandai-01",
      facilityName: "Mandai Central Municipal Hydration & Misting Hub",
      resourceType: "hydration_point",
      zone: "Pune Central (Shivajinagar & Mandai)",
      hazardWindow: {
        hazardId: "haz-20261019-1100-pune",
        provider: "Open-Meteo Free Weather API + NOAA Rothfusz Heat Index",
        zone: "Pune Central (Shivajinagar & Mandai)",
        hazardType: "extreme_heat",
        severity: "DANGER",
        temperatureC: 38.6,
        apparentTemperatureC: 45.2,
        relativeHumidityPct: 48,
        uvIndex: 10.4,
        validFrom: "2026-10-19T10:00:00Z",
        validUntil: "2026-10-19T14:00:00Z",
        sourceTimestamp: "2026-10-19T10:30:00Z",
        sourceReference: "https://api.open-meteo.com/v1/forecast?latitude=18.5144&longitude=73.8553",
        mode: "LIVE",
      },
      serviceInterval: {
        start: "2026-10-19T10:00:00Z",
        end: "2026-10-19T14:00:00Z",
        durationMinutes: 240,
      },
      sourceObservationIds: ["obs-pune-20261019-01"],
      attestationIds: ["att-pune-01", "att-pune-02"],
      evidenceMerkleRoot: "0x1e8338b46836861547a5fd9cfaeb1f5db99af010c715ce34262d3872e583ccde",
      verificationStatus: "VERIFIED_SERVICE_DELIVERED",
      methodologyVersion: "IEEE-CLIMATECHAIN-ADAPTATION-V1",
      limitations: [
        "Receipt certifies verified operational status of the physical facility during the active hazard window.",
        "Does not measure individual civic hydration volume or medical outcome metrics.",
      ],
      issuedAt: "2026-10-19T11:45:00Z",
      issuerAddress: "0x1234567890123456789012345678901234567890",
    };
    eventStore.saveReceipt(seedAsr);
    return [seedAsr];
  });

  const t = TRANSLATIONS[lang];

  // Fetch weather on zone change or manual refresh
  const loadWeather = async (zone: string) => {
    setIsLoadingWeather(true);
    try {
      const provider = new OpenMeteoProvider();
      const obs = await provider.getObservation(zone);
      setClimateObservation(obs);
    } catch {
      const fallback = new SyntheticFixtureProvider();
      const obs = await fallback.getObservation(zone);
      setClimateObservation(obs);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedZone);
  }, [selectedZone]);

  // Online / offline detector
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Theme attribute
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [isDark]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleObservationSuccess = (
    facilityId: string,
    _newState: OperationalState,
    digest: string
  ) => {
    const hazardContext = {
      heatIndexCelsius: climateObservation.heatIndexC,
      hazardLevel: climateObservation.severity,
    };
    const evalResult = eventStore.evaluateFacility(facilityId, new Date(), hazardContext);

    setFacilities((prev) =>
      prev.map((f) =>
        f.facilityId === facilityId
          ? {
              ...f,
              currentComputedStatus: evalResult.state,
              lastVerificationTime: new Date().toISOString(),
              independentAttestationCount: evalResult.independentAttestationCount,
              disputeStatus: evalResult.activeDispute ? "active_dispute" : "none",
            }
          : f
      )
    );
    showToast(
      `Observation anchored successfully! Canonical state: ${evalResult.state}. Digest: ${digest.slice(0, 10)}...`
    );
  };

  const handleAttestationSuccess = (
    facilityId: string,
    verdict: AttestationVerdict,
    digest: string
  ) => {
    const hazardContext = {
      heatIndexCelsius: climateObservation.heatIndexC,
      hazardLevel: climateObservation.severity,
    };
    const evalResult = eventStore.evaluateFacility(facilityId, new Date(), hazardContext);

    setFacilities((prev) =>
      prev.map((f) =>
        f.facilityId === facilityId
          ? {
              ...f,
              currentComputedStatus: evalResult.state,
              lastVerificationTime: new Date().toISOString(),
              independentAttestationCount: evalResult.independentAttestationCount,
              disputeStatus: evalResult.activeDispute ? "active_dispute" : "none",
            }
          : f
      )
    );

    // If verified available or restored, event-source a new ASR
    if (evalResult.state === "VERIFIED_AVAILABLE" || evalResult.state === "RESTORED") {
      const targetFacility = facilities.find((f) => f.facilityId === facilityId);
      if (targetFacility) {
        try {
          const newAsr = eventStore.issueReceiptForFacility(targetFacility, hazardContext);
          setAsrs((prev) => [newAsr, ...prev.filter((r) => r.receiptId !== newAsr.receiptId)]);
        } catch {
          // ignore
        }
      }
    }

    showToast(
      `Attestation recorded on proof log. Verdict: ${verdict}. State: ${evalResult.state}. Digest: ${digest.slice(0, 10)}...`
    );
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((fac) => {
    const matchesResource =
      resourceFilter === "all" ||
      fac.resourceType === resourceFilter ||
      (resourceFilter === "drinking_water" && fac.resourceType === "hydration_point");

    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.zone.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesResource && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Offline Alert Bar */}
      {isOffline && (
        <div
          role="status"
          style={{
            backgroundColor: "#B45309",
            color: "#FFFFFF",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            fontWeight: "600",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <WifiOff size={16} />
          Operating Offline — Service Worker Active. Evidence queue will sync upon reconnection.
        </div>
      )}

      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        dataMode={climateObservation.mode}
        isDark={isDark}
        setIsDark={setIsDark}
        activeZoneName={climateObservation.zoneName}
      />

      {/* Main Content Area */}
      <main className="app-container" style={{ flex: 1, paddingTop: "1.5rem", paddingBottom: "3rem" }}>
        {/* Real-Time Hazard Intelligence Banner */}
        <HazardBanner
          observation={climateObservation}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          onRefresh={() => loadWeather(selectedZone)}
          isLoading={isLoadingWeather}
          lang={lang}
        />

        {/* View Switching */}
        {currentTab === "operations" ? (
          <OperationsDashboard
            facilities={facilities}
            climateObservation={climateObservation}
            asrs={asrs}
            lang={lang}
          />
        ) : (
          <div>
            {/* Interactive Thermal Map */}
            <ZoneHeatMap
              facilities={filteredFacilities}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={(id) => {
                setSelectedFacilityId(id);
                const el = document.getElementById(`facility-${id}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              climateObservation={climateObservation}
            />

            {/* Controls: Search & Resource Type Filters */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              {/* Search Bar */}
              <div
                style={{
                  position: "relative",
                  flex: "1 1 280px",
                  maxWidth: "450px",
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search relief facilities"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              {/* Resource Filters */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { id: "all", label: t.filterAll },
                  { id: "drinking_water", label: t.filterWater },
                  { id: "shaded_rest", label: t.filterShade },
                  { id: "cooling_centre", label: t.filterCooling },
                  { id: "first_aid", label: t.filterFirstAid },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setResourceFilter(f.id)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "0.8rem",
                      fontWeight: resourceFilter === f.id ? "700" : "500",
                      backgroundColor: resourceFilter === f.id ? "var(--accent-teal)" : "var(--bg-surface)",
                      color: resourceFilter === f.id ? "#FFFFFF" : "var(--text-main)",
                      border: "1px solid var(--border-light)",
                      minHeight: "34px",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Relief Facilities Grid */}
            {filteredFacilities.length === 0 ? (
              <div
                className="civic-card"
                style={{
                  padding: "2.5rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <p>{t.noFacilitiesFound}</p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                  gap: "1rem",
                }}
              >
                {filteredFacilities.map((facility) => (
                  <ReliefCard
                    key={facility.facilityId}
                    facility={facility}
                    isSelected={facility.facilityId === selectedFacilityId}
                    onSelect={() => setSelectedFacilityId(facility.facilityId)}
                    onOpenReport={(fac) => setActiveModal({ type: "report", facility: fac })}
                    onOpenAttest={(fac) => setActiveModal({ type: "attest", facility: fac })}
                    onOpenInspect={(fac) => setActiveModal({ type: "inspect", facility: fac })}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-light)",
          backgroundColor: "var(--bg-surface)",
          padding: "1.5rem 0",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <div
          className="app-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <strong>HeatProof</strong> • IEEE ClimateChain Global Hackathon 2026 Submission
            <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>
              Track: Climate Data & Environmental Monitoring • Open Source MIT License
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <ShieldCheck size={14} style={{ color: "var(--accent-teal)" }} />
              Zero PII Cryptographic Log
            </span>
            <span>•</span>
            <span>Open-Meteo & NOAA Heat Model</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#1C2024",
            color: "#FFFFFF",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "var(--shadow-lg)",
            zIndex: 200,
            maxWidth: "420px",
            animation: "slideIn 0.2s ease-out",
          }}
        >
          <CheckCircle2 size={16} style={{ color: "var(--accent-teal)", flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === "report" && (
        <ObservationModal
          facility={activeModal.facility}
          onClose={() => setActiveModal(null)}
          onSubmitSuccess={handleObservationSuccess}
          lang={lang}
        />
      )}

      {activeModal?.type === "attest" && (
        <AttestationModal
          facility={activeModal.facility}
          onClose={() => setActiveModal(null)}
          onAttestSuccess={handleAttestationSuccess}
          lang={lang}
        />
      )}

      {activeModal?.type === "inspect" && (
        <EvidenceInspectorModal
          facility={activeModal.facility}
          onClose={() => setActiveModal(null)}
          lang={lang}
        />
      )}
    </div>
  );
};
