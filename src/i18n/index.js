import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import locale files
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import or_ from './locales/or.json';
import pa from './locales/pa.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import ur from './locales/ur.json';
// Add any missing imports like gu, as, etc.
import gu from './locales/gu.json';   // ← make sure this file exists
import as_ from './locales/as.json';  // ← make sure this file exists

const LANG_KEY = 'app_language';

// Define resources (all languages)
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  te: { translation: te },
  mr: { translation: mr },
  ta: { translation: ta },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  as: { translation: as_ },
  or: { translation: or_ },
  pa: { translation: pa },
  ur: { translation: ur },
};

// 🔥 INITIALIZE SYNCHRONOUSLY WITH DEFAULT LANGUAGE
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',                // default, will be updated later
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
});

// Export a function to load and apply the stored language after mount
export async function loadStoredLanguage() {
  try {
    const storedLang = await AsyncStorage.getItem(LANG_KEY);
    if (storedLang && resources[storedLang]) {
      await i18n.changeLanguage(storedLang);
    }
  } catch (error) {
    console.error('Failed to load stored language:', error);
  }
}

// Export a function to change language (for settings)
export async function changeLanguage(code) {
  if (!resources[code]) code = 'en';
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANG_KEY, code);
}

export default i18n;