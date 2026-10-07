/**
 * Unit conversion and user-input parsing.
 *
 * All conversions land on integers (ml, basis points) because that's the
 * storage convention — see types.ts.
 */

/** US fluid ounce. Not the imperial (UK) ounce — they differ by ~4%. */
export const ML_PER_OZ = 29.5735295625;
export const ML_PER_CL = 10;
export const ML_PER_SHOT = 44; // a "standard" 1.5oz pour, rounded

/** Common pour sizes, for one-tap entry in the add flow. */
export const POUR_PRESETS_ML = {
  splash: 5,
  dash: 15,
  dram: 25,
  shot: 44,
  halfPint: 237,
  pint: 473,
} as const;

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

/** 4200 -> 42 */
export function bpToPercent(bp: number): number {
  return bp / 100;
}

/** 42 -> 4200 */
export function percentToBp(percent: number): number {
  return Math.round(percent * 100);
}

/** Human-readable ABV, or an em dash when the blend is empty. */
export function formatAbv(bp: number | null): string {
  return bp === null ? '—' : `${(bp / 100).toFixed(2)}%`;
}

export function formatVolume(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 2)} L`;
  return `${Math.round(ml)} ml`;
}

/**
 * Parse a free-typed volume. Accepts "750", "750ml", "1.5 oz", "1.5oz",
 * "0.75 l", "75cl". Returns null when it can't make sense of the input —
 * callers should show a validation message rather than guessing.
 *
 * Bare numbers are interpreted as ml, since that's the app's native unit.
 */
export function parseVolumeMl(input: string): number | null {
  const text = input.trim().toLowerCase();
  if (text === '') return null;

  const match = text.match(/^([0-9]*\.?[0-9]+)\s*([a-z]*)$/);
  if (!match) return null;

  const [, valueText = '', unit = ''] = match;
  const value = Number.parseFloat(valueText);
  if (!Number.isFinite(value) || value <= 0) return null;

  switch (unit) {
    case '':
    case 'ml':
    case 'milliliter':
    case 'millilitre':
      return Math.round(value);
    case 'oz':
    case 'floz':
      return ozToMl(value);
    case 'cl':
      return Math.round(value * ML_PER_CL);
    case 'l':
    case 'liter':
    case 'litre':
      return Math.round(value * 1000);
    default:
      return null;
  }
}

/**
 * Parse a free-typed ABV. Accepts "42", "42%", "42.5%", "0.425".
 *
 * Note the ambiguous case: a bare value <= 1 is read as a fraction (0.425 ->
 * 42.5%), because people type decimals that way. 42 is read as a percent.
 * Values above 100 are rejected — no whiskey is that strong.
 */
export function parseAbvBp(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/%$/, '');
  if (text === '') return null;

  const value = Number.parseFloat(text);
  if (!Number.isFinite(value) || value <= 0) return null;

  const percent = value <= 1 ? value * 100 : value;
  if (percent > 100) return null;

  return percentToBp(percent);
}
