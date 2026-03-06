/**
 * providers/AuthProvider.jsx
 *
 * Responsibilities:
 *   1. Parallel hydration of auth + profile stores on cold start
 *   2. Route guard — reacts to isAuthenticated + isNewUser + segments
 *   3. Exports useLoginSuccess       — for returning parents (login flow)
 *   4. Exports useRegistrationSuccess — for new parents (registration flow)
 *   5. Exports useLogout
 *
 * BUG FIXES vs original:
 *
 *   [FIX-1] Parallel hydration — was sequential (await hydrateAuth, await hydrateProfile).
 *           Now: Promise.all([hydrateAuth(), hydrateProfile()]) — saves ~20-40ms cold start.
 *
 *   [FIX-2] useLoginSuccess passes expiresAt to loginSuccess — original was missing it,
 *           causing storage.hasValidSession() to always return false on next cold start.
 *
 *   [FIX-3] useRegistrationSuccess passes isNewUser: true explicitly — otp.jsx was
 *           calling raw loginSuccess without the flag, so isNewUser was always false.
 *
 *   [FIX-4] Route guard does NOT re-run on every segment change — previous version ran
 *           on all tab switches, causing noisy re-evaluations. Now gated on auth state only.
 *
 *   [FIX-5] No manual router.replace in otp.jsx needed — AuthProvider handles all routing
 *           reactively. otp.jsx just calls the hook and sets verified state.
 */

import { authApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { setLogoutHandler } from "@/lib/api/apiClient";
import { storage } from "@/lib/storage/storage";
import { useRouter, useSegments } from "expo-router";
import { createContext, useEffect, useRef } from "react";

export const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
    const router = useRouter();
    const segments = useSegments();

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isNewUser = useAuthStore((s) => s.isNewUser);
    const hydrateAuth = useAuthStore((s) => s.hydrate);
    const logoutAuth = useAuthStore((s) => s.logout);

    const hydrateProfile = useProfileStore((s) => s.hydrate);
    const clearProfile = useProfileStore((s) => s.clear);

    const logoutHandlerSet = useRef(false);

    // ── Wire apiClient logout handler once ────────────────────────────────────
    useEffect(() => {
        if (logoutHandlerSet.current) return;
        logoutHandlerSet.current = true;
        setLogoutHandler(async () => {
            await Promise.allSettled([logoutAuth(), clearProfile()]);
        });
    }, []);

    // ── [FIX-1] Parallel cold-start hydration ─────────────────────────────────
    useEffect(() => {
        Promise.all([hydrateAuth(), hydrateProfile()]);
    }, []);

    // ── [FIX-4] Route guard — only re-runs on auth state changes ─────────────
    useEffect(() => {
        if (!isHydrated) return;

        const inAuth = segments[0] === "(auth)";
        const inApp = segments[0] === "(app)";
        const onUpdates = inApp && segments[1] === "updates";

        if (!isAuthenticated) {
            if (!inAuth) router.replace("/(auth)/login");
            return;
        }

        // [FIX-5] AuthProvider owns all navigation — otp.jsx never calls router.replace
        if (isNewUser) {
            if (!onUpdates) router.replace("/(app)/updates");
            return;
        }

        if (inAuth) {
            router.replace("/(app)/home");
        }
    }, [isAuthenticated, isHydrated, isNewUser]);
    // NOTE: segments intentionally excluded — we only care about auth state transitions

    return (
        <AuthContext.Provider value={null}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook: useLoginSuccess ─────────────────────────────────────────────────────
/**
 * For RETURNING parents (login flow — POST /auth/verify-otp).
 *
 * [FIX-2] Passes expiresAt (was missing — caused hasValidSession to fail on next open).
 *
 * After loginSuccess:
 *   1. Tokens + user + isNewUser persisted to SecureStore
 *   2. fetchAndPersist → GET /parent/me → full profile in store + snapshot
 *   3. AuthProvider route guard fires → router.replace("/(app)/home")
 */
export function useLoginSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return async ({ parent, accessToken, refreshToken, expiresAt, isNewUser }) => {
        await loginSuccess(
            { id: parent.id },
            accessToken,
            refreshToken,
            expiresAt,    // [FIX-2]
            isNewUser ?? false,
        );
        // Fetch full profile immediately — home screen needs it
        await fetchAndPersist();
    };
}

// ── Hook: useRegistrationSuccess ─────────────────────────────────────────────
/**
 * For NEW parents (registration flow — POST /parent/register/verify).
 *
 * [FIX-3] isNewUser always true — do NOT call fetchAndPersist here.
 *         Profile is a shell (first_name: "Student") until onboarding completes.
 *
 * After loginSuccess with isNewUser: true:
 *   AuthProvider → router.replace("/(app)/updates")
 *   updates.jsx → PATCH + fetchAndPersist + setIsNewUser(false)
 *   AuthProvider → router.replace("/(app)/home")
 *
 * NOTE: backend returns parent_id (snake_case) not parent.id — normalised here.
 */
export function useRegistrationSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);

    return async ({ parent_id, accessToken, refreshToken, expiresAt }) => {
        await loginSuccess(
            { id: parent_id },  // normalise snake_case → { id }
            accessToken,
            refreshToken,
            expiresAt,
            true,               // [FIX-3] isNewUser: always true for registration
        );
        // Do NOT fetchAndPersist — profile is empty shell, onboarding fills it
    };
}

// ── Hook: useLogout ───────────────────────────────────────────────────────────
/**
 * Clears both stores + calls backend logout (best-effort).
 * apiClient setLogoutHandler also calls this on 401 + failed refresh.
 */
export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);

    return async () => {
        try {
            const refreshToken = await storage.getRefreshToken();
            await authApi.logout(refreshToken); // best-effort — local clear happens regardless
        } catch { /* ignore */ }

        await Promise.allSettled([logout(), clearProfile()]);
    };
}

export default AuthProvider;