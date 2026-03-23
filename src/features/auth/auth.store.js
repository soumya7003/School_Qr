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

import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

const __DEV_BYPASS_AUTH__ = false;
const __DEV_USER__ = {
  id: "dev-parent-id",
  phone: "+919999999999",
  name: "Dev User",
  is_phone_verified: true,
};

const isValidUser = (u) =>
  u !== null &&
  typeof u === "object" &&
  typeof u.id === "string" &&
  u.id.trim() !== "";

export const useAuthStore = create((set, get) => {
  let _hydrationPromise = null;

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    isAuthenticated: __DEV_BYPASS_AUTH__,
    isHydrated: __DEV_BYPASS_AUTH__,
    isNewUser: false,
    parentUser: __DEV_BYPASS_AUTH__ ? __DEV_USER__ : null,

    // ── Hydrate ───────────────────────────────────────────────────────────────
    /**
     * Called once from root _layout.jsx on cold start.
     * Reads auth_v1 (tokens) and user_v1 (identity) in parallel.
     * If session expired → forces re-login.
     */
    hydrate: async () => {
      if (__DEV_BYPASS_AUTH__) return;
      if (_hydrationPromise) return _hydrationPromise;

      _hydrationPromise = (async () => {
        try {
          const [authState, user] = await Promise.all([
            storage.readAuth(),
            storage.readUser(),
          ]);

          const nowSecs = Math.floor(Date.now() / 1000);
          const hasSession =
            !!authState?.accessToken &&
            !!authState?.refreshToken &&
            typeof authState?.expiresAt === "number" &&
            authState.expiresAt - nowSecs > 60;

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
    /**
     * Called by useLoginSuccess (login) and useRegistrationSuccess (register).
     *
     * Writes tokens to auth_v1 and user to user_v1 in parallel.
     * Both keys stay safely under the 2048-byte SecureStore limit.
     */
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
    },

    // ── Set Is New User ───────────────────────────────────────────────────────
    /**
     * Called by updates.jsx after onboarding wizard completes.
     * Flips isNewUser → false to unlock the rest of the app.
     */
    setIsNewUser: async (val) => {
      const value = Boolean(val);
      set({ isNewUser: value });
      await storage.writeAuth({ isNewUser: value });
    },

    // ── Set Parent User ───────────────────────────────────────────────────────
    /**
     * Called by profile.store.fetchAndPersist() after GET /parents/me.
     * Enriches parentUser with phone + name (login only gives us { id }).
     */
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
    /**
     * Clears auth_v1 + user_v1 (SecureStore) + profile_v1 (MMKV).
     * isHydrated stays true so AuthProvider redirect fires immediately.
     */
    logout: async () => {
      await storage.clearAll(); // wipes all three keys
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
