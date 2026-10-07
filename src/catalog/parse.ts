/**
 * Barcode/QR parse from a string (user input or scan).
 * Returns normalized barcode string (EAN-13 preferred) or null on garbage.
 *
 * Barcode conventions:
 * - 13-digit EAN-13: standard product identifier
 * - 12-digit UPC-A: also OK
 * - 10-digit ISBN-10: convert to barcode-like format
 * - Code 39, Code 128: common QR/barcode formats
 *
 * This is a minimal parser — real app would use a camera + lib like scannable /
 * expo-barcode-scanner.
 */
export function parseBarcode(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  // Strip common prefixes/suffixes
  const cleaned = text.replace(/['" ]/g, '').toUpperCase();

  // EAN-13: 13 digits, starting with any valid digit
  const ean13Match = cleaned.match(/^(\d{13})$/);
  if (ean13Match) return ean13Match[1];

  // UPC-A: 12 digits (convert to EAN-13 by prepending 0)
  const upcaMatch = cleaned.match(/^(\d{12})$/);
  if (upcaMatch) return '0' + upcaMatch[1];

  // ISBN-13: 978 or 979 prefix + rest
  const isbn13Match = cleaned.match(/^(\d{9}[\dX])$/);
  if (isbn13Match) return isbn13Match[1];

  // Bare number 8-13 digits: treat as potential barcode
  const numberMatch = cleaned.match(/^(\d{8,13})$/);
  if (numberMatch) {
    // If 12 digits, prefix with 0 for EAN-13
    if (numberMatch[1].length === 12) return '0' + numberMatch[1];
    return numberMatch[1];
  }

  return null;
}

/**
 * Is this a valid barcode format for catalog lookup?
 */
export function isValidBarcode(code: string | null | undefined): code is string {
  if (!code) return false;
  return /^\d{8,13}$/.test(code);
}