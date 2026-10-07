/**
 * Catalog lookup — stub for real API calls (Difford's Guide, WhiskyBase, etc.).
 * Returns null when not found (cache miss + API miss = manual entry).
 * Never throws: errors are logged, not surfaced to the UI.
 *
 * This is a placeholder for real external catalog services.
 * Replace with actual API client in Phase 3 (dev build).
 */
import type { CatalogEntry } from './cache';

export async function lookupBarcode(barcode: string): Promise<CatalogEntry | null> {
  // Placeholder: real implementation would call Difford's Guide API, WhiskyBase, etc.
  console.log(`[catalog] lookup barcode ${barcode} (stub)`);
  return null;
}

export async function searchByName(name: string): Promise<CatalogEntry[]> {
  console.log(`[catalog] search "${name}" (stub)`);
  return [];
}