import { describe, it, expect, vi } from "vitest";
import {
  validateEvidenceImageFile,
  stripExifFromJpegBytes,
  sanitizeEvidenceImage,
  revokeSanitizedPreview,
  SanitizedImageResult,
} from "../../src/privacy/imageSanitizer";

describe("Client-Side Evidence Image Sanitizer & EXIF Stripper", () => {
  it("rejects files exceeding 5MB limit", () => {
    const oversized = {
      name: "oversized.jpg",
      size: 6 * 1024 * 1024,
      type: "image/jpeg",
    };
    const res = validateEvidenceImageFile(oversized);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("exceeds maximum allowed limit");
  });

  it("rejects empty (0 byte) files", () => {
    const emptyFile = {
      name: "empty.png",
      size: 0,
      type: "image/png",
    };
    const res = validateEvidenceImageFile(emptyFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("0 bytes");
  });

  it("rejects non-image or unsupported MIME types", () => {
    const pdfFile = {
      name: "document.pdf",
      size: 1024,
      type: "application/pdf",
    };
    const res = validateEvidenceImageFile(pdfFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Allowed formats: JPEG, PNG, WebP");
  });

  it("accepts valid JPEG, PNG, and WebP files under 5MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      const res = validateEvidenceImageFile({
        name: `test.${type.split("/")[1]}`,
        size: 500 * 1024,
        type,
      });
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    }
  });

  it("strips EXIF APP1 metadata segment from JPEG bytes", () => {
    // Construct synthetic JPEG with SOI (FF D8), APP1 (FF E1, length 8, "EXIF00"), DQT (FF DB, length 4), and SOS (FF DA)
    const soi = [0xff, 0xd8];
    // APP1 length includes 2 bytes for the length field itself + 4 bytes payload = 6
    const app1 = [0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66]; // EXIF marker
    const dqt = [0xff, 0xdb, 0x00, 0x04, 0x01, 0x02];
    const sos = [0xff, 0xda, 0x12, 0x34];
    const syntheticJpeg = new Uint8Array([...soi, ...app1, ...dqt, ...sos]);

    const stripped = stripExifFromJpegBytes(syntheticJpeg);

    // SOI + DQT + SOS should remain; APP1 must be gone
    expect(stripped.length).toBe(soi.length + dqt.length + sos.length);
    // Ensure 0xFF 0xE1 does not appear in stripped output
    let foundApp1 = false;
    for (let i = 0; i < stripped.length - 1; i++) {
      if (stripped[i] === 0xff && stripped[i + 1] === 0xe1) {
        foundApp1 = true;
        break;
      }
    }
    expect(foundApp1).toBe(false);
  });

  it("processes and returns sanitized metadata and digest for valid image blob", async () => {
    const fakeJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x01, 0x02, 0xff, 0xd9]);
    const blob = new Blob([fakeJpegBytes], { type: "image/jpeg" });

    const result = await sanitizeEvidenceImage(blob, "field_photo.jpg");
    expect(result.success).toBe(true);
    expect(result.originalFileName).toBe("field_photo.jpg");
    expect(result.originalSizeBytes).toBe(fakeJpegBytes.length);
    expect(result.originalMimeType).toBe("image/jpeg");
    expect(result.sanitizedDigest).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.privacyStatus).toMatch(/EXIF_STRIPPED/);
  });

  it("handles preview URL revocation safely", () => {
    const revokeSpy = vi.fn();
    (global as any).URL = {
      revokeObjectURL: revokeSpy,
    };

    const mockResult: SanitizedImageResult = {
      success: true,
      originalFileName: "test.jpg",
      originalSizeBytes: 100,
      originalMimeType: "image/jpeg",
      sanitizedSizeBytes: 90,
      sanitizedMimeType: "image/webp",
      sanitizedDigest: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      previewUrl: "blob:http://localhost/mock-uuid",
      privacyStatus: "EXIF_STRIPPED_CANVAS_RE_ENCODED",
      sanitizedBlob: null,
    };

    revokeSanitizedPreview(mockResult);
    expect(revokeSpy).toHaveBeenCalledWith("blob:http://localhost/mock-uuid");

    // Null safety
    expect(() => revokeSanitizedPreview(null)).not.toThrow();
  });

  it("returns failure result when invalid file type is passed to sanitizeEvidenceImage", async () => {
    const invalidBlob = new Blob(["not an image"], { type: "text/plain" });
    const result = await sanitizeEvidenceImage(invalidBlob, "notes.txt");
    expect(result.success).toBe(false);
    expect(result.privacyStatus).toBe("REJECTED_VALIDATION_ERROR");
    expect(result.error).toContain("Allowed formats");
  });
});
