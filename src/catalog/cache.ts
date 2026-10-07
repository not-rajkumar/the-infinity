/**
 * Catalog local LRU cache.
 * Keys: barcode (EAN/UPC) or normalized name.
 * TTL-based eviction + max-size eviction.
 */
import { eq } from 'drizzle-orm';
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
    const data = JSON.parse(row.dataJson) as CatalogEntry & { cachedAt: string };
    if (Date.now() - new Date(data.cachedAt).getTime() > TTL_MS) {
      db.delete(catalogCache).where(eq(catalogCache.barcode, barcode)).run();
      return null;
    }
    return data;
  }

  set(entry: CatalogEntry): void {
    this.evictIfNeeded();
    db.insert(catalogCache).values({
      barcode: entry.barcode,
      dataJson: JSON.stringify(entry),
      cachedAt: new Date().toISOString(),
    }).run();
  }

  private evictIfNeeded(): void {
    const rows = db.select().from(catalogCache).all();
    const count = rows.length;
    if (count >= MAX_CACHED) {
      const oldest = db.select().from(catalogCache).orderBy(catalogCache.cachedAt).limit(1).get();
      if (oldest) db.delete(catalogCache).where(eq(catalogCache.barcode, oldest.barcode)).run();
    }
  }
}
