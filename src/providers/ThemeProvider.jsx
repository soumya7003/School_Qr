/**
 * providers/ThemeProvider.jsx
 *
 * FIXED:
 *  - Context default is darkT so useTheme() NEVER returns null
 *  - Exports useTheme() (primary) + useThemeContext() (legacy alias)
 *  - ThemeProvider must wrap the whole app in providers/index.jsx
 */

import { darkT, lightT } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const THEME_KEY = 'resqid_theme_pref';

const ThemeContext = createContext({
    theme: 'system',
    resolvedTheme: 'dark',
    colors: darkT,
    setTheme: () => { },
});

export function ThemeProvider({ children }) {
    const systemScheme = useSystemColorScheme();
    const [theme, setThemeState] = useState('system');

    // Rehydrate from storage
    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY)
            .then((v) => { if (v) setThemeState(v); })
            .catch(() => { });
    }, []);

    const setTheme = useCallback(async (next) => {
        setThemeState(next);
        try { await AsyncStorage.setItem(THEME_KEY, next); } catch { }
    }, []);

    const resolvedTheme = theme === 'system' ? (systemScheme ?? 'dark') : theme;
    const colors = resolvedTheme === 'light' ? lightT : darkT;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

/** Primary hook — always returns valid colors. Use this everywhere. */
export function useTheme() {
    return useContext(ThemeContext);
}

/** Legacy alias */
export const useThemeContext = useTheme;
