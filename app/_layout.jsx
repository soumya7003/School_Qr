<<<<<<< HEAD
// app/_layout.jsx — Production Grade
// Fixes: AuthProvider added, setLogoutHandler wired, i18n error handling,
//        splash coordination, i18n timeout, StyleSheet, error boundary

import { useAuthStore } from "@/features/auth/auth.store";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import AuthProvider from "@/providers/AuthProvider";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
    Component,
    useEffect,
    useRef,
    useState
} from "react";
import {
    StyleSheet,
    Text,
    View
} from "react-native";

// ── Splash: keep visible until both i18n + auth hydration are ready ───────────
// [FIX-4] Prevent auto-hide here — AuthProvider also calls this but we need
//         it called before AuthProvider mounts to avoid the spinner flash
SplashScreen.preventAutoHideAsync().catch(() => {
    // Already prevented — safe to ignore
});

// ── i18n timeout ──────────────────────────────────────────────────────────────
const I18N_TIMEOUT_MS = 5_000; // [FIX-5] fall back to default language after 5s

// ── Error Boundary ────────────────────────────────────────────────────────────
// [FIX-7] Catches any uncaught render error in the stack
// Must be a class component — hooks can't catch render errors

class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Replace with your error reporting (Sentry, Bugsnag, etc.)
        console.error("[RootErrorBoundary]", error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMessage}>
                        {this.state.error?.message ?? "An unexpected error occurred"}
                    </Text>
                    <Text style={styles.retryButton} onPress={this.handleRetry}>
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
    const [i18nError, setI18nError] = useState(null);
    const logoutHandlerSet = useRef(false);

    // ── Wire logout handler once ────────────────────────────────────────────
    // [FIX-2] setLogoutHandler here — root layout is the right place
    //         Runs before any authenticated request can be made

    useEffect(() => {
        if (logoutHandlerSet.current) return;
        logoutHandlerSet.current = true;

        setLogoutHandler(() => {
            useAuthStore.getState().logout();
        });
    }, []);

    // ── Init i18n with timeout + error handling ─────────────────────────────
    // [FIX-3] .catch() handles init failure — falls back to default language
    // [FIX-5] Timeout forces ready after I18N_TIMEOUT_MS

    useEffect(() => {
        let settled = false;

        const settle = (error = null) => {
            if (settled) return;
            settled = true;
            if (error) setI18nError(error);
            setI18nReady(true);
        };

        // Timeout: if i18n takes too long, fall back to default language
        const timer = setTimeout(() => {
            settle(new Error("I18N_TIMEOUT"));
        }, I18N_TIMEOUT_MS);

        initI18n()
            .then(() => settle())
            .catch((err) => settle(err))  // [FIX-3] never swallow
            .finally(() => clearTimeout(timer));

        return () => {
            clearTimeout(timer);
            settled = true; // prevent state update on unmounted component
        };
    }, []);

    // ── Dev warning for i18n fallback ───────────────────────────────────────

    useEffect(() => {
        if (i18nError) {
            console.warn(
                "[RootLayout] i18n init failed — using default language.",
                i18nError.message,
            );
        }
    }, [i18nError]);

    // ── Block render until i18n ready ───────────────────────────────────────
    // [FIX-4] Splash is still visible here — no spinner flash
    // SplashScreen.hideAsync() is called by AuthProvider after hydration

    if (!i18nReady) {
        // Splash is covering this — but keep a neutral bg just in case
        return <View style={styles.loadingContainer} />;
    }

    return (
        // [FIX-7] Error boundary wraps everything
        <RootErrorBoundary>
            {/* [FIX-1] AuthProvider — was completely missing */}
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    {/* [FIX-8] Removed redundant index screen — auto-registered by Expo Router */}
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(app)" />
                </Stack>
            </AuthProvider>
        </RootErrorBoundary>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// [FIX-6] StyleSheet.create — not inline objects

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF", // match your splash background colour
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#FFFFFF",
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        color: "#1A1A1A",
    },
    errorMessage: {
        fontSize: 14,
        color: "#666666",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        fontSize: 15,
        fontWeight: "500",
        color: "#E8342A", // matches cover_accent_color from your CardTemplate schema
    },
=======
/**
 * app/_layout.jsx
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import { isDeviceRooted } from "@/lib/security/deviceSecurity";
import { checkAppIntegrity } from "@/lib/security/integrityCheck";
import AuthProvider from "@/providers/AuthProvider";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, LogBox, StyleSheet, Text, View } from "react-native";

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

// ─── Error Boundary ───────────────────────────────────────────────────────────

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
                    <Text style={s.retryBtn} onPress={() => this.setState({ hasError: false, error: null })}>
                        Tap to retry
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
    const [i18nReady, setI18nReady] = useState(false);
    const logoutWired = useRef(false);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const fetchIfStale = useProfileStore((s) => s.fetchIfStale);
    const logoutAuth = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const hydrateProfile = useProfileStore((s) => s.hydrate);

    // ── Security checks — runs once on every cold start ───────────────────────
    useEffect(() => {
        const runSecurityChecks = async () => {
            // Run both checks in parallel for speed
            const [rooted, integrityOk] = await Promise.all([
                isDeviceRooted(),
                Promise.resolve(checkAppIntegrity()),
            ]);

            if (rooted) {
                Alert.alert(
                    'Rooted Device Detected',
                    "This app cannot run on rooted devices to protect your child's data.",
                    [{ text: 'OK', onPress: () => BackHandler.exitApp() }],
                    { cancelable: false }
                );
                return; // stop — don't check integrity if already blocking
            }

            if (!integrityOk) {
                Alert.alert(
                    'Security Error',
                    'App integrity check failed. Please reinstall from the Play Store.',
                    [{ text: 'OK', onPress: () => BackHandler.exitApp() }],
                    { cancelable: false }
                );
            }
        };

        runSecurityChecks();
    }, []);

    // ── Hydration — runs immediately, not blocked by Stack ────────────────────
    useEffect(() => {
        Promise.all([hydrateAuth(), hydrateProfile()]);
    }, []);

    // ── Wire logout handler once ──────────────────────────────────────────────
    useEffect(() => {
        if (logoutWired.current) return;
        logoutWired.current = true;
        setLogoutHandler(async () => {
            await Promise.allSettled([logoutAuth(), clearProfile()]);
        });
    }, []);

    // ── i18n init with timeout fallback ──────────────────────────────────────
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

    // ── Hide splash when BOTH ready ───────────────────────────────────────────
    useEffect(() => {
        if (i18nReady && isHydrated) SplashScreen.hideAsync().catch(() => { });
    }, [i18nReady, isHydrated]);

    // ── Refresh profile on foreground ─────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") fetchIfStale();
        });
        return () => sub.remove();
    }, [isAuthenticated]);

    // ── Block Stack until BOTH i18n AND hydration are done ────────────────────
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    loadingContainer: { flex: 1, backgroundColor: "#1a1a1a" },
    errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0D0F" },
    errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#FFFFFF" },
    errorMessage: { fontSize: 14, color: "#888888", textAlign: "center", marginBottom: 24 },
    retryBtn: { fontSize: 15, fontWeight: "500", color: "#FF3B30" },
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
});