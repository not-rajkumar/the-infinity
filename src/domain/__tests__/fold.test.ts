import { describe, expect, it } from 'vitest';

import { abvBp } from '../abv';
import { compareEvents, currentState, fold, projectionsMatch, stateAt } from '../fold';
import type { BlendEvent, EventKind } from '../types';

let seq = 0;
function ev(
  kind: EventKind,
  volumeMl: number,
  abvBpValue: number | null,
  occurredAt: string,
  overrides: Partial<BlendEvent> = {},
): BlendEvent {
  seq += 1;
  const suffix = String(seq).padStart(4, '0');
  return {
    id: `e${suffix}`,
    blendId: 'b1',
    kind,
    volumeMl,
    abvBp: abvBpValue,
    sourceBottleId: null,
    note: null,
    occurredAt,
    createdAt: occurredAt,
    isApproximate: false,
    ...overrides,
  };
}

describe('fold', () => {
  it('returns an empty state for an empty log', () => {
    const result = fold([]);
    expect(result.state).toEqual({ volumeMl: 0, units: 0 });
    expect(result.projections).toEqual([]);
    expect(result.problems).toEqual([]);
  });

  it('folds a realistic sequence', () => {
    const events = [
      ev('ADD', 700, 4000, '2026-01-01T10:00:00Z'),
      ev('REMOVE', 25, null, '2026-01-05T20:00:00Z'),
      ev('ADD', 50, 5800, '2026-01-06T10:00:00Z'),
    ];
    const { state, problems } = fold(events);
    expect(problems).toEqual([]);
    expect(state.volumeMl).toBe(725);
    expect(abvBp(state)).toBe(4124);
  });

  it('emits a projection after every applied event', () => {
    const events = [
      ev('ADD', 700, 4000, '2026-01-01T10:00:00Z'),
      ev('REMOVE', 200, null, '2026-01-02T10:00:00Z'),
    ];
    const { projections } = fold(events);
    expect(projections).toHaveLength(2);
    expect(projections[0]).toMatchObject({ volumeMl: 700, abvBp: 4000 });
    expect(projections[1]).toMatchObject({ volumeMl: 500, abvBp: 4000 });
  });

  it('orders by occurredAt regardless of array order', () => {
    const shuffled = [
      ev('REMOVE', 100, null, '2026-02-01T10:00:00Z'),
      ev('ADD', 700, 4000, '2026-01-01T10:00:00Z'),
    ];
    expect(currentState(shuffled).volumeMl).toBe(600);
  });

  it('is deterministic when timestamps tie', () => {
    const t = '2026-01-01T10:00:00Z';
    const a = ev('ADD', 700, 4000, t, { id: 'aaa', createdAt: t });
    const b = ev('REMOVE', 100, null, t, { id: 'bbb', createdAt: t });
    expect(currentState([b, a])).toEqual(currentState([a, b]));
    expect(compareEvents(a, b)).toBeLessThan(0);
  });

  describe('bad data is reported, never thrown', () => {
    it('skips a non-positive volume', () => {
      const { state, problems } = fold([ev('ADD', 0, 4000, '2026-01-01T10:00:00Z')]);
      expect(state.volumeMl).toBe(0);
      expect(problems).toHaveLength(1);
      expect(problems[0].code).toBe('NON_POSITIVE_VOLUME');
    });

    it('skips an addition with no ABV recorded', () => {
      const { state, problems } = fold([ev('ADD', 700, null, '2026-01-01T10:00:00Z')]);
      expect(state.volumeMl).toBe(0);
      expect(problems[0].code).toBe('MISSING_ABV');
    });

    it('skips a pour from an empty vessel', () => {
      const { state, problems } = fold([ev('REMOVE', 50, null, '2026-01-01T10:00:00Z')]);
      expect(state.volumeMl).toBe(0);
      expect(problems[0].code).toBe('REMOVE_FROM_EMPTY');
    });

    it('clamps an oversized pour instead of driving volume negative', () => {
      const t1 = '2026-01-01T10:00:00Z';
      const t2 = '2026-01-02T10:00:00Z';
      const { state, problems } = fold([ev('ADD', 600, 4000, t1), ev('REMOVE', 750, null, t2)]);
      expect(state.volumeMl).toBe(0);
      expect(state.units).toBe(0);
      expect(abvBp(state)).toBeNull();
      expect(problems[0].code).toBe('REMOVE_EXCEEDS_VOLUME');
    });

    it('keeps folding good events after a bad one', () => {
      const events = [
        ev('ADD', 0, 4000, '2026-01-01T10:00:00Z'),
        ev('ADD', 700, 4000, '2026-01-02T10:00:00Z'),
      ];
      const { state, problems } = fold(events);
      expect(state.volumeMl).toBe(700);
      expect(problems).toHaveLength(1);
    });
  });

  it('never produces a float in the stored state', () => {
    const events = [
      ev('ADD', 750, 4317, '2026-01-01T10:00:00Z'),
      ev('REMOVE', 33, null, '2026-01-02T10:00:00Z'),
      ev('ADD', 47, 5823, '2026-01-03T10:00:00Z'),
      ev('REMOVE', 61, null, '2026-01-04T10:00:00Z'),
    ];
    const { state } = fold(events);
    expect(Number.isInteger(state.volumeMl)).toBe(true);
    expect(Number.isInteger(state.units)).toBe(true);
  });
});

describe('stateAt', () => {
  const events = [
    ev('ADD', 700, 4000, '2026-01-01T10:00:00Z'),
    ev('ADD', 50, 5800, '2026-03-01T10:00:00Z'),
  ];

  it('reconstructs a past state — "what was my ABV in March?"', () => {
    const february = stateAt(events, '2026-02-01T00:00:00Z');
    expect(february.volumeMl).toBe(700);
    expect(abvBp(february)).toBe(4000);

    const march = stateAt(events, '2026-03-15T00:00:00Z');
    expect(march.volumeMl).toBe(750);
    expect(abvBp(march)).toBe(4120);
  });

  it('accepts a Date', () => {
    expect(stateAt(events, new Date('2026-02-01T00:00:00Z')).volumeMl).toBe(700);
  });
});

describe('projectionsMatch', () => {
  it('confirms cached projections still agree with a fresh fold', () => {
    const events = [
      ev('ADD', 700, 4000, '2026-01-01T10:00:00Z'),
      ev('REMOVE', 25, null, '2026-01-02T10:00:00Z'),
    ];
    const first = fold(events).projections;
    const second = fold(events).projections;
    expect(projectionsMatch(first, second)).toBe(true);
  });

  it('detects drift between cached and recomputed projections', () => {
    const events = [ev('ADD', 700, 4000, '2026-01-01T10:00:00Z')];
    const cached = fold(events).projections;
    if (cached.length === 0) throw new Error('expected one projection');
    const first = cached[0];
    if (first === undefined) throw new Error('expected one projection');
    const tampered = [{ ...first, volumeMl: 999 }];
    expect(projectionsMatch(tampered, cached)).toBe(false);
  });
});
