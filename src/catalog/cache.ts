/**
 * Catalog local LRU cache.
 * Keys: barcode (EAN/UPC) or normalized name.
 * TTL-based eviction + max-size eviction.
 */
import { asc, eq } from 'drizzle-orm';
import { catalogCache } from '../db/schema';
import { db } from '../db';

export interface CatalogEntry {
  barcode: string;
  name: string;
  distillery: string | null;
  category: string | null;
  region: string | null;
  country: string | null;
  abvBp: number | null;
  volumeMl: number | null;
  photoUrl: string | null;
}

const MAX_CACHED = 200;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class CatalogCache {
  get(barcode: string): CatalogEntry | null {
    const row = db.select().from(catalogCache).where(eq(catalogCache.barcode, barcode)).get() ?? null;
    if (!row) return null;
    if (Date.now() - new Date(row.cachedAt).getTime() > TTL_MS) {
      db.delete(catalogCache).where(eq(catalogCache.barcode, barcode)).run();
      return null;
    }
    return JSON.parse(row.dataJson) as CatalogEntry;
  }

  set(entry: CatalogEntry): void {
    db.delete(catalogCache).where(eq(catalogCache.barcode, entry.barcode)).run();
    db.insert(catalogCache).values({
      barcode: entry.barcode,
      dataJson: JSON.stringify(entry),
      cachedAt: new Date().toISOString(),
    }).run();
    this.evictIfNeeded();
  }

  private evictIfNeeded(): void {
    const rows = db.select().from(catalogCache).orderBy(asc(catalogCache.cachedAt)).all();
    while (rows.length > MAX_CACHED) {
      const oldest = rows.shift();
      if (oldest) db.delete(catalogCache).where(eq(catalogCache.barcode, oldest.barcode)).run();
    }
  }
}
