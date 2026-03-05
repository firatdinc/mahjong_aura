import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@mahjong_aura/settings';

interface SettingsStore {
  // Mahjong
  autoDraw: boolean;
  setAutoDraw: (val: boolean) => void;
  // Tile Match
  tmRelaxedMode: boolean;
  setTmRelaxedMode: (val: boolean) => void;
  // Trash Okey
  toHighlightSlots: boolean;
  setToHighlightSlots: (val: boolean) => void;
  // Column Push
  cpShowPreview: boolean;
  setCpShowPreview: (val: boolean) => void;
}

function persist(state: Partial<SettingsStore>) {
  const {autoDraw, tmRelaxedMode, toHighlightSlots, cpShowPreview} =
    useSettings.getState();
  const merged = {autoDraw, tmRelaxedMode, toHighlightSlots, cpShowPreview, ...state};
  AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      autoDraw: merged.autoDraw,
      tmRelaxedMode: merged.tmRelaxedMode,
      toHighlightSlots: merged.toHighlightSlots,
      cpShowPreview: merged.cpShowPreview,
    }),
  ).catch(() => {});
}

export const useSettings = create<SettingsStore>(set => ({
  autoDraw: true,
  setAutoDraw: (val: boolean) => {
    set({autoDraw: val});
    persist({autoDraw: val});
  },
  tmRelaxedMode: false,
  setTmRelaxedMode: (val: boolean) => {
    set({tmRelaxedMode: val});
    persist({tmRelaxedMode: val});
  },
  toHighlightSlots: true,
  setToHighlightSlots: (val: boolean) => {
    set({toHighlightSlots: val});
    persist({toHighlightSlots: val});
  },
  cpShowPreview: true,
  setCpShowPreview: (val: boolean) => {
    set({cpShowPreview: val});
    persist({cpShowPreview: val});
  },
}));

export async function initSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const update: Record<string, boolean> = {};
      if (typeof parsed.autoDraw === 'boolean') update.autoDraw = parsed.autoDraw;
      if (typeof parsed.tmRelaxedMode === 'boolean') update.tmRelaxedMode = parsed.tmRelaxedMode;
      if (typeof parsed.toHighlightSlots === 'boolean') update.toHighlightSlots = parsed.toHighlightSlots;
      if (typeof parsed.cpShowPreview === 'boolean') update.cpShowPreview = parsed.cpShowPreview;
      useSettings.setState(update);
    }
  } catch {
    // Default settings
  }
}
