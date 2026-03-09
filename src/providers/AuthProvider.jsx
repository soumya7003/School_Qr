<<<<<<< HEAD
// AuthProvider.jsx — Production Grade
// Fixes applied:
//   [F3]  useNavigationContainerRef replaced with useRootNavigationState.
//         navigationRef.isReady() never worked in Expo Router (no NavigationContainer
//         to attach to) — routerReady never became true, splash never hid.
//   [F5]  Segment dependency uses segments[0] (stable string) not segments (new
//         array ref every render) — redirect now fires reliably on cold boot.
//   [F6]  Route guard works correctly after logout because isHydrated stays true.
//   [F13] useNavigationContainerRef removed — wrong import source for Expo Router.

import { useAuthStore } from "@/features/auth/auth.store";
import { setLogoutHandler } from "@/lib/api/apiClient";
import {
    useRootNavigationState, // [F3] correct API for Expo Router
    useRouter,
    useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

// ── Splash Screen ─────────────────────────────────────────────────────────────
SplashScreen.preventAutoHideAsync();

// ── Route config ──────────────────────────────────────────────────────────────
const PUBLIC_GROUPS = new Set(["(auth)"]);
const DEFAULT_AUTH_ROUTE = "/(auth)/login";
const DEFAULT_APP_ROUTE = "/(app)/home";
const HYDRATION_TIMEOUT_MS = 8_000;

// ── Auth Gate Context ─────────────────────────────────────────────────────────
const AuthGateContext = createContext({
    isReady: false,
    isHydrated: false,
    isRouterReady: false,
});

export const useAuthGate = () => useContext(AuthGateContext);

// ── Provider ──────────────────────────────────────────────────────────────────

export default function AuthProvider({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const hydrate = useAuthStore((s) => s.hydrate);
    const logout = useAuthStore((s) => s.logout);

    const router = useRouter();
    const segments = useSegments();

    // [F3] useRootNavigationState gives us a stable key when the navigator
    //      is mounted and ready — no NavigationContainer ref needed in Expo Router
    const rootNavState = useRootNavigationState();
    const [routerReady, setRouterReady] = useState(false);

    const lastRedirectRef = useRef({ target: null, wasAuthenticated: null });
    const pendingDeepLinkRef = useRef(null);

    // ── 1. Register logout handler with apiClient (decoupled) ─────────────────
    useEffect(() => {
        setLogoutHandler(() => logout());
    }, [logout]);

    // ── 2. Hydrate on mount with timeout fallback ─────────────────────────────
    useEffect(() => {
        hydrate();

        const timer = setTimeout(() => {
            if (!useAuthStore.getState().isHydrated) {
                useAuthStore.setState({
                    isAuthenticated: false,
                    parentUser: null,
                    isHydrated: true,
                });
            }
        }, HYDRATION_TIMEOUT_MS);

        return () => clearTimeout(timer);
    }, [hydrate]);

    // ── 3. [F3] Track router readiness via navigation state key ───────────────
    // rootNavState.key is set when the root navigator has mounted and is ready.
    // This is the correct Expo Router idiom — no navigationRef needed.
    useEffect(() => {
        if (rootNavState?.key) setRouterReady(true);
    }, [rootNavState?.key]);

    // ── 4. Dismiss splash when hydrated + router ready ────────────────────────
    useEffect(() => {
        if (isHydrated && routerReady) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [isHydrated, routerReady]);

    // ── 5. Auth-based redirect ────────────────────────────────────────────────
    // [F5] segments[0] is a stable string — using segments (array) as dependency
    //      causes the effect to miss re-runs because the array is a new ref even
    //      when contents are identical.
    // [F6] Works correctly after logout because isHydrated is now kept true in
    //      auth.store.js logout() — the guard no longer early-returns.

    const currentGroup = segments[0];

    useEffect(() => {
        if (!isHydrated || !routerReady) return;
        if (!currentGroup) return;

        const inPublicGroup = PUBLIC_GROUPS.has(currentGroup);
        let target = null;

        if (!isAuthenticated && !inPublicGroup) {
            const intendedPath = "/" + segments.join("/");
            if (intendedPath !== DEFAULT_AUTH_ROUTE) {
                pendingDeepLinkRef.current = intendedPath;
            }
            target = DEFAULT_AUTH_ROUTE;
        } else if (isAuthenticated && inPublicGroup) {
            target = pendingDeepLinkRef.current ?? DEFAULT_APP_ROUTE;
            pendingDeepLinkRef.current = null;
        }

        if (!target) {
            lastRedirectRef.current = { target: null, wasAuthenticated: null };
            return;
        }

        const last = lastRedirectRef.current;

        // Only skip if BOTH target AND auth state are identical — prevents flicker
        if (target === last.target && isAuthenticated === last.wasAuthenticated) {
            return;
        }

        lastRedirectRef.current = { target, wasAuthenticated: isAuthenticated };
        router.replace(target);

        // router intentionally omitted from deps — not referentially stable
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isHydrated, routerReady, currentGroup]);

    // ── 6. Context value ──────────────────────────────────────────────────────
    return (
        <AuthGateContext.Provider
            value={{
                isReady: isHydrated && routerReady,
                isHydrated,
                isRouterReady: routerReady,
            }}
        >
            {children}
        </AuthGateContext.Provider>
    );
}
=======
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
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
