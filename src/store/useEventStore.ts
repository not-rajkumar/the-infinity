import { create } from 'zustand';
import type { BlendEvent } from '../domain/types';
import { fold, type FoldResult } from '../domain/fold';
import { appendBlendEvent } from '../db/persistence';

interface EventStore {
  events: BlendEvent[];
  foldResult: FoldResult;
  setEvents: (events: BlendEvent[]) => void;
  addEvent: (event: BlendEvent) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  foldResult: fold([]),
  setEvents: (events) => {
    const foldResult = fold(events);
    set({ events, foldResult });
  },
  addEvent: async (event) => {
    await appendBlendEvent(event);
    const events = [...get().events, event];
    const foldResult = fold(events);
    set({ events, foldResult });
  },
}));
