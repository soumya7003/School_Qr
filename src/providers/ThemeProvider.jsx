/**
<<<<<<< HEAD
 * ThemeProvider.jsx
 *
 * Single source of truth for theme state.
 * Reads/persists preference via useColorScheme() and exposes:
 *   - theme         → saved preference: "light" | "dark" | "system"
 *   - resolvedTheme → actual applied value: "light" | "dark"
 *   - setTheme      → persists + updates preference
 *   - colors        → active color tokens for the resolved theme
 *
 * Consumers: call useThemeContext() anywhere instead of useColorScheme() directly.
 */

import { colors as darkColors } from "@/theme/colors";
import { useColorScheme } from "@/hooks/useTheme";
import { theme as baseTheme } from "@/theme";
import { createContext, useContext, useMemo } from "react";
=======
 * src/providers/ThemeProvider.jsx
 *
 * Single source of truth for theme.
 * Wrap the app with <ThemeProvider> in _layout.jsx.
 * Consume via useThemeContext() anywhere.
 */

import { darkT, lightT } from "@/theme/tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

const THEME_KEY = "app_theme";

const ThemeContext = createContext(null);
>>>>>>> 72372568f0fb59760047844887ef17d5d0a9f81d

// ─── Light palette override ───────────────────────────────────────────────────
// Swap out only the tokens that differ in light mode.
// Extend this object as you build out a full light theme.
const lightColors = {
  ...darkColors,
  pageBg: "#F5F6FA",
  screenBg: "#FFFFFF",
  surface: "#F0F1F5",
  surface2: "#E8EAF0",
  surface3: "#DDE0EA",
  textPrimary: "#0A0D12",
  textSecondary: "#3B4260",
  textTertiary: "#555C70",
  textDisabled: "#8A90A2",
  border: "rgba(0,0,0,0.07)",
  borderStrong: "rgba(0,0,0,0.12)",
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
<<<<<<< HEAD
  const { theme, resolvedTheme, setTheme } = useColorScheme();

  const value = useMemo(() => ({
    // Pass through the preference + setter
    theme,
    resolvedTheme,
    setTheme,
    // Active color tokens — swap based on resolved mode
    colors: resolvedTheme === "light" ? lightColors : darkColors,
    // Keep the rest of the base theme (spacing, typography, radius, shadows)
    ...baseTheme,
  }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used inside <ThemeProvider>");
  return ctx;
};
=======
    const systemScheme = useSystemColorScheme(); // 'dark' | 'light' | null
    const [theme, setThemeState] = useState("system"); // persisted user preference

    // ── Rehydrate saved preference ────────────────────────────────────────────
    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY)
            .then((saved) => { if (saved) setThemeState(saved); })
            .catch(() => {});
    }, []);

    // ── Persist & apply ───────────────────────────────────────────────────────
    const setTheme = useCallback(async (newTheme) => {
        setThemeState(newTheme);
        try { await AsyncStorage.setItem(THEME_KEY, newTheme); } catch {}
    }, []);

    const resolvedTheme =
        theme === "system" ? (systemScheme ?? "dark") : theme;

    const colors = resolvedTheme === "light" ? lightT : darkT;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

/** Primary hook — use everywhere instead of inline state */
export const useThemeContext = () => useContext(ThemeContext);
>>>>>>> 72372568f0fb59760047844887ef17d5d0a9f81d
