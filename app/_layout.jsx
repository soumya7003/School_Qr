/**
 * app/_layout.jsx
 *
 * FIXED: Proper auth + profile initialization order
 * FIXED: No race conditions between auth and profile
 * FIXED: Profile refreshes only when authenticated
 */

import SequentialLockGate from "@/components/auth/SequentialLockGate";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { useInactivityLock } from "@/hooks/useInactivityLock";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import { isDeviceRooted } from "@/lib/security/deviceSecurity";
import { checkAppIntegrity } from "@/lib/security/integrityCheck";
import AppProviders from "@/providers";
import { useBiometricStore } from "@/store/biometricStore";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
    Component,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Alert,
    AppState,
    BackHandler,
    LogBox,
    StyleSheet,
    Text,
    View,
} from "react-native";

// ── Suppress known non-actionable warnings ────────────────────────────────────
LogBox.ignoreLogs([
    "expo-router/babel is deprecated",
    "Require cycle: src/lib/api/apiClient",
]);

// ── Global JS error handler ───────────────────────────────────────────────────
if (typeof ErrorUtils !== "undefined") {
    const original = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error(
            `[GlobalError] isFatal=${isFatal}`,
            error?.message,
            error?.stack
        );
        original?.(error, isFatal);
    });
}

// Keep splash visible until we explicitly hide it
SplashScreen.preventAutoHideAsync().catch(() => { });

const I18N_TIMEOUT_MS = 5_000;

// ─── Error Boundary ───────────────────────────────────────────────────────────
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
                    <Text style={s.errorMessage}>
                        {this.state.error?.message ?? "Unexpected error"}
                    </Text>
                    <Text
                        style={s.retryBtn}
                        onPress={() =>
                            this.setState({ hasError: false, error: null })
                        }
                    >
                        Tap to retry
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

// ─── Root Layout Content ──────────────────────────────────────────────────────
function RootLayoutContent({ handleRootLayout }) {
    const panHandlers = useInactivityLock();

    return (
        <AppProviders>
            <RootErrorBoundary>
                <View
                    style={s.root}
                    onLayout={handleRootLayout}
                    {...panHandlers}
                >
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(app)" />
                        <Stack.Screen
                            name="(modals)"
                            options={{ presentation: "modal" }}
                        />
                    </Stack>

                    <StatusBar style="auto" />
                    <SequentialLockGate />
                </View>
            </RootErrorBoundary>
        </AppProviders>
    );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
    usePushNotifications();

    const [i18nReady, setI18nReady] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    // ── Store selectors ───────────────────────────────────────────────────────
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const logoutAuth = useAuthStore((s) => s.logout);
    const hydrateProfile = useProfileStore((s) => s.hydrate);
    const clearProfile = useProfileStore((s) => s.clear);
    const onLogin = useProfileStore((s) => s.onLogin);
    const onLogout = useProfileStore((s) => s.onLogout);
    const setAppReady = useBiometricStore((s) => s.setAppReady);

    // ── Security checks ───────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const [rooted, integrityOk] = await Promise.all([
                isDeviceRooted(),
                Promise.resolve(checkAppIntegrity()),
            ]);

            if (rooted) {
                Alert.alert(
                    "Rooted Device Detected",
                    "This app cannot run on rooted devices to protect your data.",
                    [{ text: "OK", onPress: () => BackHandler.exitApp() }],
                    { cancelable: false }
                );
                return;
            }

            if (!integrityOk) {
                Alert.alert(
                    "Security Error",
                    "App integrity check failed. Please reinstall from the official store.",
                    [{ text: "OK", onPress: () => BackHandler.exitApp() }],
                    { cancelable: false }
                );
            }
        })();
    }, []);

    // ── FIXED: Auth hydration FIRST, then profile ─────────────────────────────
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;

        const init = async () => {
            console.log("[RootLayout] Starting initialization...");

            // Step 1: Hydrate auth store first
            await hydrateAuth();
            console.log("[RootLayout] Auth hydrated, isAuthenticated:", isAuthenticated);
            setAuthReady(true);

            // Step 2: Hydrate profile store (it will wait for auth internally)
            await hydrateProfile();
            console.log("[RootLayout] Profile hydrated");
        };

        init().catch((err) => {
            console.error("[RootLayout] Init error:", err);
            setAuthReady(true);
        });
    }, [hydrateAuth, hydrateProfile, isAuthenticated]);

    // ── Wire global logout handler ────────────────────────────────────────────
    const handleLogout = useCallback(async () => {
        console.log("[RootLayout] Global logout triggered");
        await onLogout(); // Clear profile store
        await logoutAuth(); // Clear auth store
    }, [logoutAuth, onLogout]);

    useEffect(() => {
        setLogoutHandler(handleLogout);
        return () => setLogoutHandler(null);
    }, [handleLogout]);

    // ── FIXED: Subscribe to auth changes to sync profile store ─────────────────
    useEffect(() => {
        const unsubscribe = useAuthStore.subscribe((state, prevState) => {
            // On login
            if (state.isAuthenticated && !prevState.isAuthenticated) {
                console.log("[RootLayout] Auth changed: LOGIN detected");
                onLogin();
            }
            // On logout
            if (!state.isAuthenticated && prevState.isAuthenticated) {
                console.log("[RootLayout] Auth changed: LOGOUT detected");
                onLogout();
            }
        });

        return unsubscribe;
    }, [onLogin, onLogout]);

    // ── i18n init with timeout fallback ──────────────────────────────────────
    useEffect(() => {
        let settled = false;
        const settle = () => {
            if (!settled) {
                settled = true;
                setI18nReady(true);
            }
        };
        const timer = setTimeout(settle, I18N_TIMEOUT_MS);
        initI18n()
            .then(settle)
            .catch((err) => {
                console.warn("[RootLayout] i18n failed:", err?.message);
                settle();
            })
            .finally(() => clearTimeout(timer));
        return () => {
            clearTimeout(timer);
            settled = true;
        };
    }, []);

    // ── Hide splash when BOTH i18n + auth are ready ──────────────────────────
    useEffect(() => {
        if (i18nReady && authReady) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [i18nReady, authReady]);

    // ── FIXED: Refresh profile when app comes to foreground (ONLY if authenticated) ──
    const fetchIfStale = useProfileStore((s) => s.fetchIfStale);

    useEffect(() => {
        if (!isAuthenticated) {
            console.log("[RootLayout] Not authenticated, skipping foreground refresh");
            return;
        }

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                console.log("[RootLayout] App foregrounded, checking stale profile");
                fetchIfStale();
            }
        });
        return () => sub.remove();
    }, [isAuthenticated, fetchIfStale]);

    // ── Mark navigator as ready on first layout pass ──────────────────────────
    const handleRootLayout = useCallback(() => {
        setAppReady(true);
    }, [setAppReady]);

    // ══════════════════════════════════════════════════════════════════════════
    // Block render until both i18n and auth are ready
    // ══════════════════════════════════════════════════════════════════════════
    if (!i18nReady || !authReady) {
        return <View style={s.loadingContainer} />;
    }

    return <RootLayoutContent handleRootLayout={handleRootLayout} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#1a1a1a",
    },
    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#0D0D0F",
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        color: "#FFFFFF",
    },
    errorMessage: {
        fontSize: 14,
        color: "#888888",
        textAlign: "center",
        marginBottom: 24,
    },
    retryBtn: {
        fontSize: 15,
        fontWeight: "500",
        color: "#FF3B30",
    },
});