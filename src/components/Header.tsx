import React from "react";
import { Language, TRANSLATIONS } from "../i18n/translations";
import { DataMode } from "../domain/types";
import { Flame, ShieldCheck, Moon, Sun, Globe } from "lucide-react";

interface HeaderProps {
  currentTab: "wayfinding" | "witness" | "operations";
  setCurrentTab: (tab: "wayfinding" | "witness" | "operations") => void;
  lang: Language;
  setLang: (lang: Language) => void;
  dataMode: DataMode;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  activeZoneName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  dataMode,
  isDark,
  setIsDark,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
            }}
          >
            <Flame size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: "800", letterSpacing: "-0.03em" }}>
                {t.appName}
              </span>
              <span
                className={`badge badge-${dataMode.toLowerCase()}`}
                title={`Operating in ${dataMode} mode. Live data backed by Open-Meteo & verified cryptographically.`}
              >
                <ShieldCheck size={12} />
                {dataMode}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "none" }}>
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Main Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            backgroundColor: "var(--bg-subtle)",
            padding: "0.25rem",
            borderRadius: "var(--radius-pill)",
          }}
        >
          <button
            onClick={() => setCurrentTab("wayfinding")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-pill)",
              fontWeight: currentTab === "wayfinding" ? "700" : "500",
              backgroundColor: currentTab === "wayfinding" ? "var(--bg-surface)" : "transparent",
              color: currentTab === "wayfinding" ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: currentTab === "wayfinding" ? "var(--shadow-sm)" : "none",
              fontSize: "0.85rem",
              minHeight: "36px",
            }}
          >
            {t.tabWayfinding}
          </button>
          <button
            onClick={() => setCurrentTab("witness")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-pill)",
              fontWeight: currentTab === "witness" ? "700" : "500",
              backgroundColor: currentTab === "witness" ? "var(--bg-surface)" : "transparent",
              color: currentTab === "witness" ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: currentTab === "witness" ? "var(--shadow-sm)" : "none",
              fontSize: "0.85rem",
              minHeight: "36px",
            }}
          >
            {t.tabWitness}
          </button>
          <button
            onClick={() => setCurrentTab("operations")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "var(--radius-pill)",
              fontWeight: currentTab === "operations" ? "700" : "500",
              backgroundColor: currentTab === "operations" ? "var(--bg-surface)" : "transparent",
              color: currentTab === "operations" ? "var(--text-main)" : "var(--text-muted)",
              boxShadow: currentTab === "operations" ? "var(--shadow-sm)" : "none",
              fontSize: "0.85rem",
              minHeight: "36px",
            }}
          >
            {t.tabOperations}
          </button>
        </nav>

        {/* Controls: Language & Theme */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              backgroundColor: "var(--bg-subtle)",
              padding: "0.25rem 0.5rem",
              borderRadius: "var(--radius-pill)",
            }}
          >
            <Globe size={14} style={{ color: "var(--text-muted)" }} />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              aria-label="Select Language"
              style={{
                background: "transparent",
                border: "none",
                fontWeight: "600",
                fontSize: "0.8rem",
                color: "var(--text-main)",
                minHeight: "32px",
                cursor: "pointer",
              }}
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिंदी (HI)</option>
              <option value="mr">मराठी (MR)</option>
            </select>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            style={{
              width: "36px",
              height: "36px",
              minHeight: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-main)",
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
