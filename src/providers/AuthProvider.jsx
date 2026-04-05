import { authApi } from '@/features/auth/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { storage } from '@/lib/storage/storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import { createContext, useCallback, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // ✅ FIX: Only bypass in development, never in production
    const __DEV_BYPASS__ = __DEV__;

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    const profileHydrated = useProfileStore((s) => s.isHydrated);
    const students = useProfileStore((s) => s.students);

    const segments = useSegments();
    const navigationState = useRootNavigationState();

    // ✅ FIX: Profile complete check includes basic student info
    const isProfileComplete = __DEV_BYPASS__ ? true : (
        students.length > 0 &&
        students.some((s) =>
            s.first_name?.trim() &&
            s.class?.trim() &&
            s.setup_stage === 'COMPLETE'
        )
    );

    useEffect(() => {
        if (!navigationState?.key) return;
        if (!isHydrated || !profileHydrated) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        const onIndexScreen = segments[0] === undefined || segments[0] === '';

        // ─── NOT AUTHENTICATED ─────────────────────────────
        if (!isAuthenticated) {
            if (!inAuthGroup && !onIndexScreen) {
                router.replace('/(auth)/login');
            }
            return;
        }

        // ─── AUTHENTICATED BUT PROFILE NOT COMPLETE ───────
        if (!isProfileComplete) {
            if (segments[1] !== 'updates') {
                router.replace('/(app)/updates');
            }
            return;
        }

        // ─── PROFILE COMPLETE → NORMAL APP ────────────────
        if (!inAppGroup) {
            router.replace('/(app)/home');
        }

    }, [
        navigationState?.key,
        isAuthenticated,
        isHydrated,
        profileHydrated,
        segments,
        isProfileComplete,
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

            try {
                await fetchAndPersist();
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
                await fetchAndPersist();
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