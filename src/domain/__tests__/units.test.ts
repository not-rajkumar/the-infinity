import { describe, expect, it } from 'vitest';

import { bpToPercent, formatAbv, formatVolume, mlToOz, ozToMl, parseAbvBp, parseVolumeMl, percentToBp } from '../units';

describe('conversions', () => {
  it('round-trips basis points and percent', () => {
    expect(bpToPercent(4200)).toBe(42);
    expect(percentToBp(42)).toBe(4200);
    expect(percentToBp(42.5)).toBe(4250);
  });

  it('converts fluid ounces to whole millilitres', () => {
    expect(ozToMl(1.5)).toBe(44);
    expect(ozToMl(25.4)).toBe(751);
    expect(Number.isInteger(ozToMl(1.7))).toBe(true);
  });

  it('converts back to ounces as a float', () => {
    expect(mlToOz(29.5735295625)).toBeCloseTo(1, 10);
  });
});

describe('formatAbv', () => {
  it('shows two decimals', () => {
    expect(formatAbv(4124)).toBe('41.24%');
    expect(formatAbv(4000)).toBe('40.00%');
  });

  it('shows an em dash rather than NaN for an empty vessel', () => {
    expect(formatAbv(null)).toBe('—');
  });
});

describe('formatVolume', () => {
  it('uses ml below a litre and L at or above', () => {
    expect(formatVolume(750)).toBe('750 ml');
    expect(formatVolume(2000)).toBe('2 L');
    expect(formatVolume(1500)).toBe('1.50 L');
  });
});

describe('parseVolumeMl', () => {
  it('reads bare numbers as millilitres', () => {
    expect(parseVolumeMl('750')).toBe(750);
    expect(parseVolumeMl('  750  ')).toBe(750);
  });

  it('reads explicit units', () => {
    expect(parseVolumeMl('750ml')).toBe(750);
    expect(parseVolumeMl('750 ml')).toBe(750);
    expect(parseVolumeMl('0.75 l')).toBe(750);
    expect(parseVolumeMl('75cl')).toBe(750);
    expect(parseVolumeMl('1.5 oz')).toBe(44);
    expect(parseVolumeMl('1.5oz')).toBe(44);
  });

  it('always returns an integer', () => {
    const result = parseVolumeMl('1.7 oz');
    expect(result).not.toBeNull();
    expect(Number.isInteger(result)).toBe(true);
  });

  it('rejects nonsense rather than guessing', () => {
    expect(parseVolumeMl('')).toBeNull();
    expect(parseVolumeMl('abc')).toBeNull();
    expect(parseVolumeMl('0')).toBeNull();
    expect(parseVolumeMl('-750')).toBeNull();
    expect(parseVolumeMl('750 gallons')).toBeNull();
    expect(parseVolumeMl('7 5 0')).toBeNull();
  });
});

describe('parseAbvBp', () => {
  it('reads a percent, with or without the sign', () => {
    expect(parseAbvBp('42')).toBe(4200);
    expect(parseAbvBp('42%')).toBe(4200);
    expect(parseAbvBp('42.5%')).toBe(4250);
  });

  it('reads a bare decimal as a fraction', () => {
    expect(parseAbvBp('0.425')).toBe(4250);
    expect(parseAbvBp('0.4')).toBe(4000);
  });

  it('reads exactly 1 as 100%', () => {
    expect(parseAbvBp('1')).toBe(10000);
    expect(parseAbvBp('100%')).toBe(10000);
  });

  it('rejects impossible strengths and nonsense', () => {
    expect(parseAbvBp('')).toBeNull();
    expect(parseAbvBp('101%')).toBeNull();
    expect(parseAbvBp('abc')).toBeNull();
    expect(parseAbvBp('0')).toBeNull();
    expect(parseAbvBp('-42')).toBeNull();
  });
});
