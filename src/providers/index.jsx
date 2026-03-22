/**
 * src/providers/index.jsx
 *
 * Composes all app-wide providers in the correct order.
 *
 * ✅ FIX: ThemeProvider added here so useThemeContext() works in any screen.
 * Previously ThemeProvider was defined but never mounted in the tree,
 * causing "Cannot read property 'theme' of undefined" in settings.jsx.
 *
 * Order matters:
 *   I18nextProvider  — i18n must wrap everything (useTranslation deps)
 *   ThemeProvider    — theme state available to all screens
 *   AuthProvider     — auth state / session management
 */

import i18n from "@/i18n";
import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { I18nextProvider } from "react-i18next";

export function Providers({ children }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}