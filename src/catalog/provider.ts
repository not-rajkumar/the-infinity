import type { CatalogEntry } from './cache';

export interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  origins?: string;
  countries?: string;
  alcohol_100g?: number;
  quantity?: string;
  image_front_small_url?: string;
}

export function parseCatalogVolume(quantity: string | undefined): number | null {
  if (!quantity) return null;
  const match = quantity.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(ml|cl|l)\b/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const millilitres = unit === 'l' ? amount * 1000 : unit === 'cl' ? amount * 10 : amount;
  return Number.isInteger(millilitres) && millilitres > 0 ? millilitres : null;
}

export function mapOpenFoodFactsProduct(product: OpenFoodFactsProduct, fallbackBarcode: string): CatalogEntry | null {
  const name = product.product_name?.trim();
  if (!name) return null;
  const categoryTag = product.categories_tags?.find((tag) => tag.startsWith('en:'));
  const alcohol = typeof product.alcohol_100g === 'number' ? product.alcohol_100g : null;
  return {
    barcode: product.code?.match(/^\d{8,13}$/)?.[0] ?? fallbackBarcode,
    name,
    distillery: product.brands?.split(',')[0]?.trim() || null,
    category: categoryTag ? categoryTag.slice(3).replaceAll('-', ' ') : null,
    region: product.origins?.trim() || null,
    country: product.countries?.split(',')[0]?.trim() || null,
    abvBp: alcohol !== null && alcohol >= 0 && alcohol <= 100 ? Math.round(alcohol * 100) : null,
    volumeMl: parseCatalogVolume(product.quantity),
    photoUrl: product.image_front_small_url ?? null,
  };
}
