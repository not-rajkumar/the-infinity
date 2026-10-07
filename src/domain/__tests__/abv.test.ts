import { describe, expect, it } from 'vitest';

import { abvBp, add, emptyState, fillFraction, previewAdd, remove, removedUnits } from '../abv';

describe('abvBp', () => {
  it('is null when the vessel is empty', () => {
    expect(abvBp(emptyState())).toBeNull();
  });

  it('is the units/volume ratio, rounded to whole basis points', () => {
    expect(abvBp({ volumeMl: 750, units: 750 * 4200 })).toBe(4200);
  });

  it('survives a non-terminating ratio without producing a float', () => {
    const state = add(add(emptyState(), 1000, 4000), 1, 6000);
    const result = abvBp(state);
    expect(result).toBe(4002);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('add', () => {
  it('accumulates volume and pure alcohol', () => {
    const state = add(emptyState(), 750, 4200);
    expect(state).toEqual({ volumeMl: 750, units: 750 * 4200 });
  });

  it('blends two components by volume-weighted average', () => {
    // 500ml @ 40% + 500ml @ 50% -> 45%
    const state = add(add(emptyState(), 500, 4000), 500, 5000);
    expect(abvBp(state)).toBe(4500);
  });

  it('weights a small pour proportionally, not equally', () => {
    // 700ml @ 43% + 50ml @ 60% -> (3,010,000 + 300,000)/750 = 44.13%
    const state = add(add(emptyState(), 700, 4300), 50, 6000);
    expect(abvBp(state)).toBe(4413);
  });

  it('accepts a 0% addition (e.g. water)', () => {
    const state = add(add(emptyState(), 100, 4000), 100, 0);
    expect(abvBp(state)).toBe(2000);
  });

  it('rejects non-positive volume and negative ABV', () => {
    expect(() => add(emptyState(), 0, 4000)).toThrow(RangeError);
    expect(() => add(emptyState(), -1, 4000)).toThrow(RangeError);
    expect(() => add(emptyState(), 100, -1)).toThrow(RangeError);
  });
});

describe('remove — the subtle one', () => {
  it('leaves ABV unchanged when pouring from a homogeneous blend', () => {
    const state = add(emptyState(), 750, 4600);
    const after = remove(state, 30);
    expect(abvBp(after)).toBe(4600);
    expect(after.volumeMl).toBe(720);
  });

  it('does NOT remove alcohol at the source ABV of the last addition', () => {
    // Add 700ml @ 40%, then 50ml @ 60% -> (2,800,000 + 300,000)/750 = 41.33%.
    // A naive implementation subtracting at the last addition's 60% would
    // instead show a dramatic drop. The blend is homogeneous; it must not.
    const state = add(add(emptyState(), 700, 4000), 50, 6000);
    const before = abvBp(state);
    const after = remove(state, 100);
    expect(before).toBe(4133);
    expect(abvBp(after)).toBe(4133);
  });

  it('drains to an empty vessel without going negative or NaN', () => {
    const state = add(emptyState(), 750, 4200);
    const after = remove(state, 750);
    expect(after.volumeMl).toBe(0);
    expect(after.units).toBe(0);
    expect(abvBp(after)).toBeNull();
  });

  it('rejects pouring more than is present, and pouring from empty', () => {
    const state = add(emptyState(), 100, 4000);
    expect(() => remove(state, 101)).toThrow(RangeError);
    expect(() => remove(emptyState(), 10)).toThrow(RangeError);
    expect(() => remove(state, 0)).toThrow(RangeError);
  });

  it('removedUnits is zero for an empty vessel', () => {
    expect(removedUnits(emptyState(), 50)).toBe(0);
  });

  it('conserves ABV across add/remove round trips within a rounding unit', () => {
    let state = add(emptyState(), 700, 4400);
    for (let i = 0; i < 50; i++) {
      state = remove(state, 10);
    }
    expect(state.volumeMl).toBe(200);
    expect(abvBp(state)).toBe(4400);
  });
});

describe('the drift scenario — the reason the app exists', () => {
  it('models a real infinity bottle drifting down as it is drunk from', () => {
    let state = add(emptyState(), 700, 4000);
    state = remove(state, 25);
    expect(state.volumeMl).toBe(675);
    expect(abvBp(state)).toBe(4000);

    state = add(state, 50, 5800);
    expect(state.volumeMl).toBe(725);
    expect(abvBp(state)).toBe(4124);

    state = remove(state, 100);
    expect(state.volumeMl).toBe(625);
    expect(abvBp(state)).toBe(4124);
  });
});

describe('previewAdd', () => {
  it('reports the delta a proposed pour would cause, without committing it', () => {
    const state = add(emptyState(), 700, 4000);
    const preview = previewAdd(state, 50, 5800);
    expect(preview.before).toBe(4000);
    expect(preview.after).toBe(4120);
    expect(preview.deltaBp).toBe(120);
    expect(state.volumeMl).toBe(700);
  });

  it('handles adding to an empty vessel (before is null)', () => {
    const preview = previewAdd(emptyState(), 750, 4200);
    expect(preview.before).toBeNull();
    expect(preview.after).toBe(4200);
    expect(preview.deltaBp).toBe(0);
  });
});

describe('fillFraction', () => {
  it('is null without a capacity', () => {
    expect(fillFraction(add(emptyState(), 100, 4000), null)).toBeNull();
    expect(fillFraction(add(emptyState(), 100, 4000), 0)).toBeNull();
  });

  it('is the volume/capacity ratio', () => {
    expect(fillFraction(add(emptyState(), 500, 4000), 1000)).toBe(0.5);
  });

  it('clamps an overfilled vessel to 1', () => {
    expect(fillFraction(add(emptyState(), 1200, 4000), 1000)).toBe(1);
  });
});
