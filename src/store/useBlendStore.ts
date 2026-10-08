import { create } from 'zustand';
import type { Blend, BlendState } from '../domain/types';
import { emptyState } from '../domain/abv';

interface BlendStore {
  activeBlendId: string | null;
  activeBlend: Blend | null;
  state: BlendState;
  setActiveBlend: (blend: Blend | null, state?: BlendState) => void;
  setState: (state: BlendState) => void;
}

export const useBlendStore = create<BlendStore>((set) => ({
  activeBlendId: null,
  activeBlend: null,
  state: emptyState(),
  setActiveBlend: (blend, state) =>
    set({
      activeBlend: blend,
      activeBlendId: blend ? blend.id : null,
      state: state ?? emptyState(),
    }),
  setState: (state) => set({ state }),
}));
