import { create } from 'zustand';
import type { BlendEvent, EventKind } from '../domain/types';
import { fold, type FoldResult } from '../domain/fold';

interface EventStore {
  events: BlendEvent[];
  foldResult: FoldResult;
  setEvents: (events: BlendEvent[]) => void;
  addEvent: (event: BlendEvent) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  foldResult: fold([]),
  setEvents: (events) => {
    const foldResult = fold(events);
    set({ events, foldResult });
  },
  addEvent: (event) => {
    const events = [...get().events, event];
    const foldResult = fold(events);
    set({ events, foldResult });
  },
}));
