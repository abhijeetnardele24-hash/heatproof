# HeatProof Data Sources, Attributions & Data Dictionary

> **Compliance**: Open Data Standards & Intellectual Property Attribution  
> **Event**: IEEE ClimateChain Global Hackathon 2026  

---

## 1. External Data Services & Licenses

| Service / Dataset | Purpose | License / Terms | Attribution |
| :--- | :--- | :--- | :--- |
| **Open-Meteo Weather API** | Live ambient temperature, relative humidity, wind speed, UV index | Creative Commons Attribution 4.0 International (CC BY 4.0) | Open-Meteo.com under CC BY 4.0 |
| **NOAA Rothfusz / Steadman Algorithm** | Mathematical computation of apparent Heat Index | US Public Domain | National Oceanic and Atmospheric Administration (NOAA) |
| **Pune Smart City & AMC Heat Action Plans** | Relief infrastructure typology (misting hubs, hydration stations) | Open Government Data (OGD) Platform India | Pune Municipal Corporation (PMC) & Ahmedabad Municipal Corp (AMC) |
| **Arbitrum Sepolia Testnet** | Decentralized public cryptographic proof anchoring | MIT / Apache 2.0 (Ethereum / Nitro) | Arbitrum Foundation / Offchain Labs |
| **Lucide Icons** | Mineral civic iconography and accessible UI symbols | ISC License | Lucide Contributors |

---

## 2. Core Data Dictionary

### 2.1 Facility Registry (`src/domain/types.ts:Facility`)
| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique alphanumeric facility identifier | `"fac-pune-mandai-01"` |
| `name` | `string` | Human-readable civic name | `"Mandai Central Municipal Hydration & Misting Hub"` |
| `resourceType` | `ResourceType` | Physical category of cooling relief | `"drinking_water"`, `"cooling_center"` |
| `zone` | `string` | Coarse municipal district | `"Pune Central (Shivajinagar & Mandai)"` |
| `landmark` | `string` | Navigation landmark | `"Near Mahatma Phule Mandai Main Gate"` |
| `coordinates` | `{ lat: number, lng: number }` | Centroid coordinates (coarsened to 0.01°) | `{"lat": 18.5158, "lng": 73.8560}` |
| `operationalState` | `OperationalState` | Current verified status | `"available"`, `"restoring"`, `"unavailable"` |
| `fsmState` | `FsmState` | Formal state machine node | `"VERIFIED_AVAILABLE"` |
| `lastVerificationTime`| `string` | ISO-8601 timestamp of last evidence anchor | `"2026-10-19T18:30:00Z"` |
| `independentAttestationCount` | `number` | Corroborating witness count ($N \ge 2$) | `3` |
| `isOfficial` | `boolean` | Municipal vs. community facility flag | `true` |

---

### 2.2 Climate Telemetry (`src/domain/types.ts:ClimateHazardData`)
| Field Name | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `zoneId` | `string` | - | Monitored zone identifier |
| `timestamp` | `string` | ISO-8601 | Observation timestamp |
| `temperature` | `number` | °C | 2m ambient dry-bulb temperature |
| `relativeHumidity` | `number` | % | 2m relative humidity percentage |
| `apparentTemperature` | `number` | °C | Apparent heat index calculated via NOAA model |
| `heatIndex` | `number` | °C | Rothfusz/Steadman computed heat index |
| `heatBand` | `HeatHazardBand` | - | `"NORMAL"`, `"CAUTION"`, `"EXTREME_CAUTION"`, `"DANGER"`, `"EXTREME_DANGER"` |
| `windSpeed` | `number` | km/h | 10m surface wind speed |
| `uvIndex` | `number` | - | Solar ultraviolet index |

---

### 2.3 Adaptation Service Receipt (`src/domain/types.ts:AdaptationServiceReceipt`)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `receiptId` | `string` | Unique UUID identifier for the receipt |
| `facilityId` | `string` | Target facility identifier |
| `merkleRoot` | `string` | 32-byte hex root of aggregated adaptation events |
| `serviceWindowStart` | `string` | ISO-8601 window opening |
| `serviceWindowEnd` | `string` | ISO-8601 window closing |
| `protectedPopulation` | `number` | Estimated unique beneficiaries protected |
| `litersDispensed` | `number` | Volume of potable drinking water provided |
| `activeHeatIndex` | `number` | Average ambient Heat Index recorded during window |
| `stateMachineTransition`| `string` | Recorded state transition (e.g. `PROPOSED -> VERIFIED`) |
| `attestationIds` | `string[]` | Array of witness attestation IDs incorporated into root |
| `rawEvidenceDigest` | `string` | SHA-256 hash of the canonical preimage payload |
