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
  // Global
  tileScale: number;
  setTileScale: (val: number) => void;
}

function persist(state: Partial<SettingsStore>) {
  const {autoDraw, tmRelaxedMode, toHighlightSlots, cpShowPreview, tileScale} =
    useSettings.getState();
  const merged = {autoDraw, tmRelaxedMode, toHighlightSlots, cpShowPreview, tileScale, ...state};
  AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      autoDraw: merged.autoDraw,
      tmRelaxedMode: merged.tmRelaxedMode,
      toHighlightSlots: merged.toHighlightSlots,
      cpShowPreview: merged.cpShowPreview,
      tileScale: merged.tileScale,
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
  tileScale: 1.0,
  setTileScale: (val: number) => {
    set({tileScale: val});
    persist({tileScale: val});
  },
}));

export async function initSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const update: Record<string, boolean | number> = {};
      if (typeof parsed.autoDraw === 'boolean') update.autoDraw = parsed.autoDraw;
      if (typeof parsed.tmRelaxedMode === 'boolean') update.tmRelaxedMode = parsed.tmRelaxedMode;
      if (typeof parsed.toHighlightSlots === 'boolean') update.toHighlightSlots = parsed.toHighlightSlots;
      if (typeof parsed.cpShowPreview === 'boolean') update.cpShowPreview = parsed.cpShowPreview;
      if (typeof parsed.tileScale === 'number') update.tileScale = parsed.tileScale;
      useSettings.setState(update);
    }
  } catch {
    // Default settings
  }
}
