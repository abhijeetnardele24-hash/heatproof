# HeatProof Climate Hazard Modeling & Meteorological Methodology

> **Reference Standards**: 
> - NOAA National Weather Service Technical Attachment (SR 90-23)
> - Robert G. Steadman, *The Assessment of Sultriness: Part I & II* (Journal of Applied Meteorology, 1979)
> - Ahmedabad Municipal Corporation Heat Action Plan (HAP) Guidelines

---

## 1. Biophysical Foundation

The human body sheds metabolic heat primarily through the evaporation of perspiration from the skin surface. When atmospheric moisture (relative humidity) is elevated, the vapor pressure gradient between skin and air decreases, dramatically curtailing evaporative cooling efficiency.

Under dry conditions with extreme ambient air temperatures ($> 42^\circ\text{C}$), radiative and convective heat transfer from the environment into the body accelerates, requiring rapid hydration to prevent hyperthermia, heat cramps, and fatal heat stroke.

---

## 2. Mathematical Formulations

### 2.1 Steadman / Rothfusz Regression Equation
HeatProof computes the standard NOAA Apparent Temperature (Heat Index, $\text{HI}$) using the full 16-parameter polynomial regression derived by Rothfusz (1990) based on Steadman’s biophysical human heat balance model:

$$\begin{aligned}
\text{HI} = &-42.379 + 2.04901523\,T + 10.14333127\,RH \\
&- 0.22475541\,T\cdot RH - 0.00683783\,T^2 - 0.05481717\,RH^2 \\
&+ 0.00122874\,T^2\cdot RH + 0.00085282\,T\cdot RH^2 - 0.00000199\,T^2\cdot RH^2
\end{aligned}$$

Where:
- $T$ = Ambient air temperature in degrees Fahrenheit ($^\circ\text{F}$)
- $RH$ = Relative humidity in percent ($0 - 100\%$)

### 2.2 Boundary Adjustments
- **Low Humidity Adjustment**: If $RH < 13\%$ and $80^\circ\text{F} \le T \le 112^\circ\text{F}$:
  $$\Delta \text{HI}_{\text{low}} = -\left(\frac{13 - RH}{4}\right)\sqrt{\frac{17 - |T - 95|}{17}}$$
- **High Humidity Adjustment**: If $RH > 85\%$ and $80^\circ\text{F} \le T \le 87^\circ\text{F}$:
  $$\Delta \text{HI}_{\text{high}} = +\left(\frac{RH - 85}{10}\right)\left(\frac{87 - T}{5}\right)$$
- **Steadman Simple Equation**: For mild ambient temperatures ($T < 80^\circ\text{F}$):
  $$\text{HI}_{\text{simple}} = 0.5 \left(T + 61.0 + \left[(T - 68.0)\times 1.2\right] + (RH \times 0.094)\right)$$

---

## 3. Hazard Bands & Civic Response Actions

| Hazard Tier | Heat Index Range (°C) | Physiological Symptoms | HeatProof System Action |
| :--- | :--- | :--- | :--- |
| **Normal** | $< 27.0^\circ\text{C}$ | Little to no fatigue; standard metabolic equilibrium | Standard wayfinding; routine 180 min verification TTL |
| **Caution** | $27.0 - 32.0^\circ\text{C}$ | Fatigue possible with prolonged physical exposure | Visual caution badges on hydration points |
| **Extreme Caution** | $32.0 - 41.0^\circ\text{C}$ | Heat stroke, heat cramps, or exhaustion possible | Misting stations emphasized; warning banner active |
| **Danger** | $41.0 - 54.0^\circ\text{C}$ | Heat cramps or exhaustion likely; stroke possible | **Emergency Quorum Drop**: $N=1$ outage triggers emergency dispatch |
| **Extreme Danger** | $\ge 54.0^\circ\text{C}$ | Heat stroke imminent with continued exposure | All civic municipal cooling centers placed on red alert |

---

## 4. Live Meteorological Ingestion Pipeline

### 4.1 Data Provider
- **Service**: Open-Meteo Free Weather API (`https://api.open-meteo.com/v1/forecast`)
- **Spatial Granularity**: 0.01° grid cells (~1.1 km resolution)
- **Parameters Sampled**:
  1. `temperature_2m` (°C)
  2. `relative_humidity_2m` (%)
  3. `apparent_temperature` (°C)
  4. `wind_speed_10m` (km/h)
  5. `uv_index` (dimensionless index)

### 4.2 City Baseline & Real-Time Monitoring Stations
- **Pune Central (Shivajinagar & Mandai)**: Lat 18.5204, Lng 73.8567
- **Pune East (Hadapsar Industrial Zone)**: Lat 18.5089, Lng 73.9259
- **Ahmedabad (Old City & Riverfront)**: Lat 23.0225, Lng 72.5714
- **New Delhi (Connaught Place & Old Delhi)**: Lat 28.6139, Lng 77.2090
