/**
 * src/providers/AuthProvider.jsx
 *
 * FIX: Stripped to a pure context wrapper.
 * Hydration moved to app/_layout.jsx (root layout).
 * Logout handler wired in root layout.
 * No logic here — just wraps children in context.
 */

import { authApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { storage } from "@/lib/storage/storage";
import { createContext } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    return (
        <AuthContext.Provider value={null}>
            {children}
        </AuthContext.Provider>
    );
}

export function useLoginSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
    return async ({ parent, accessToken, refreshToken, expiresAt, isNewUser }) => {
        await loginSuccess({ id: parent.id }, accessToken, refreshToken, expiresAt, isNewUser ?? false);
        await fetchAndPersist();
    };
}

export function useRegistrationSuccess() {
    const loginSuccess = useAuthStore((s) => s.loginSuccess);
    return async ({ parent_id, accessToken, refreshToken, expiresAt }) => {
        await loginSuccess({ id: parent_id }, accessToken, refreshToken, expiresAt, true);
    };
}

export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const clearProfile = useProfileStore((s) => s.clear);
    return async () => {
        try {
            const refreshToken = await storage.getRefreshToken();
            await authApi.logout(refreshToken);
        } catch { /* ignore */ }
        await Promise.allSettled([logout(), clearProfile()]);
    };
}

export default AuthProvider;