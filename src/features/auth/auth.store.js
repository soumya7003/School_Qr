/**
 * features/auth/auth.store.js
 *
 * PRODUCTION — tokens in SecureStore, user identity in separate SecureStore key.
 *
 * STORAGE SPLIT (fixes 2048-byte SecureStore limit):
 *   auth_v1  → { accessToken, refreshToken, expiresAt, isNewUser }   ~200 bytes
 *   user_v1  → { id, phone, name, is_phone_verified }                ~100 bytes
 *
 * Both stay well under the 2048-byte limit.
 *
 * SESSION EXPIRY:
 *   Backend JWT expiresIn: '30d'. expiresAt = jwt.decode(token).exp (Unix seconds).
 *   hydrate() checks: expiresAt - now > 60s → valid session.
 *   If expired → isAuthenticated = false → redirect to login screen.
 */

import { registerPushToken } from "@/features/notifications/notification.service";
import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

// ✅ FIX: Only bypass in development, never in production
const __DEV_BYPASS_AUTH__ = false;

const isValidUser = (u) =>
  u !== null &&
  typeof u === "object" &&
  typeof u.id === "string" &&
  u.id.trim() !== "";

export const useAuthStore = create((set, get) => {
  let _hydrationPromise = null;

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    isAuthenticated: false,
    isHydrated: false,
    isNewUser: false,
    parentUser: null,

    // ── Hydrate ───────────────────────────────────────────────────────────────
    /**
     * Called once from root _layout.jsx on cold start.
     * Reads auth_v1 (tokens) and user_v1 (identity) in parallel.
     * If session expired → forces re-login.
     */
    hydrate: async () => {
      if (__DEV_BYPASS_AUTH__) {
        set({
          isAuthenticated: true,
          parentUser: {
            id: "dev-parent-id",
            phone: "+919876543210",
            name: "Priya Sharma", // ✅ Change from "Dev User"
            is_phone_verified: true,
          },
          isNewUser: false,
          isHydrated: true,
        });
        return;
      }
      if (_hydrationPromise) return _hydrationPromise;

      _hydrationPromise = (async () => {
        try {
          const [authState, user] = await Promise.all([
            storage.readAuth(),
            storage.readUser(),
          ]);

          const nowSecs = Math.floor(Date.now() / 1000);

          // ✅ FIXED: expiresAt can be null if backend omits it (e.g. verifyOtp
          // returns expires_at: null). Don't reject valid tokens just because
          // expiry info is missing — the apiClient interceptor handles real expiry.
          const tokensExist =
            !!authState?.accessToken && !!authState?.refreshToken;
          const notExpired =
            typeof authState?.expiresAt !== "number"
              ? true // no expiry stamp → trust the tokens, let server reject if needed
              : authState.expiresAt - nowSecs > 60;
          const hasSession = tokensExist && notExpired;

          set({
            isAuthenticated: hasSession,
            parentUser:
              hasSession && isValidUser(user) ? Object.freeze(user) : null,
            isNewUser: hasSession ? Boolean(authState?.isNewUser) : false,
            isHydrated: true,
          });
        } catch {
          set({
            isAuthenticated: false,
            parentUser: null,
            isNewUser: false,
            isHydrated: true,
          });
        } finally {
          _hydrationPromise = null;
        }
      })();

      return _hydrationPromise;
    },

    // ── Login Success ─────────────────────────────────────────────────────────
    loginSuccess: async (
      user,
      accessToken,
      refreshToken,
      expiresAt,
      isNewUser = false,
    ) => {
      const validUser = isValidUser(user) ? user : null;

      await Promise.all([
        storage.writeAuth({ accessToken, refreshToken, expiresAt, isNewUser }),
        validUser ? storage.writeUser(validUser) : Promise.resolve(),
      ]);

      set({
        isAuthenticated: true,
        parentUser: validUser ? Object.freeze(validUser) : null,
        isNewUser,
        isHydrated: true,
      });

      registerPushToken();
    },

    // ── Set Is New User ───────────────────────────────────────────────────────
    setIsNewUser: async (val) => {
      const value = Boolean(val);
      set({ isNewUser: value });
      await storage.writeAuth({ isNewUser: value });
    },

    // ── Set Parent User ───────────────────────────────────────────────────────
    setParentUser: async (user) => {
      if (!isValidUser(user)) {
        set({ parentUser: null });
        await storage.clearUser();
        return;
      }
      const frozen = Object.freeze(user);
      set({ parentUser: frozen });
      await storage.writeUser(user);
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    logout: async () => {
      await storage.clearAll();
      set({
        isAuthenticated: false,
        parentUser: null,
        isNewUser: false,
        isHydrated: true,
      });
      _hydrationPromise = null;
    },

    reset: () => {
      set({
        isAuthenticated: false,
        isHydrated: false,
        isNewUser: false,
        parentUser: null,
      });
      _hydrationPromise = null;
    },
  };
});

// ── Selectors ─────────────────────────────────────────────────────────────────
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
export const useIsNewUser = () => useAuthStore((s) => s.isNewUser);
export const useParentUserId = () =>
  useAuthStore((s) => s.parentUser?.id ?? null);
export const useAuthReady = () => useAuthStore((s) => s.isHydrated);
