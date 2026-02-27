import { theme } from "@/src/theme";
import { createContext, useContext } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useThemeContext = () => useContext(ThemeContext);