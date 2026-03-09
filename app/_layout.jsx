/**
 * app/_layout.jsx
 *
 * FINAL FIX — chicken-and-egg problem solved:
 *
 * PROBLEM:
 *   Stack was blocked until isHydrated = true.
 *   But hydration lived in AuthProvider which wraps Stack.
 *   So hydration never ran = app stuck forever.
 *
 * FIX:
 *   Hydration moved HERE into root layout — runs immediately on mount,
 *   completely independent of Stack rendering.
 *   AuthProvider is now just a context wrapper with no logic.
 *   Stack renders only when BOTH i18nReady AND isHydrated are true.
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import AuthProvider from "@/providers/AuthProvider";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, useEffect, useRef, useState } from "react";
import { AppState, LogBox, StyleSheet, Text, View } from "react-native";

LogBox.ignoreLogs([
    "expo-router/babel is deprecated",
    "Require cycle: src/lib/api/apiClient",
]);

if (typeof ErrorUtils !== "undefined") {
    const original = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error(`[GlobalError] isFatal=${isFatal}`, error?.message, error?.stack);
        original?.(error, isFatal);
    });
}

SplashScreen.preventAutoHideAsync().catch(() => { });

const I18N_TIMEOUT_MS = 5_000;

class RootErrorBoundary extends Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, info) { console.error("[RootErrorBoundary]", error, info?.componentStack); }
    render() {
        if (this.state.hasError) {
            return (
                <View style={s.errorContainer}>
                    <Text style={s.errorTitle}>Something went wrong</Text>
                    <Text style={s.errorMessage}>{this.state.error?.message ?? "Unexpected error"}</Text>
                    <Text style={s.retryBtn} onPress={() => this.setState({ hasError: false, error: null })}>Tap to retry</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function RootLayout() {
    const [i18nReady, setI18nReady] = useState(false);
    const logoutWired = useRef(false);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const fetchIfStale = useProfileStore((s) => s.fetchIfStale);
    const logoutAuth = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);

    // FIX: Hydration moved here — runs immediately, not blocked by Stack
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const hydrateProfile = useProfileStore((s) => s.hydrate);

    useEffect(() => {
        Promise.all([hydrateAuth(), hydrateProfile()]);
    }, []);

    // Wire logout handler once
    useEffect(() => {
        if (logoutWired.current) return;
        logoutWired.current = true;
        setLogoutHandler(async () => {
            await Promise.allSettled([logoutAuth(), clearProfile()]);
        });
    }, []);

    // i18n init with timeout fallback
    useEffect(() => {
        let settled = false;
        const settle = () => { if (!settled) { settled = true; setI18nReady(true); } };
        const timer = setTimeout(settle, I18N_TIMEOUT_MS);
        initI18n()
            .then(settle)
            .catch((err) => { console.warn("[RootLayout] i18n failed:", err?.message); settle(); })
            .finally(() => clearTimeout(timer));
        return () => { clearTimeout(timer); settled = true; };
    }, []);

    // Hide splash only when BOTH ready
    useEffect(() => {
        if (i18nReady && isHydrated) SplashScreen.hideAsync().catch(() => { });
    }, [i18nReady, isHydrated]);

    // Refresh profile on foreground
    useEffect(() => {
        if (!isAuthenticated) return;
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") fetchIfStale();
        });
        return () => sub.remove();
    }, [isAuthenticated]);

    // FIX: Block Stack until BOTH i18n AND hydration are done
    if (!i18nReady || !isHydrated) return <View style={s.loadingContainer} />;

    return (
        <RootErrorBoundary>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" />
                    <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
                </Stack>
            </AuthProvider>
        </RootErrorBoundary>
    );
}

const s = StyleSheet.create({
    loadingContainer: { flex: 1, backgroundColor: "#1a1a1a" },
    errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0D0F" },
    errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#FFFFFF" },
    errorMessage: { fontSize: 14, color: "#888888", textAlign: "center", marginBottom: 24 },
    retryBtn: { fontSize: 15, fontWeight: "500", color: "#FF3B30" },
});