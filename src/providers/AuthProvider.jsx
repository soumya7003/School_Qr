import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { storage } from '@/lib/storage/storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import { createContext, useCallback, useEffect, useRef } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const __DEV_BYPASS__ = false;

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isNewUser = useAuthStore((s) => s.isNewUser);

    const profileHydrated = useProfileStore((s) => s.isHydrated);
    const students = useProfileStore((s) => s.students);
    const lastRefreshTime = useProfileStore((s) => s.lastRefreshTime);

    const segments = useSegments();
    const navigationState = useRootNavigationState();

    const hasRedirected = useRef(false);

    const isFetching = useProfileStore((s) => s.isFetching);

    const hasChildren = students.length > 0;
    const hasCompleteProfile = __DEV_BYPASS__ ? true : (
        hasChildren && students.some((s) => s.first_name?.trim())
    );

    // Only redirect after we have data from API
    const readyToRedirect = isHydrated && profileHydrated && lastRefreshTime !== null && !isFetching;

    useEffect(() => {
        if (!navigationState?.key) return;
        if (!readyToRedirect) {
            console.log('[AuthProvider] Waiting for API...', { lastRefreshTime });
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        const currentScreen = segments[1];

        // ─── NOT AUTHENTICATED ─────────────────────────────────────
        if (!isAuthenticated) {
            if (!inAuthGroup) {
                console.log('[AuthProvider] Not authenticated → /login');
                router.replace('/(auth)/login');
            }
            return;
        }

        // ─── AUTHENTICATED ─────────────────────────────────────────

        // If we already redirected and user is navigating, don't interfere
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
        if (hasChildren && (isNewUser || !hasCompleteProfile)) {
            if (currentScreen !== 'updates') {
                console.log('[AuthProvider] Profile incomplete → /updates');
                router.replace('/(app)/updates');
                hasRedirected.current = true;
            }
            return;
        }

        // Case 3: Has children AND profile complete → Home
        if (hasChildren && hasCompleteProfile && !isNewUser) {
            if (!inAppGroup || currentScreen === undefined) {
                console.log('[AuthProvider] Complete → /home');
                router.replace('/(app)/home');
                hasRedirected.current = true;
            }
            return;
        }

    }, [
        navigationState?.key,
        isAuthenticated,
        readyToRedirect,
        isNewUser,
        students.length,
        hasCompleteProfile,
        segments,
    ]);

    return (
        <AuthContext.Provider value={null}>
            {children}
        </AuthContext.Provider>
    );
}

export function useLoginSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return useCallback(
        async ({ parent, accessToken, refreshToken, expiresAt, isNewUser }) => {
            await loginSuccess(
                { id: parent.id },
                accessToken,
                refreshToken,
                expiresAt,
                isNewUser ?? false
            );

            // ✅ Fetch profile and wait for it to complete
            try {
                await fetchAndPersist({ silent: false });
            } catch (err) {
                console.warn('[useLoginSuccess] Profile fetch failed:', err?.message);
            }
        },
        [loginSuccess, fetchAndPersist]
    );
}

export function useRegistrationSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);

    return useCallback(
        async ({ parent_id, accessToken, refreshToken, expiresAt }) => {
            await loginSuccess(
                { id: parent_id },
                accessToken,
                refreshToken,
                expiresAt,
                true
            );

            try {
                await fetchAndPersist({ silent: false });
            } catch (err) {
                console.warn('[useRegistrationSuccess] Profile fetch failed:', err?.message);
            }
        },
        [loginSuccess, fetchAndPersist]
    );
}

export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);

    return useCallback(async () => {
        try {
            const refreshToken = await storage.getRefreshToken();
            if (refreshToken) await authApi.logout(refreshToken);
        } catch { }

        await Promise.allSettled([logout(), clearProfile()]);
    }, [logout, clearProfile]);
}

export default AuthProvider;