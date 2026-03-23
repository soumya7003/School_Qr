/**
 * providers/AuthProvider.jsx
 *
 * AuthProvider owns ALL post-auth navigation via a reactive useEffect guard.
 * No screen should call router.replace() after login/register — this fires automatically.
 *
 * Navigation logic:
 *   not hydrated              → wait (splash stays visible)
 *   not authenticated         → /(auth)/login
 *   authenticated + isNewUser → /(app)/updates  (wizard)
 *   authenticated + done      → /(app)/home
 */

import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { storage } from '@/lib/storage/storage';
import { router, useSegments } from 'expo-router';
import { createContext, useCallback, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isNewUser = useAuthStore((s) => s.isNewUser);
    const profileHydrated = useProfileStore((s) => s.isHydrated);
    const hasStudents = useProfileStore((s) => s.students.length > 0);

    const segments = useSegments();

    // ── Reactive navigation guard ──────────────────────────────────────────────
    // Waits for BOTH stores to be hydrated before making any routing decision.
    // This prevents flicker/redirect on cold start before state is loaded.
    useEffect(() => {
        if (!isHydrated || !profileHydrated) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';

        if (!isAuthenticated) {
            if (!inAuthGroup) router.replace('/(auth)/login');
            return;
        }

        if (isNewUser) {
            if (!profileHydrated || !hasStudents) return;
            if (segments[1] !== 'updates') router.replace('/(app)/updates');
        } else {
            // Fully onboarded
            if (!inAppGroup || segments[1] === 'updates') {
                router.replace('/(app)/home');
            }
        }
    }, [isAuthenticated, isHydrated, isNewUser, profileHydrated, hasStudents, segments]);
    
    return (
        <AuthContext.Provider value={null}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Used after OTP login verify.
 * Writes tokens to auth_v1, user identity to user_v1.
 * Then fetches full profile → saves to MMKV profile_v1.
 * fetchAndPersist auto-corrects isNewUser if setup_stage === 'COMPLETE'.
 * AuthProvider's useEffect then routes to /home or /updates.
 */
export function useLoginSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return useCallback(async ({ parent, accessToken, refreshToken, expiresAt, isNewUser }) => {
        await loginSuccess(
            { id: parent.id },
            accessToken,
            refreshToken,
            expiresAt,
            isNewUser ?? false,
        );
        // fetchAndPersist reconciles isNewUser with DB setup_stage
        // (see fetchAndPersist patch in profile.store.js)
        try {
            await fetchAndPersist();
        } catch {
            // Non-fatal — user is authenticated, profile loads on next open
        }
    }, [loginSuccess, fetchAndPersist]);
}

/**
 * Used after registration verify.
 * isNewUser is always true — routes to /updates wizard.
 * Profile is NOT fetched — wizard handles first data entry.
 */
export function useRegistrationSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return useCallback(async ({ parent_id, accessToken, refreshToken, expiresAt }) => {
        await loginSuccess(
            { id: parent_id },
            accessToken,
            refreshToken,
            expiresAt,
            true,
        );

        try {
            await fetchAndPersist(); // ✅ CRITICAL FIX
        } catch {
            // non-fatal
        }
    }, [loginSuccess, fetchAndPersist]);
}

/**
 * Full logout — best-effort server revocation, then wipe all local state.
 * storage.clearAll() wipes auth_v1 + user_v1 + profile_v1 atomically.
 */
export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);

    return useCallback(async () => {
        try {
            const refreshToken = await storage.getRefreshToken();
            if (refreshToken) await authApi.logout(refreshToken);
        } catch { /* best-effort — always clear local state */ }

        await Promise.allSettled([logout(), clearProfile()]);
    }, [logout, clearProfile]);
}

export default AuthProvider;