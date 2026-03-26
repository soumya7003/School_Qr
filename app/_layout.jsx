/**
 * app/_layout.jsx
 *
 * Fixes vs original InnerLayout version:
 *   1.  RootErrorBoundary added — sits INSIDE AppProviders for theme/i18n access
 *   2.  Stale useEffect deps fixed (hydrateAuth, hydrateProfile, fetchIfStale,
 *       logoutAuth, clearProfile, handleLogout)
 *   3.  Hydration double-run guarded with hasHydrated ref
 *   4.  setLogoutHandler(null) cleanup added — safe in Strict Mode
 *   5.  Splash screen gated on BOTH i18nReady + isHydrated
 *   6.  Security checks (rooted device + app integrity) added
 *   7.  i18n initialisation with 5 s timeout fallback
 *   8.  BiometricGate overlay kept (was silently dropped in the doc version)
 *   9.  setAppReady(true) kept via onLayout on the root View — replaces the
 *       fragile 500 ms setTimeout with a real "navigator painted" signal
 *  10.  AppState profile-refresh listener scoped to authenticated users
 *  11.  [CRITICAL FIX] Rules of Hooks violation fixed — moved useInactivityLock
 *       to separate component that renders after hydration check
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import { isDeviceRooted } from "@/lib/security/deviceSecurity";
import { checkAppIntegrity } from "@/lib/security/integrityCheck";
import AppProviders from "@/providers";
import BiometricGate from "@/components/auth/BiometricGate";
import { useInactivityLock } from "@/hooks/useInactivityLock";
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

// ── Global JS error handler (catches unhandled throws outside React tree) ─────
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
SplashScreen.preventAutoHideAsync().catch(() => {});

const I18N_TIMEOUT_MS = 5_000;

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Placed INSIDE AppProviders so the error screen has access to theme + i18n.
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
// Separated to avoid Rules of Hooks violation — this renders AFTER hydration
function RootLayoutContent({ handleRootLayout }) {
    // ── Pan handlers from inactivity hook (spread onto root View) ────────────
    // Now safe to call — no early returns above this in the component tree
    const panHandlers = useInactivityLock();

    return (
        <AppProviders>
            {/* FIX 1: RootErrorBoundary inside providers for theme/i18n access */}
            <RootErrorBoundary>
                {/*
                 * FIX 9: onLayout fires after the first render paint — this is
                 * when the navigator is truly mounted, making it a reliable
                 * signal for setAppReady instead of a magic 500 ms delay.
                 *
                 * panHandlers (from useInactivityLock) reset the inactivity
                 * timer on every touch without consuming the event.
                 */}
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

                    {/*
                     * FIX 8: BiometricGate kept — renders null when not locked,
                     * shows the lock overlay when isLocked = true.
                     * Was silently dropped in the doc version.
                     */}
                    <BiometricGate />
                </View>
            </RootErrorBoundary>
        </AppProviders>
    );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
    const [i18nReady, setI18nReady] = useState(false);

    // ── Store selectors ───────────────────────────────────────────────────────
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const logoutAuth = useAuthStore((s) => s.logout);
    const hydrateProfile = useProfileStore((s) => s.hydrate);
    const fetchIfStale = useProfileStore((s) => s.fetchIfStale);
    const clearProfile = useProfileStore((s) => s.clear);
    const setAppReady = useBiometricStore((s) => s.setAppReady);

    // ── Security checks — run once on cold start ──────────────────────────────
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
    }, []); // no external deps — pure side-effect on mount

    // ── Hydration (auth + profile in parallel) ────────────────────────────────
    // FIX 3: hasHydrated ref prevents double-run in Strict Mode or if store
    //         functions briefly change identity.
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (hasHydrated.current) return;
        hasHydrated.current = true;
        Promise.all([hydrateAuth(), hydrateProfile()]).catch(() => {
            // Each store handles its own errors — safe to ignore here
        });
    }, [hydrateAuth, hydrateProfile]); // FIX 2: deps added

    // ── Wire global logout handler ────────────────────────────────────────────
    // FIX 4: cleanup sets handler to null — safe under React Strict Mode.
    const handleLogout = useCallback(async () => {
        await Promise.allSettled([logoutAuth(), clearProfile()]);
    }, [logoutAuth, clearProfile]); // FIX 2: deps added

    useEffect(() => {
        setLogoutHandler(handleLogout);
        return () => setLogoutHandler(null); // FIX 4: cleanup
    }, [handleLogout]);

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
    }, []); // initI18n is stable — no deps needed

    // ── Hide splash only when BOTH i18n + store hydration are ready ──────────
    // FIX 5: was never hidden in the original
    useEffect(() => {
        if (i18nReady && isHydrated) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [i18nReady, isHydrated]);

    // ── Refresh profile when app comes to foreground (authenticated only) ─────
    useEffect(() => {
        if (!isAuthenticated) return;
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") fetchIfStale();
        });
        return () => sub.remove();
    }, [isAuthenticated, fetchIfStale]); // FIX 2: fetchIfStale added

    // ── Mark navigator as ready on first layout pass ──────────────────────────
    // FIX 9: replaces the fragile setTimeout(500) with a real paint signal.
    const handleRootLayout = useCallback(() => {
        setAppReady(true);
    }, [setAppReady]);

    // ══════════════════════════════════════════════════════════════════════════
    // FIX 11: Block render until both i18n and hydration are ready
    // CRITICAL: This MUST come AFTER all hooks to avoid Rules of Hooks violation
    // ══════════════════════════════════════════════════════════════════════════
    if (!i18nReady || !isHydrated) {
        return <View style={s.loadingContainer} />;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Now safe to render the full tree with useInactivityLock in child component
    // ══════════════════════════════════════════════════════════════════════════
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