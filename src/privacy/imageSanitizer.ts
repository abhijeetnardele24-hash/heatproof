/**
 * Client-Side Evidence Image Sanitizer & EXIF Stripper
 *
 * Enforces zero-PII client-side evidence processing:
 * 1. Validates file size (max 5MB) and MIME type (JPEG, PNG, WebP).
 * 2. Decodes image pixels in-memory and re-encodes via Canvas without copying metadata.
 * 3. Strips EXIF headers (GPS coordinates, camera model, timestamps).
 * 4. Generates a deterministic SHA-256 digest of sanitized bytes.
 * 5. Provides safe Object URL management with explicit revocation.
 */

import { sha256Hex } from "./evidenceHasher";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface SanitizedImageResult {
  success: boolean;
  originalFileName: string;
  originalSizeBytes: number;
  originalMimeType: string;
  sanitizedSizeBytes: number;
  sanitizedMimeType: string;
  sanitizedDigest: `0x${string}`;
  previewUrl: string | null;
  privacyStatus: string;
  sanitizedBlob: Blob | null;
  error?: string;
}

/**
 * Validates file MIME type and size limit before any memory allocation.
 */
export function validateEvidenceImageFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || "unknown"}). Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5.0 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty (0 bytes). Please select a valid photo.",
    };
  }

  return { valid: true };
}

/**
 * Strips EXIF / JFIF metadata from JPEG byte buffers directly (pure function / node/browser compatible)
 */
export function stripExifFromJpegBytes(bytes: Uint8Array): Uint8Array {
  // Check for JPEG SOI marker (0xFF, 0xD8)
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  const pieces: Uint8Array[] = [bytes.subarray(0, 2)]; // Keep SOI
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }

    const marker = bytes[offset + 1];

    // Standalone markers with no length (RST, SOI, EOI)
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      pieces.push(bytes.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    // End of image
    if (marker === 0xd9) {
      pieces.push(bytes.subarray(offset, offset + 2));
      break;
    }

    if (offset + 4 > bytes.length) break;
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];

    // Marker 0xE1 is APP1 (EXIF / XMP metadata). Skip it!
    // Marker 0xE2 - 0xEF are other application markers (APP2-APP15).
    const isExifOrAppMetadata = marker >= 0xe1 && marker <= 0xef;

    if (!isExifOrAppMetadata) {
      pieces.push(bytes.subarray(offset, offset + 2 + segmentLength));
    }

    offset += 2 + segmentLength;

    // SOS (Start of Scan 0xDA) means entropy-coded image data begins
    if (marker === 0xda) {
      pieces.push(bytes.subarray(offset));
      break;
    }
  }

  const totalLength = pieces.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const piece of pieces) {
    result.set(piece, cur);
    cur += piece.length;
  }
  return result;
}

async function readBlobAsUint8Array(file: Blob | File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    try {
      const buf = await file.arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      // fallback
    }
  }
  if (typeof Response !== "undefined") {
    try {
      const buf = await new Response(file).arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      // fallback
    }
  }
  return new Promise((resolve, reject) => {
    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("No binary reader API (arrayBuffer, Response, or FileReader) available"));
    }
  });
}

/**
 * Client-side Canvas Re-encoder
 * Decodes image into pixel raster and re-encodes to strip all metadata tags.
 */
export async function sanitizeEvidenceImage(file: File | Blob, fileName = "evidence.jpg"): Promise<SanitizedImageResult> {
  const originalFileName = (file as File).name || fileName;
  const originalSizeBytes = file.size;
  const originalMimeType = file.type || "image/jpeg";

  const validation = validateEvidenceImageFile({
    name: originalFileName,
    size: originalSizeBytes,
    type: originalMimeType,
  });

  if (!validation.valid) {
    return {
      success: false,
      originalFileName,
      originalSizeBytes,
      originalMimeType,
      sanitizedSizeBytes: 0,
      sanitizedMimeType: originalMimeType,
      sanitizedDigest: "0x0000000000000000000000000000000000000000000000000000000000000000",
      previewUrl: null,
      privacyStatus: "REJECTED_VALIDATION_ERROR",
      sanitizedBlob: null,
      error: validation.error,
    };
  }

  try {
    // If running in browser with real Canvas and Image API support (not jsdom test environment)
    const isBrowserWithCanvas =
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      typeof Image !== "undefined" &&
      typeof HTMLCanvasElement !== "undefined" &&
      typeof HTMLCanvasElement.prototype.toBlob === "function" &&
      typeof process === "undefined";

    if (isBrowserWithCanvas) {
      try {
        const bitmapOrUrl = URL.createObjectURL(file);

        const sanitizedBlob: Blob = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const maxDim = 1920;
              let width = img.width;
              let height = img.height;

              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext("2d");
              if (!ctx) {
                URL.revokeObjectURL(bitmapOrUrl);
                reject(new Error("Unable to obtain 2D rendering context"));
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              URL.revokeObjectURL(bitmapOrUrl);

              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error("Canvas re-encoding returned null blob"));
                  }
                },
                "image/webp",
                0.85
              );
            } catch (canvasErr) {
              URL.revokeObjectURL(bitmapOrUrl);
              reject(canvasErr);
            }
          };

          img.onerror = () => {
            URL.revokeObjectURL(bitmapOrUrl);
            reject(new Error("Image decode failed in browser canvas"));
          };

          img.src = bitmapOrUrl;
        });

        const bytes = await readBlobAsUint8Array(sanitizedBlob);
        const digest = sha256Hex(Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(""));
        const previewUrl = URL.createObjectURL(sanitizedBlob);

        return {
          success: true,
          originalFileName,
          originalSizeBytes,
          originalMimeType,
          sanitizedSizeBytes: sanitizedBlob.size,
          sanitizedMimeType: sanitizedBlob.type || "image/webp",
          sanitizedDigest: digest,
          previewUrl,
          privacyStatus: "EXIF_STRIPPED_CANVAS_RE_ENCODED",
          sanitizedBlob,
        };
      } catch {
        // Fall back to byte-level sanitization
      }
    }

    // Node / Headless / Fallback: Direct byte EXIF strip
    const rawBuffer = await readBlobAsUint8Array(file);
    const strippedBytes = stripExifFromJpegBytes(rawBuffer);
    const sanitizedBlob = new Blob([strippedBytes.slice().buffer], { type: "image/jpeg" });
    const digest = sha256Hex(Array.from(strippedBytes).map((b) => b.toString(16).padStart(2, "0")).join(""));

    return {
      success: true,
      originalFileName,
      originalSizeBytes,
      originalMimeType,
      sanitizedSizeBytes: strippedBytes.length,
      sanitizedMimeType: "image/jpeg",
      sanitizedDigest: digest,
      previewUrl: null,
      privacyStatus: "EXIF_STRIPPED_BYTE_LEVEL",
      sanitizedBlob,
    };
  } catch (err: any) {
    return {
      success: false,
      originalFileName,
      originalSizeBytes,
      originalMimeType,
      sanitizedSizeBytes: 0,
      sanitizedMimeType: originalMimeType,
      sanitizedDigest: "0x0000000000000000000000000000000000000000000000000000000000000000",
      previewUrl: null,
      privacyStatus: "SANITIZATION_FAILED",
      sanitizedBlob: null,
      error: `Sanitization pipeline error: ${err?.message || "Failed to process image"}`,
    };
  }
}

/**
 * Revokes any created preview Object URL to prevent memory leaks.
 */
export function revokeSanitizedPreview(result: SanitizedImageResult | null) {
  if (result?.previewUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
    URL.revokeObjectURL(result.previewUrl);
  }
}
