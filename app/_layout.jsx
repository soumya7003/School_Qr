/**
 * app/_layout.jsx  (root layout)
 *
 * Responsibilities:
 *   1. Init i18n (with timeout fallback)
 *   2. Wire apiClient logout handler
 *   3. AppState foreground listener → fetchIfStale (30 min staleness check)
 *   4. Global error boundary + LogBox suppression
 *
 * NOTE: hydration (hydrateAuth + hydrateProfile) lives in AuthProvider, not here.
 *       This file sets up infrastructure; AuthProvider owns auth state.
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

// ── Suppress known non-critical noise ────────────────────────────────────────

LogBox.ignoreLogs([
    "expo-router/babel is deprecated",
    "Require cycle: src/lib/api/apiClient",
]);

// ── Global error handler ──────────────────────────────────────────────────────

if (typeof ErrorUtils !== "undefined") {
    const original = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error(`[GlobalError] isFatal=${isFatal}`, error?.message, error?.stack);
        original?.(error, isFatal);
    });
}

// Keep splash visible until i18n + hydration are done
SplashScreen.preventAutoHideAsync().catch(() => { });

const I18N_TIMEOUT_MS = 5_000;

// ── Error Boundary ────────────────────────────────────────────────────────────

class RootErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[RootErrorBoundary]", error, info?.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={s.errorContainer}>
                    <Text style={s.errorTitle}>Something went wrong</Text>
                    <Text style={s.errorMessage}>{this.state.error?.message ?? "Unexpected error"}</Text>
                    <Text style={s.retryBtn} onPress={() => this.setState({ hasError: false, error: null })}>
                        Tap to retry
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [i18nReady, setI18nReady] = useState(false);
    const logoutWired = useRef(false);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const fetchIfStale = useProfileStore((s) => s.fetchIfStale);

    // ── Wire logout handler once ──────────────────────────────────────────────
    // Must be here (not AuthProvider) so it's set before any API call fires.
    useEffect(() => {
        if (logoutWired.current) return;
        logoutWired.current = true;
        setLogoutHandler(() => {
            useAuthStore.getState().logout();
        });
    }, []);

    // ── i18n init with timeout fallback ──────────────────────────────────────
    useEffect(() => {
        let settled = false;
        const settle = () => { if (!settled) { settled = true; setI18nReady(true); } };
        const timer = setTimeout(settle, I18N_TIMEOUT_MS);

        initI18n()
            .then(settle)
            .catch((err) => {
                console.warn("[RootLayout] i18n failed, using defaults:", err?.message);
                settle();
            })
            .finally(() => clearTimeout(timer));

        return () => { clearTimeout(timer); settled = true; };
    }, []);

    // ── AppState: refresh profile if stale when app foregrounds ──────────────
    // Only fires when authenticated — no-op for logged-out users.
    useEffect(() => {
        if (!isAuthenticated) return;

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") fetchIfStale();
        });

        return () => sub.remove();
    }, [isAuthenticated]);

    if (!i18nReady) {
        return (
            <View style={s.loadingContainer}>
                <Text style={s.loadingText}>Loading…</Text>
            </View>
        );
    }

    return (
        <RootErrorBoundary>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" />
                </Stack>
            </AuthProvider>
        </RootErrorBoundary>
    );
}

const s = StyleSheet.create({
    loadingContainer: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
    loadingText: { fontSize: 14, color: "#AAAAAA" },
    errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFFFFF" },
    errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#1A1A1A" },
    errorMessage: { fontSize: 14, color: "#666666", textAlign: "center", marginBottom: 24 },
    retryBtn: { fontSize: 15, fontWeight: "500", color: "#FF3B30" },
});