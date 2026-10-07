/**
 * The ABV math. This is the heart of the app — get it right and everything
 * else is presentation.
 *
 * MODEL: track two integers.
 *
 *   volumeMl  total liquid in the vessel
 *   units     total pure alcohol, as volumeMl * abvBp
 *
 * Current ABV is derived, never stored: units / volumeMl.
 *
 * THE SUBTLE PART — removals. A pour does NOT take alcohol out at the source
 * bottle's ABV. It takes it out at the blend's CURRENT ABV, because the vessel
 * is homogeneous. A 30ml pour from a 46% blend removes 30ml at 46%, not at
 * whatever went in first. Getting this wrong makes an infinity bottle appear to
 * hold its ABV forever, which is exactly the drift the app exists to show.
 *
 * APPROXIMATION NOTE: volume-weighted averaging ignores ethanol/water volume
 * contraction on mixing (500ml water + 500ml pure ethanol yields ~963ml, not
 * 1000ml). True ABV therefore sits slightly ABOVE this estimate. At whiskey
 * strength the error is well under 1% ABV, which is inside the noise of
 * "how much did I actually pour". A mass-and-density-table mode is the v2 fix
 * if it ever matters.
 *
 * Purity: this module imports nothing. No React, no DB, no Expo, no network.
 * Keep it that way — it's what makes the math testable in milliseconds.
 */

import type { BlendState } from './types';

export function emptyState(): BlendState {
  return { volumeMl: 0, units: 0 };
}

/** Current ABV in basis points, or null when the vessel is empty. */
export function abvBp(state: BlendState): number | null {
  if (state.volumeMl <= 0) return null;
  return Math.round(state.units / state.volumeMl);
}

/** Fraction of the vessel's capacity currently filled, clamped to [0, 1]. */
export function fillFraction(state: BlendState, capacityMl: number | null): number | null {
  if (capacityMl === null || capacityMl <= 0) return null;
  return Math.min(1, Math.max(0, state.volumeMl / capacityMl));
}

/**
 * Pour `volumeMl` at `abvBp` into the blend.
 *
 * @param volumeMl  must be > 0
 * @param sourceAbvBp  ABV of the bottle being poured, in basis points
 */
export function add(state: BlendState, volumeMl: number, sourceAbvBp: number): BlendState {
  if (volumeMl <= 0) throw new RangeError(`add(): volumeMl must be > 0, got ${volumeMl}`);
  if (sourceAbvBp < 0) throw new RangeError(`add(): abvBp must be >= 0, got ${sourceAbvBp}`);

  return {
    volumeMl: state.volumeMl + volumeMl,
    units: state.units + volumeMl * sourceAbvBp,
  };
}

/**
 * Remove `volumeMl` from the blend, at the blend's current ABV.
 *
 * @param volumeMl  must be > 0. Must not exceed the current volume — callers
 *                  that can't guarantee that should use `fold()`, which clamps
 *                  and reports instead of throwing.
 */
export function remove(state: BlendState, volumeMl: number): BlendState {
  if (volumeMl <= 0) throw new RangeError(`remove(): volumeMl must be > 0, got ${volumeMl}`);
  if (state.volumeMl <= 0) throw new RangeError('remove(): cannot pour from an empty vessel');
  if (volumeMl > state.volumeMl) {
    throw new RangeError(
      `remove(): cannot pour ${volumeMl}ml from ${state.volumeMl}ml`,
    );
  }

  return {
    volumeMl: state.volumeMl - volumeMl,
    units: state.units - removedUnits(state, volumeMl),
  };
}

/**
 * Pure alcohol carried away by a pour of `volumeMl` at the blend's current ABV.
 * Rounded to keep `units` integral.
 */
export function removedUnits(state: BlendState, volumeMl: number): number {
  if (state.volumeMl <= 0) return 0;
  return Math.round((volumeMl * state.units) / state.volumeMl);
}

/**
 * Volume-weighted average ABV of a proposed set of additions, without mutating
 * anything. Used to preview "what will this do to my bottle?" before the user
 * commits to the pour.
 */
export function previewAdd(
  state: BlendState,
  volumeMl: number,
  sourceAbvBp: number,
): { before: number | null; after: number | null; deltaBp: number } {
  const before = abvBp(state);
  const after = abvBp(add(state, volumeMl, sourceAbvBp));
  return {
    before,
    after,
    deltaBp: before === null || after === null ? 0 : after - before,
  };
}
