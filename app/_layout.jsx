// app/_layout.jsx — Production Grade
// Fixes applied:
//   [FIX-1] Global JS error handler (ErrorUtils) for catching async/runtime crashes
//   [FIX-2] LogBox suppresses known non-critical noise
//   [FIX-3] i18n loading state shows visible text (helps debug hangs on Android)
//   [FIX-4] Removed deprecated expo-router/babel reference in comments
//   [FIX-5] Circular dep guard: setLogoutHandler uses lazy ref pattern
//   [FIX-6] SplashScreen.preventAutoHideAsync guarded properly
//   [FIX-7] ErrorBoundary catches render errors
//   [FIX-8] Stack screens explicitly declared

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
    useState,
} from "react";
import {
    LogBox,
    StyleSheet,
    Text,
    View,
} from "react-native";

// ── Suppress known non-critical warnings ──────────────────────────────────────
LogBox.ignoreLogs([
    "expo-router/babel is deprecated",
    "Require cycle: src/lib/api/apiClient",
]);

// ── Global JS Error Handler ───────────────────────────────────────────────────
// Catches async/runtime errors that ErrorBoundary cannot catch
// (promise rejections, event handlers, native callbacks)
if (typeof ErrorUtils !== "undefined") {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error(
            `[GlobalError] isFatal=${isFatal} | message: ${error?.message}`,
        );
        console.error("[GlobalError] stack:", error?.stack);
        // Call the original handler so React Native's default behaviour is preserved
        if (typeof originalHandler === "function") {
            originalHandler(error, isFatal);
        }
    });
}

// ── Splash: keep visible until i18n + auth hydration are both ready ───────────
SplashScreen.preventAutoHideAsync().catch(() => {
    // Already prevented — safe to ignore
});

// ── Constants ─────────────────────────────────────────────────────────────────
const I18N_TIMEOUT_MS = 5_000; // Fall back to default language after 5 s

// ── Error Boundary ────────────────────────────────────────────────────────────
// Must be a class component — hooks cannot catch render-phase errors.
class RootErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Wire up Sentry / Bugsnag here if needed
        console.error("[RootErrorBoundary]", error, info?.componentStack);
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

    // ── Wire logout handler exactly once ────────────────────────────────────
    useEffect(() => {
        if (logoutHandlerSet.current) return;
        logoutHandlerSet.current = true;

        setLogoutHandler(() => {
            useAuthStore.getState().logout();
        });
    }, []);

    // ── Init i18n with timeout + error handling ─────────────────────────────
    useEffect(() => {
        let settled = false;

        const settle = (error = null) => {
            if (settled) return;
            settled = true;
            if (error) setI18nError(error);
            setI18nReady(true);
        };

        // Safety net: if i18n never resolves, unblock the app after timeout
        const timer = setTimeout(() => {
            settle(new Error("I18N_TIMEOUT"));
        }, I18N_TIMEOUT_MS);

        initI18n()
            .then(() => settle())
            .catch((err) => settle(err))
            .finally(() => clearTimeout(timer));

        return () => {
            clearTimeout(timer);
            settled = true; // prevent setState on unmounted component
        };
    }, []);

    // ── Log i18n fallback in dev ────────────────────────────────────────────
    useEffect(() => {
        if (i18nError) {
            console.warn(
                "[RootLayout] i18n init failed — using default language.",
                i18nError.message,
            );
        }
    }, [i18nError]);

    // ── Block render until i18n is ready ────────────────────────────────────
    // Splash screen is still visible here — no spinner flash on native.
    // The <Text> is shown only if the splash somehow dismisses early (web / dev).
    if (!i18nReady) {
        return (
            <View style={styles.loadingContainer}>
                {/* Visible only if splash is not covering — useful for debugging */}
                <Text style={styles.loadingText}>Loading…</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        fontSize: 14,
        color: "#AAAAAA",
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
        color: "#E8342A",
    },
});