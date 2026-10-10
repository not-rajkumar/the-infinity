import { describe, expect, it } from 'vitest';
import { parseScanResult, validateBarcodeInput } from '../scan';

describe('barcode scan normalization', () => {
  it('normalizes UPC-A to EAN-13 and detects the format', () => {
    expect(parseScanResult(' 123456789012 ')).toEqual({
      barcode: '0123456789012',
      format: 'EAN-13',
      rawValue: '123456789012',
    });
  });

  it('rejects unsupported scan content', () => {
    expect(parseScanResult('not-a-barcode')).toBeNull();
    expect(validateBarcodeInput('1234')).toBeNull();
  });
});
