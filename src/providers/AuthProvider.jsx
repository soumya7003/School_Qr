import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { storage } from '@/lib/storage/storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import { createContext, useCallback, useEffect, useRef } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const DEV_BYPASS = __DEV__ && false; // flip second flag per-dev

    // ── Auth store ────────────────────────────────────────────────────────────
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isNewUser = useAuthStore((s) => s.isNewUser);

    // ── Profile store (granular selectors — no full array subscription) ───────
    const profileHydrated = useProfileStore((s) => s.isHydrated);

    // FIX 1 & 4: Granular selectors declared BEFORE any useEffect that uses them
    const hasChildren = useProfileStore((s) => s.students.length > 0);
    const hasCompleteProfile = useProfileStore((s) =>
        DEV_BYPASS ||
        s.students.some(
            (st) => st.setup_stage === 'COMPLETE' || st.setup_stage === 'VERIFIED'
        )
    );

    // ── Navigation ────────────────────────────────────────────────────────────
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    // ── Redirect guard ────────────────────────────────────────────────────────
    const hasRedirected = useRef(false);

    // FIX 3: Reset redirect flag on ANY condition change, not just logout
    useEffect(() => {
        hasRedirected.current = false;
    }, [isAuthenticated, hasChildren, hasCompleteProfile, isNewUser]);

    // FIX 2: Route from cache immediately — don't gate on lastRefreshTime
    const readyToRedirect = isHydrated && profileHydrated;

    // ── Routing logic ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!navigationState?.key) return;
        if (!readyToRedirect) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        const currentScreen = segments[1];

        // ─── NOT AUTHENTICATED ────────────────────────────────────────────────
        if (!isAuthenticated) {
            if (!inAuthGroup) {
                console.log('[AuthProvider] Not authenticated → /login');
                router.replace('/(auth)/login');
            }
            return;
        }

        // ─── AUTHENTICATED ────────────────────────────────────────────────────

        // Don't interfere if already redirected and user is navigating freely
        if (hasRedirected.current && currentScreen !== undefined) {
            return;
        }

        // Case 1: No children → Add Child
        if (!hasChildren) {
            if (currentScreen !== 'add-child') {
                console.log('[AuthProvider] No children → /add-child');
                router.replace('/(app)/add-child');
                hasRedirected.current = true;
            }
            return;
        }

        // Case 2: Has children BUT new user OR profile incomplete → Updates
        if (isNewUser || !hasCompleteProfile) {
            if (currentScreen !== 'updates') {
                console.log('[AuthProvider] Profile incomplete → /updates');
                router.replace('/(app)/updates');
                hasRedirected.current = true;
            }
            return;
        }

        // Case 3: Has children AND profile complete → Home
        if (!inAppGroup || currentScreen === undefined) {
            console.log('[AuthProvider] Complete → /home');
            router.replace('/(app)/home');
            hasRedirected.current = true;
        }

    }, [
        navigationState?.key,
        isAuthenticated,
        readyToRedirect,
        isNewUser,
        hasChildren,
        hasCompleteProfile,
        segments,
    ]);

    // FIX 6: logout defined here so AuthContext.Provider value is valid
    const logout = useLogout();

    return (
        <AuthContext.Provider value={{ isAuthenticated, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Private shared hook (not exported) ───────────────────────────────────────
function usePostAuthSetup() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return useCallback(
        async ({ parent_id, accessToken, refreshToken, expiresAt, isNewUser = false }) => {
            await loginSuccess(
                { id: parent_id },
                accessToken,
                refreshToken,
                expiresAt,
                isNewUser
            );
            try {
                await fetchAndPersist({ silent: false });
            } catch (err) {
                // fetchAndPersist already sets lastRefreshTime on error internally
                console.warn('[usePostAuthSetup] Profile fetch failed:', err?.message);
            }
        },
        [loginSuccess, fetchAndPersist]
    );
}

// FIX 9: Deduplicated login/registration hooks via shared usePostAuthSetup
export function useLoginSuccess() {
    const setup = usePostAuthSetup();
    return useCallback(
        ({ parent, accessToken, refreshToken, expiresAt, isNewUser }) =>
            setup({
                parent_id: parent.id,
                accessToken,
                refreshToken,
                expiresAt,
                isNewUser,
            }),
        [setup]
    );
}

export function useRegistrationSuccess() {
    const setup = usePostAuthSetup();
    return useCallback(
        ({ parent_id, accessToken, refreshToken, expiresAt }) =>
            setup({
                parent_id,
                accessToken,
                refreshToken,
                expiresAt,
                isNewUser: true,
            }),
        [setup]
    );
}

// FIX 8: Logout no longer silently swallows errors
export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);

    return useCallback(async () => {
        try {
            const refreshToken = await storage.getRefreshToken();
            if (refreshToken) await authApi.logout(refreshToken);
        } catch (err) {
            console.warn('[useLogout] Token revocation failed:', err?.message);
        }

        await Promise.allSettled([logout(), clearProfile()]);
    }, [logout, clearProfile]);
}

export default AuthProvider;