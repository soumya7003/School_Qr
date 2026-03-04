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
});