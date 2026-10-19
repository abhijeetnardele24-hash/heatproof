export interface SanitizationResult {
  valid: boolean;
  cleanText: string;
  violations: string[];
}

// Regex patterns to detect PII
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
// Indian and international mobile formats (e.g. +91 9876543210, 9876543210, 09876543210)
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/g;
// Indian vehicle registration numbers (e.g. MH 12 AB 1234, DL 01 A 9999)
const VEHICLE_PLATE_REGEX = /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{1,4}\b/gi;
// Residential street address numbers (e.g., "Flat 402, Building 3", "House #12")
const ADDRESS_PATTERNS = /\b(?:flat|house|apt|apartment|door|plot|bldg|building)\s*#?\s*\d+/gi;

/**
 * Validates and sanitizes field text notes submitted with observations or attestations.
 * Strictly rejects entries containing emails, telephone numbers, license plates,
 * or residential unit numbers in compliance with privacy-minimization requirements.
 */
export function sanitizeEvidenceText(rawText: string): SanitizationResult {
  const violations: string[] = [];

  if (!rawText || rawText.trim() === "") {
    return { valid: true, cleanText: "", violations: [] };
  }

  const trimmed = rawText.trim();

  if (EMAIL_REGEX.test(trimmed)) {
    violations.push("Direct personal identifier detected: email address.");
  }

  if (PHONE_REGEX.test(trimmed)) {
    violations.push("Direct personal identifier detected: phone or mobile number.");
  }

  if (VEHICLE_PLATE_REGEX.test(trimmed)) {
    violations.push("Potential surveillance identifier detected: vehicle license plate.");
  }

  if (ADDRESS_PATTERNS.test(trimmed)) {
    violations.push("Personal address identifier detected: residential house/building number.");
  }

  return {
    valid: violations.length === 0,
    cleanText: trimmed,
    violations,
  };
}

/**
 * Coarsens high-precision latitude and longitude to 2 decimal places (~1.1 km resolution).
 * Preserves zone-level civic utility while preventing precise location surveillance
 * of vulnerable outdoor workers or community verifiers.
 */
export function coarsenCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Number(lat.toFixed(2)),
    lng: Number(lng.toFixed(2)),
  };
}

/**
 * Validates uploaded photo evidence metadata and MIME types.
 */
export function validateEvidenceFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_MIMES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type}). Evidence photos must be JPG, PNG, or WebP.`,
    };
  }

  if (file.size > MAX_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}
