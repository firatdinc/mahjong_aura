import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Language, translations} from './translations';

const LANG_KEY = '@mahjong_aura/language';

interface LanguageStore {
  language: Language;
  t: typeof translations['en'];
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageStore>((set) => ({
  language: 'en',
  t: translations.en,
  setLanguage: (lang: Language) => {
    set({language: lang, t: translations[lang]});
    AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
  },
}));

// Load saved language on startup
export async function initLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved && saved in translations) {
      const lang = saved as Language;
      useLanguage.setState({language: lang, t: translations[lang]});
    }
  } catch {
    // Default to English
  }
}
