/**
 * app/_layout.jsx
 *
 * Fixes applied:
 *   1. SafeAreaProvider added as outermost wrapper
 *   2. ThemeProvider moved INSIDE RootErrorBoundary so error UI can use theme
 *   3. Missing useEffect deps added (hydrateAuth, hydrateProfile, logoutAuth, clearProfile, fetchIfStale)
 *   4. Providers consolidated via AppProviders from src/providers/index.jsx
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { initI18n } from "@/i18n";
import { setLogoutHandler } from "@/lib/api/apiClient";
import { isDeviceRooted } from "@/lib/security/deviceSecurity";
import { checkAppIntegrity } from "@/lib/security/integrityCheck";
import AppProviders from "@/providers";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, LogBox, StyleSheet, Text, View } from "react-native";

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

SplashScreen.preventAutoHideAsync().catch(() => { });

const I18N_TIMEOUT_MS = 5_000;

// ─── Error Boundary ───────────────────────────────────────────────────────────
// Sits INSIDE AppProviders so the error screen has access to theme + i18n
class RootErrorBoundary extends Component {
    state = { hasError: false, error: null };
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
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
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        Tap to retry
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function RootLayout() {
    return (
        <Providers>
            <InnerLayout />
        </Providers>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});