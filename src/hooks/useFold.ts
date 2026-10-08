import { useMemo } from 'react';
import { fold, type FoldResult } from '../domain/fold';
import type { BlendEvent } from '../domain/types';

export function useFold(events: readonly BlendEvent[]): FoldResult {
  return useMemo(() => fold(events), [events]);
}
