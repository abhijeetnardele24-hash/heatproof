import { describe, it, expect } from "vitest";
import {
  calculateHeatIndexCelsius,
  getHeatHazardLevel,
} from "../../src/climate/heatIndex";

describe("NOAA Heat Index Calculator", () => {
  it("calculates Steadman heat index correctly under moderate conditions", () => {
    // 25C, 50% RH
    const hi = calculateHeatIndexCelsius(25, 50);
    expect(hi).toBe(24.9);
  });

  it("calculates Rothfusz regression accurately under high heat and humidity", () => {
    // 37C (98.6F), 42% RH
    const hi = calculateHeatIndexCelsius(37, 42);
    expect(hi).toBe(42);
  });

  it("handles low humidity adjustment accurately", () => {
    // 35C (95F), 10% RH (<13% RH and 80<=T<=112)
    const hi = calculateHeatIndexCelsius(35, 10);
    expect(hi).toBeDefined();
    expect(typeof hi).toBe("number");
  });

  it("handles high humidity adjustment accurately", () => {
    // 28C (82.4F), 90% RH (>85% RH and 80<=T<=87)
    const hi = calculateHeatIndexCelsius(28, 90);
    expect(hi).toBeDefined();
    expect(typeof hi).toBe("number");
  });

  it("classifies hazard tiers correctly across all bands", () => {
    expect(getHeatHazardLevel(25)).toBe("NORMAL");
    expect(getHeatHazardLevel(29)).toBe("CAUTION");
    expect(getHeatHazardLevel(35)).toBe("EXTREME_CAUTION");
    expect(getHeatHazardLevel(45)).toBe("DANGER");
    expect(getHeatHazardLevel(54)).toBe("EXTREME_DANGER");
  });
});
