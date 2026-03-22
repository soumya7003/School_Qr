// src/i18n/index.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bn from "./locales/bn.json";
import en from "./locales/en.json";
import gu from "./locales/gu.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json"; // ← added
import mr from "./locales/mr.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";

const LANG_KEY = "app_language";

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
        resources: { en, hi, bn, te, mr, ta, gu, kn, ml }, // ← ml added
        lng: savedLang,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        compatibilityJSON: "v3",
    });
}

/**
 * Call this from settings when the user picks a language.
 * Updates i18n runtime AND persists so the next cold-start restores it.
 */
export async function changeLanguage(code) {
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem(LANG_KEY, code);
}

export default i18n;