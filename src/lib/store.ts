import { create } from 'zustand';

export interface HistoryEntry {
  id: string;
  type: 'detection' | 'humanize' | 'similarity';
  timestamp: number;
  input: string;
  inputB?: string;
  result: any;
}

interface AppState {
  hasOnboarded: boolean;
  darkMode: boolean;
  history: HistoryEntry[];
  setOnboarded: () => void;
  toggleDarkMode: () => void;
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const loadState = () => {
  try {
    const onboarded = localStorage.getItem('syntax-onboarded') === 'true';
    const dark = localStorage.getItem('syntax-dark') === 'true';
    const history = JSON.parse(localStorage.getItem('syntax-history') || '[]');
    return { hasOnboarded: onboarded, darkMode: dark, history };
  } catch {
    return { hasOnboarded: false, darkMode: false, history: [] };
  }
};

const initial = loadState();

export const useAppStore = create<AppState>((set) => ({
  hasOnboarded: initial.hasOnboarded,
  darkMode: initial.darkMode,
  history: initial.history,
  setOnboarded: () => {
    localStorage.setItem('syntax-onboarded', 'true');
    set({ hasOnboarded: true });
  },
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      localStorage.setItem('syntax-dark', String(next));
      document.documentElement.classList.toggle('dark', next);
      return { darkMode: next };
    }),
  addHistory: (entry) =>
    set((s) => {
      const newEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() };
      const updated = [newEntry, ...s.history].slice(0, 50);
      localStorage.setItem('syntax-history', JSON.stringify(updated));
      return { history: updated };
    }),
  clearHistory: () => {
    localStorage.setItem('syntax-history', '[]');
    set({ history: [] });
  },
}));
