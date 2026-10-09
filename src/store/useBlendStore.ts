import { create } from 'zustand';
import type { Blend, BlendState } from '../domain/types';
import { emptyState } from '../domain/abv';
import type { PersistenceSnapshot } from '../db/persistence';
import { createBlend } from '../db/persistence';

interface BlendStore {
  activeBlendId: string | null;
  activeBlend: Blend | null;
  state: BlendState;
  hydrated: boolean;
  setActiveBlend: (blend: Blend | null, state?: BlendState) => void;
  setState: (state: BlendState) => void;
  hydrate: (snapshot: PersistenceSnapshot) => void;
  createActiveBlend: (blend: Blend) => Promise<void>;
}

export const useBlendStore = create<BlendStore>((set) => ({
  activeBlendId: null,
  activeBlend: null,
  state: emptyState(),
  hydrated: false,
  setActiveBlend: (blend, state) =>
    set({
      activeBlend: blend,
      activeBlendId: blend ? blend.id : null,
      state: state ?? emptyState(),
    }),
  setState: (state) => set({ state }),
  createActiveBlend: async (blend) => {
    await createBlend(blend);
    set({ activeBlend: blend, activeBlendId: blend.id, state: emptyState() });
  },
  hydrate: (snapshot) => {
    const activeBlend = snapshot.blends[0] ?? null;
    set({
      activeBlend,
      activeBlendId: activeBlend?.id ?? null,
      state: emptyState(),
      hydrated: true,
    });
  },
}));
