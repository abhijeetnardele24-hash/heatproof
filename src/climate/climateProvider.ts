import { HazardLevel, DataMode } from "../domain/types";
import { calculateHeatIndexCelsius, getHeatHazardLevel } from "./heatIndex";

export interface ZoneCoordinates {
  zoneId: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

export const MONITORED_ZONES: Record<string, ZoneCoordinates> = {
  pune_core: {
    zoneId: "pune_core",
    name: "Pune Central (Shivajinagar & Mandai)",
    state: "Maharashtra",
    country: "India",
    lat: 18.5204,
    lng: 73.8567,
  },
  pune_hadapsar: {
    zoneId: "pune_hadapsar",
    name: "Pune East (Hadapsar Industrial Zone)",
    state: "Maharashtra",
    country: "India",
    lat: 18.5089,
    lng: 73.926,
  },
  ahmedabad_core: {
    zoneId: "ahmedabad_core",
    name: "Ahmedabad (Old City & Riverfront)",
    state: "Gujarat",
    country: "India",
    lat: 23.0225,
    lng: 72.5714,
  },
  delhi_core: {
    zoneId: "delhi_core",
    name: "New Delhi (Connaught Place & Old Delhi)",
    state: "Delhi",
    country: "India",
    lat: 28.6139,
    lng: 77.209,
  },
};

export interface ClimateRiskObservation {
  zoneId: string;
  zoneName: string;
  providerName: string;
  sourceUrl: string;
  observationTimestamp: string;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidityPct: number;
  windSpeedKmh: number;
  uvIndex: number;
  heatIndexC: number;
  severity: HazardLevel;
  mode: DataMode;
  freshnessSeconds: number;
  isCached: boolean;
  notes: string;
}

export interface ClimateDataProvider {
  getObservation(zoneId: string): Promise<ClimateRiskObservation>;
}

/**
 * Open-Meteo Public Weather API provider.
 * Requires zero API keys or authentication secrets.
 * Sourced from high-resolution global numerical weather prediction models (ECMWF IFS, GFS).
 */
export class OpenMeteoProvider implements ClimateDataProvider {
  private cache: Map<string, { obs: ClimateRiskObservation; cachedAt: number }> =
    new Map();
  private cacheTtlMs = 10 * 60 * 1000; // 10 minutes client cache

  async getObservation(zoneId: string): Promise<ClimateRiskObservation> {
    const zone = MONITORED_ZONES[zoneId] || MONITORED_ZONES.pune_core;
    const now = Date.now();
    const cached = this.cache.get(zone.zoneId);

    if (cached && now - cached.cachedAt < this.cacheTtlMs) {
      return {
        ...cached.obs,
        mode: "CACHED",
        isCached: true,
        freshnessSeconds: Math.floor((now - new Date(cached.obs.observationTimestamp).getTime()) / 1000),
      };
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${zone.lat}&longitude=${zone.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index&timezone=auto`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }

      const data = await res.json();
      const current = data.current;
      const tempC = Number(current.temperature_2m);
      const rhPct = Number(current.relative_humidity_2m);
      const apparentC = Number(current.apparent_temperature);
      const windKmh = Number(current.wind_speed_10m);
      const uv = Number(current.uv_index || 0);

      const heatIndexC = calculateHeatIndexCelsius(tempC, rhPct);
      const severity = getHeatHazardLevel(heatIndexC);
      const obsTime = current.time ? new Date(current.time).toISOString() : new Date().toISOString();

      const observation: ClimateRiskObservation = {
        zoneId: zone.zoneId,
        zoneName: zone.name,
        providerName: "Open-Meteo Free Weather API (ECMWF IFS Model)",
        sourceUrl: url,
        observationTimestamp: obsTime,
        temperatureC: tempC,
        apparentTemperatureC: apparentC,
        relativeHumidityPct: rhPct,
        windSpeedKmh: windKmh,
        uvIndex: uv,
        heatIndexC,
        severity,
        mode: "LIVE",
        freshnessSeconds: 0,
        isCached: false,
        notes: `Live meteorological observation for ${zone.name}. Heat index computed via NOAA/Steadman physiological regression.`,
      };

      this.cache.set(zone.zoneId, { obs: observation, cachedAt: now });
      return observation;
    } catch (err: any) {
      console.warn(`[OpenMeteoProvider] Failed to fetch live weather: ${err?.message || err}. Falling back to cached or synthetic baseline.`);

      // If we have stale cache, return as CACHED / DEGRADED
      if (cached) {
        return {
          ...cached.obs,
          mode: "DEGRADED",
          isCached: true,
          freshnessSeconds: Math.floor((now - cached.cachedAt) / 1000),
          notes: `Stale cached data. Live connection failed: ${err?.message || "Network error"}.`,
        };
      }

      // Otherwise return deterministic synthetic fallback clearly labeled
      return new SyntheticFixtureProvider().getObservation(zone.zoneId);
    }
  }
}

/**
 * Deterministic synthetic fixture provider.
 * Used for automated testing and offline demo reproduction.
 */
export class SyntheticFixtureProvider implements ClimateDataProvider {
  private simulatedHeatTier: HazardLevel;

  constructor(simulatedHeatTier: HazardLevel = "DANGER") {
    this.simulatedHeatTier = simulatedHeatTier;
  }

  async getObservation(zoneId: string): Promise<ClimateRiskObservation> {
    const zone = MONITORED_ZONES[zoneId] || MONITORED_ZONES.pune_core;
    const now = new Date();

    let tempC = 37.0;
    let rhPct = 42;
    if (this.simulatedHeatTier === "EXTREME_DANGER") {
      tempC = 42.0;
      rhPct = 50;
    } else if (this.simulatedHeatTier === "CAUTION") {
      tempC = 30.0;
      rhPct = 40;
    }

    const heatIndexC = calculateHeatIndexCelsius(tempC, rhPct);
    const severity = getHeatHazardLevel(heatIndexC);

    return {
      zoneId: zone.zoneId,
      zoneName: zone.name,
      providerName: "Synthetic Calibrated Hazard Fixture (Offline / Testbed)",
      sourceUrl: "https://ieee-climatechain-hack.devpost.com/",
      observationTimestamp: now.toISOString(),
      temperatureC: tempC,
      apparentTemperatureC: 44.8,
      relativeHumidityPct: rhPct,
      windSpeedKmh: 14.2,
      uvIndex: 9.8,
      heatIndexC,
      severity,
      mode: "SYNTHETIC",
      freshnessSeconds: 0,
      isCached: false,
      notes: "Deterministic calibrated synthetic climate fixture for automated testing and emergency response simulation.",
    };
  }
}
