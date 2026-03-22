/**
 * useTheme.js
 * Provides theme state + setTheme for the whole app.
 * Persists selection to AsyncStorage.
 * Used by ThemeSegment in settings and consumed via useColorScheme().
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";

const THEME_KEY = "app_theme";

/**
 * Returns { theme, resolvedTheme, setTheme }
 *
 * theme         — the saved preference: "light" | "dark" | "system"
 * resolvedTheme — the actual applied theme: "light" | "dark"
 * setTheme      — persist + update theme
 */
export function useColorScheme() {
    const deviceScheme = useDeviceColorScheme(); // "light" | "dark" | null
    const [theme, setThemeState] = useState("system");

    // Load saved preference on mount
    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY)
            .then((saved) => {
                if (saved === "light" || saved === "dark" || saved === "system") {
                    setThemeState(saved);
                }
            })
            .catch(() => { });
    }, []);

    const setTheme = async (value) => {
        if (value !== "light" && value !== "dark" && value !== "system") return;
        setThemeState(value);
        try {
            await AsyncStorage.setItem(THEME_KEY, value);
        } catch { }
    };

    // Resolve "system" to the actual device preference
    const resolvedTheme =
        theme === "system"
            ? (deviceScheme ?? "dark")
            : theme;

    return { theme, resolvedTheme, setTheme };
}