import type { CatalogEntry } from './cache';
import { CatalogCache } from './cache';
import { parseBarcode } from './parse';
import { mapOpenFoodFactsProduct, type OpenFoodFactsProduct } from './provider';

const API_ROOT = 'https://world.openfoodfacts.org';
const cache = new CatalogCache();

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
  products?: OpenFoodFactsProduct[];
}

async function request(path: string): Promise<OpenFoodFactsResponse> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Catalog provider returned HTTP ${response.status}.`);
  return response.json() as Promise<OpenFoodFactsResponse>;
}

export async function lookupBarcode(barcode: string): Promise<CatalogEntry | null> {
  const normalized = parseBarcode(barcode);
  if (!normalized) return null;
  const cached = cache.get(normalized);
  if (cached) return cached;
  const payload = await request(`/api/v2/product/${encodeURIComponent(normalized)}.json`);
  if (payload.status !== 1 || !payload.product) return null;
  const entry = mapOpenFoodFactsProduct(payload.product, normalized);
  if (entry) cache.set(entry);
  return entry;
}

export async function searchByName(name: string): Promise<CatalogEntry[]> {
  const query = name.trim();
  if (!query) return [];
  const payload = await request(
    `/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`,
  );
  return (payload.products ?? []).flatMap((product) => {
    const barcode = product.code?.match(/^\d{8,13}$/)?.[0];
    const entry = barcode ? mapOpenFoodFactsProduct(product, barcode) : null;
    if (entry) cache.set(entry);
    return entry ? [entry] : [];
  });
}