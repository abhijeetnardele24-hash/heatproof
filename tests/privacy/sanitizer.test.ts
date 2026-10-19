import { describe, it, expect } from "vitest";
import { sanitizeEvidenceText, coarsenCoordinates, validateEvidenceFile } from "../../src/privacy/sanitizer";
import { sha256Hex, createObservationEvidenceDigest } from "../../src/privacy/evidenceHasher";

describe("Privacy Sanitization & Cryptographic Digesting", () => {
  it("approves clean, non-identifying environmental notes", () => {
    const res = sanitizeEvidenceText("Water cooler tap is flowing with cold water. Ground is clean and shaded.");
    expect(res.valid).toBe(true);
    expect(res.violations).toHaveLength(0);
  });

  it("detects and rejects mobile telephone numbers", () => {
    const res = sanitizeEvidenceText("Contact caretaker at 9822012345 for key to shelter.");
    expect(res.valid).toBe(false);
    expect(res.violations[0]).toContain("phone or mobile number");
  });

  it("detects and rejects email addresses", () => {
    const res = sanitizeEvidenceText("Reach me at volunteer.alex@example.org with questions.");
    expect(res.valid).toBe(false);
    expect(res.violations[0]).toContain("email address");
  });

  it("detects and rejects vehicle license plates", () => {
    const res = sanitizeEvidenceText("Delivery van MH 12 CD 4567 blocking the misting tent.");
    expect(res.valid).toBe(false);
    expect(res.violations[0]).toContain("vehicle license plate");
  });

  it("detects and rejects residential unit numbers", () => {
    const res = sanitizeEvidenceText("Water filter located right beside Flat 402 entrance.");
    expect(res.valid).toBe(false);
    expect(res.violations[0]).toContain("residential house/building number");
  });

  it("coarsens coordinates to ~1.1km resolution (2 decimal places)", () => {
    const coarsened = coarsenCoordinates(18.5204392, 73.8567431);
    expect(coarsened.lat).toBe(18.52);
    expect(coarsened.lng).toBe(73.86);
  });

  it("validates file sizes and MIME types correctly", () => {
    const validJpg = validateEvidenceFile({ name: "cooler.jpg", size: 1024 * 1024, type: "image/jpeg" });
    expect(validJpg.valid).toBe(true);

    const oversized = validateEvidenceFile({ name: "video.mp4", size: 8 * 1024 * 1024, type: "video/mp4" });
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain("Unsupported file type");
  });

  it("produces deterministic 32-byte 0x-prefixed SHA-256 hash", async () => {
    const digest1 = await sha256Hex("HeatProof deterministic canonical test payload");
    const digest2 = await sha256Hex("HeatProof deterministic canonical test payload");
    expect(digest1).toMatch(/^0x[0-9a-f]{64}$/);
    expect(digest1).toBe(digest2);
  });

  it("observation evidence digest is invariant to key reordering", async () => {
    const d1 = await createObservationEvidenceDigest({
      facilityId: "fac_1",
      operationalState: "available",
      accessibilityState: "clear",
      queueBand: "none",
      evidenceObservations: ["B", "A"],
      coarsenedLat: 18.52,
      coarsenedLng: 73.86,
      createdAt: "2026-10-19T10:00:00Z",
    });

    const d2 = await createObservationEvidenceDigest({
      accessibilityState: "clear",
      facilityId: "fac_1",
      evidenceObservations: ["A", "B"], // reordered array
      coarsenedLat: 18.52,
      coarsenedLng: 73.86,
      operationalState: "available",
      queueBand: "none",
      createdAt: "2026-10-19T10:00:00Z",
    });

    expect(d1).toBe(d2);
  });
});
