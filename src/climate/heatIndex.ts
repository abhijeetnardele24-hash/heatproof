import { HazardLevel } from "../domain/types";

/**
 * Computes the official National Oceanic and Atmospheric Administration (NOAA)
 * Heat Index (apparent temperature) from dry-bulb temperature (Celsius) and relative humidity (%).
 *
 * Grounded in Steadman (1979) human physiological heat balance equations
 * and the Rothfusz regression models utilized by the US National Weather Service (NWS)
 * and international meteorological agencies.
 */
export function calculateHeatIndexCelsius(
  temperatureC: number,
  relativeHumidityPct: number
): number {
  const T = temperatureC * 1.8 + 32; // Fahrenheit
  const RH = Math.max(0, Math.min(100, relativeHumidityPct));

  // If ambient temperature is below 80°F (26.7°C), heat index is essentially equal to dry bulb
  if (T < 80) {
    const simpleHI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + RH * 0.094);
    if (simpleHI < 80) {
      return Number(((simpleHI - 32) / 1.8).toFixed(1));
    }
  }

  // Full Rothfusz regression equation
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Low humidity adjustment
  if (RH < 13 && T >= 80 && T <= 112) {
    const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    HI -= adjustment;
  }
  // High humidity adjustment
  else if (RH > 85 && T >= 80 && T <= 87) {
    const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
    HI += adjustment;
  }

  const resultC = (HI - 32) / 1.8;
  return Number(resultC.toFixed(1));
}

/**
 * Maps Heat Index in Celsius to official NWS / WHO heat hazard tiers.
 */
export function getHeatHazardLevel(heatIndexC: number): HazardLevel {
  if (heatIndexC < 27) {
    return "NORMAL";
  } else if (heatIndexC < 32) {
    return "CAUTION";
  } else if (heatIndexC < 39) {
    return "EXTREME_CAUTION";
  } else if (heatIndexC < 51) {
    return "DANGER";
  } else {
    return "EXTREME_DANGER";
  }
}
