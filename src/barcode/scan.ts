/**
 * Barcode/QR scanner stub.
 * Real implementation: expo-camera + a scan viewfinder.
 *
 * For now, accepts text input (manual entry) — Phase 2 adds camera.
 *
 * Returns normalized barcode or null when input is garbage.
 */
import { parseBarcode } from '../catalog/parse';
export { parseBarcode } from '../catalog/parse';

export interface ScanResult {
  barcode: string;
  format: string;
  rawValue: string;
}

/**
 * Parse a scan result string into a normalized barcode.
 * Returns null on garbage — caller shows validation, never guesses.
 */
export function parseScanResult(raw: string): ScanResult | null {
  const barcode = parseBarcode(raw);
  if (!barcode) return null;

  // Heuristic format detection
  const format = barcode.length === 13 ? 'EAN-13' : barcode.length === 12 ? 'UPC-A' : 'UNKNOWN';

  return { barcode, format, rawValue: raw.trim() };
}

/**
 * Validate a barcode string for manual entry.
 */
export function validateBarcodeInput(input: string): string | null {
  const barcode = parseBarcode(input);
  return barcode; // null if invalid
}