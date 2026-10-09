import { create } from 'zustand';
import type { Bottle } from '../domain/types';
import type { PersistenceSnapshot } from '../db/persistence';
import { consumeBottleVolume, createBottle, deleteBottle, updateBottle } from '../db/persistence';

interface BottleStore {
  bottles: Bottle[];
  hydrate: (snapshot: PersistenceSnapshot) => void;
  addBottle: (bottle: Bottle) => Promise<void>;
  editBottle: (bottle: Bottle) => Promise<void>;
  removeBottle: (id: string) => Promise<void>;
  consumeVolume: (id: string, volumeMl: number) => Promise<void>;
}

export const useBottleStore = create<BottleStore>((set) => ({
  bottles: [],
  hydrate: (snapshot) => set({ bottles: snapshot.bottles }),
  addBottle: async (bottle) => {
    await createBottle(bottle);
    set((store) => ({ bottles: [...store.bottles, bottle] }));
  },
  editBottle: async (bottle) => {
    await updateBottle(bottle);
    set((store) => ({
      bottles: store.bottles.map((existing) => (existing.id === bottle.id ? bottle : existing)),
    }));
  },
  removeBottle: async (id) => {
    await deleteBottle(id);
    set((store) => ({ bottles: store.bottles.filter((bottle) => bottle.id !== id) }));
  },
  consumeVolume: async (id, volumeMl) => {
    const bottle = await consumeBottleVolume(id, volumeMl);
    if (bottle) {
      set((store) => ({
        bottles: store.bottles.map((existing) => (existing.id === id ? bottle : existing)),
      }));
    }
  },
}));
