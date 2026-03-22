/**
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

export function ThemeProvider({ children }) {
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