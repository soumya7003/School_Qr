// src/i18n/index.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bn from "./locales/bn.json";
import en from "./locales/en.json";
import gu from "./locales/gu.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import mr from "./locales/mr.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";

const LANG_KEY = "app_language";

// Read saved language before init
async function getStoredLanguage() {
  try {
    return (await AsyncStorage.getItem(LANG_KEY)) ?? "en";
  } catch {
    return "en";
  }
}

export async function initI18n() {
  const savedLang = await getStoredLanguage();

  await i18n.use(initReactI18next).init({
    resources: { en, hi, bn, te, mr, ta, gu, kn },
    lng: savedLang,
    fallbackLng: "en", // always fall back to English
    interpolation: { escapeValue: false },
    compatibilityJSON: "v3", // required for Android
  });
}

// Call this from settings when user picks a language
export async function changeLanguage(code) {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANG_KEY, code);
}

export default i18n;
