import { create } from 'zustand';

/** Which face of the home screen is showing (F1: Table is the default). */
interface HomeState {
  view: 'table' | 'journal';
  setView: (view: 'table' | 'journal') => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  view: 'table',
  setView: (view) => set({ view }),
}));
