import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  OpenMeteoProvider,
  SyntheticFixtureProvider,
} from "../../src/climate/climateProvider";

describe("Climate Providers", () => {
  describe("SyntheticFixtureProvider", () => {
    it("returns deterministic active hazard for pune_core", async () => {
      const provider = new SyntheticFixtureProvider("DANGER");
      const obs = await provider.getObservation("pune_core");

      expect(obs.zoneId).toBe("pune_core");
      expect(obs.zoneName).toContain("Pune Central");
      expect(obs.temperatureC).toBe(37.0);
      expect(obs.relativeHumidityPct).toBe(42);
      expect(obs.mode).toBe("SYNTHETIC");
      expect(obs.severity).toBe("DANGER");
      expect(obs.sourceUrl).toContain("ieee-climatechain-hack");
    });

    it("returns extreme danger hazard when initialized with EXTREME_DANGER", async () => {
      const provider = new SyntheticFixtureProvider("EXTREME_DANGER");
      const obs = await provider.getObservation("ahmedabad_core");

      expect(obs.zoneId).toBe("ahmedabad_core");
      expect(obs.temperatureC).toBe(42.0);
      expect(obs.severity).toBe("EXTREME_DANGER");
    });

    it("returns caution hazard when initialized with CAUTION", async () => {
      const provider = new SyntheticFixtureProvider("CAUTION");
      const obs = await provider.getObservation("pune_core");

      expect(obs.temperatureC).toBe(30.0);
      expect(obs.severity).toBe("CAUTION");
    });

    it("defaults to pune_core when unknown zoneId is given", async () => {
      const provider = new SyntheticFixtureProvider();
      const obs = await provider.getObservation("unknown_zone_123");

      expect(obs.zoneId).toBe("pune_core");
    });
  });

  describe("OpenMeteoProvider", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("fetches and parses live Open-Meteo responses accurately", async () => {
      const mockApiResponse = {
        current: {
          temperature_2m: 38.0,
          relative_humidity_2m: 55,
          apparent_temperature: 46.2,
          wind_speed_10m: 12.4,
          uv_index: 9.5,
          time: "2026-10-19T11:00",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const provider = new OpenMeteoProvider();
      const obs = await provider.getObservation("pune_core");

      expect(obs.temperatureC).toBe(38.0);
      expect(obs.relativeHumidityPct).toBe(55);
      expect(obs.apparentTemperatureC).toBe(46.2);
      expect(obs.mode).toBe("LIVE");
      expect(obs.isCached).toBe(false);
      expect(obs.severity).toBe("EXTREME_DANGER");
    });

    it("serves from cache on subsequent calls within TTL", async () => {
      const mockApiResponse = {
        current: {
          temperature_2m: 38.0,
          relative_humidity_2m: 55,
          apparent_temperature: 46.2,
          wind_speed_10m: 12.4,
          uv_index: 9.5,
          time: "2026-10-19T11:00",
        },
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });
      global.fetch = fetchMock;

      const provider = new OpenMeteoProvider();
      const obs1 = await provider.getObservation("pune_core");
      expect(obs1.mode).toBe("LIVE");

      const obs2 = await provider.getObservation("pune_core");
      expect(obs2.mode).toBe("CACHED");
      expect(obs2.isCached).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to synthetic hazard on network error without throwing", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const provider = new OpenMeteoProvider();
      const obs = await provider.getObservation("pune_core");

      expect(obs.mode).toBe("SYNTHETIC");
      expect(obs.zoneId).toBe("pune_core");
    });

    it("falls back on non-200 HTTP status response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const provider = new OpenMeteoProvider();
      const obs = await provider.getObservation("pune_core");

      expect(obs.mode).toBe("SYNTHETIC");
    });
  });
});
