/**
 * Fold an event log into derived state.
 *
 * This is the single source of truth for "what is in the bottle right now".
 * Every read path goes through here, which is why the drift chart, the
 * timeline, and the current-ABV readout can never disagree with each other.
 *
 * Two jobs:
 *   1. Compute the current state.
 *   2. Compute the per-event projections (volume/ABV immediately after each
 *      event), which the drift chart needs and which get cached in the DB so
 *      the chart doesn't have to refold on every render.
 *
 * BAD DATA: fold() never throws. Real logs contain "poured 750ml from a bottle
 * holding 600ml" — a typo, not a crash. It clamps, records a problem, and
 * carries on, so the UI can show a warning banner instead of a white screen.
 *
 * Purity: imports only from ./abv and ./types. No React, no DB, no Expo.
 */

import { add, emptyState, remove } from './abv';
import type { BlendEvent, BlendState, Iso8601 } from './types';

export interface FoldProjection {
  eventId: string;
  volumeMl: number;
  units: number;
  abvBp: number | null;
}

export type FoldProblemCode =
  | 'NON_POSITIVE_VOLUME'
  | 'MISSING_ABV'
  | 'REMOVE_FROM_EMPTY'
  | 'REMOVE_EXCEEDS_VOLUME';

export interface FoldProblem {
  eventId: string;
  code: FoldProblemCode;
  detail: string;
}

export interface FoldResult {
  state: BlendState;
  projections: FoldProjection[];
  problems: FoldProblem[];
}

/**
 * Canonical ordering. Not just occurredAt — two pours can share a timestamp
 * (same evening, logged together), and the fold must still be deterministic.
 * Ties break on createdAt, then id, so the same log always folds identically.
 */
export function compareEvents(a: BlendEvent, b: BlendEvent): number {
  if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

export function fold(events: readonly BlendEvent[]): FoldResult {
  const ordered = [...events].sort(compareEvents);

  let state = emptyState();
  const projections: FoldProjection[] = [];
  const problems: FoldProblem[] = [];

  for (const event of ordered) {
    if (event.volumeMl <= 0) {
      problems.push({
        eventId: event.id,
        code: 'NON_POSITIVE_VOLUME',
        detail: `Ignored event with volume ${event.volumeMl}ml.`,
      });
      continue;
    }

    if (event.kind === 'ADD') {
      if (event.abvBp === null) {
        problems.push({
          eventId: event.id,
          code: 'MISSING_ABV',
          detail: `Skipped addition of ${event.volumeMl}ml — no ABV recorded.`,
        });
        continue;
      }
      state = add(state, event.volumeMl, event.abvBp);
    } else {
      if (state.volumeMl <= 0) {
        problems.push({
          eventId: event.id,
          code: 'REMOVE_FROM_EMPTY',
          detail: `Skipped pour of ${event.volumeMl}ml — the bottle was already empty.`,
        });
        continue;
      }
      if (event.volumeMl > state.volumeMl) {
        problems.push({
          eventId: event.id,
          code: 'REMOVE_EXCEEDS_VOLUME',
          detail:
            `Pour of ${event.volumeMl}ml clamped to the ${state.volumeMl}ml available.`,
        });
        state = remove(state, state.volumeMl); // drain it; the vessel can't go negative
      } else {
        state = remove(state, event.volumeMl);
      }
    }

    projections.push({
      eventId: event.id,
      volumeMl: state.volumeMl,
      units: state.units,
      abvBp: state.volumeMl > 0 ? Math.round(state.units / state.volumeMl) : null,
    });
  }

  return { state, projections, problems };
}

/** Convenience: just the current state, when you don't need projections. */
export function currentState(events: readonly BlendEvent[]): BlendState {
  return fold(events).state;
}

/**
 * State as it stood at the end of a given instant. Powers "what was my ABV in
 * March?" without a separate history table.
 */
export function stateAt(events: readonly BlendEvent[], at: Iso8601 | Date): BlendState {
  const cutoff = at instanceof Date ? at.toISOString() : at;
  return currentState(events.filter((e) => e.occurredAt <= cutoff));
}

/**
 * Verify cached projections in the DB still match a fresh fold. Called on
 * write, and in tests. See ARCHITECTURE.md § "Why projections are cached".
 */
export function projectionsMatch(
  cached: readonly FoldProjection[],
  fresh: readonly FoldProjection[],
): boolean {
  if (cached.length !== fresh.length) return false;
  return cached.every((c, i) => {
    const f = fresh[i];
    if (f === undefined) return false;
    return (
      c.eventId === f.eventId &&
      c.volumeMl === f.volumeMl &&
      c.units === f.units &&
      c.abvBp === f.abvBp
    );
  });
}
