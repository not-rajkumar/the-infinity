import { describe, expect, it } from 'vitest';
import { mapOpenFoodFactsProduct, parseCatalogVolume } from '../provider';

describe('catalog provider mapping', () => {
  it('maps product fields into the integer app units', () => {
    const entry = mapOpenFoodFactsProduct({
      code: '0123456789012',
      product_name: 'House Bourbon',
      brands: 'Example Distillery, Other',
      categories_tags: ['en:bourbons'],
      origins: 'Kentucky',
      countries: 'United States',
      alcohol_100g: 46,
      quantity: '750 ml',
      image_front_small_url: 'https://example.test/bottle.jpg',
    }, '0123456789012');

    expect(entry).toEqual({
      barcode: '0123456789012',
      name: 'House Bourbon',
      distillery: 'Example Distillery',
      category: 'bourbons',
      region: 'Kentucky',
      country: 'United States',
      abvBp: 4600,
      volumeMl: 750,
      photoUrl: 'https://example.test/bottle.jpg',
    });
  });

  it('rejects products without a usable name and parses common volumes', () => {
    expect(mapOpenFoodFactsProduct({}, '0123456789012')).toBeNull();
    expect(parseCatalogVolume('1.5 L')).toBe(1500);
    expect(parseCatalogVolume('70cl')).toBe(700);
    expect(parseCatalogVolume('unknown')).toBeNull();
  });
});
