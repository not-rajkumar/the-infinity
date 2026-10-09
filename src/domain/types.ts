/**
 * Core domain types for the infinity bottle tracker.
 *
 * UNIT CONVENTIONS — read this before adding a field.
 *
 *   volumeMl   millilitres, always an integer. Never a float.
 *   abvBp      alcohol by volume in BASIS POINTS, always an integer.
 *              4200 === 42.00% ABV.  1000 === 10.00%.
 *   units      volumeMl * abvBp — "pure alcohol units". Dimensionless integer.
 *
 * Everything numeric in storage is an integer on purpose. Floats accumulate
 * error across hundreds of pours and produce ABV jitter that looks like a bug
 * but isn't. Keep the arithmetic integral until the moment you format.
 */

export type Iso8601 = string;

export type EventKind = 'ADD' | 'REMOVE';

/** How a source bottle's details got into the library. */
export type BottleSource = 'manual' | 'catalog' | 'barcode';

/** A source bottle — something that can be poured into the blend. */
export interface Bottle {
  id: string;
  blendId: string;
  name: string;
  distillery: string | null;
  /** e.g. 'Single Malt', 'Bourbon', 'Rye', 'Blended Scotch' */
  category: string | null;
  region: string | null;
  country: string | null;
  abvBp: number | null;
  /** Nominal bottle size, not remaining volume. */
  volumeMl: number | null;
  /** Remaining volume available to pour, when tracked. */
  remainingVolumeMl: number | null;
  barcode: string | null;
  photoUri: string | null;
  notes: string | null;
  source: BottleSource;
  createdAt: Iso8601;
}

/**
 * A single movement in or out of the blend. IMMUTABLE — append-only.
 *
 * You never UPDATE an event. To fix a mistake you append a compensating event.
 * This is what gives history, undo, and point-in-time ABV for free.
 */
export interface BlendEvent {
  id: string;
  blendId: string;
  kind: EventKind;
  /** Magnitude of the movement. Always positive; `kind` carries the direction. */
  volumeMl: number;
  /**
   * ADD  — the ABV of the source bottle being poured in.
   * REMOVE — the blend's ABV at the moment of the pour. This is a PROJECTION
   *          (see fold.ts), stored so the timeline can render without refolding.
   *          null if the blend was empty.
   */
  abvBp: number | null;
  sourceBottleId: string | null;
  note: string | null;
  occurredAt: Iso8601;
  createdAt: Iso8601;
  /** True for "a splash" / "a dram" — flagged in the UI so precision isn't faked. */
  isApproximate: boolean;
}

/** Derived blend state. Never store this as truth; always fold it from events. */
export interface BlendState {
  volumeMl: number;
  /** volumeMl * abvBp, summed across all contributing additions and removals. */
  units: number;
}

export interface Blend {
  id: string;
  name: string;
  vesselCapacityMl: number | null;
  startedAt: Iso8601;
  notes: string | null;
  archivedAt: Iso8601 | null;
}
