/**
 * features/auth/auth.store.js
 *
 * Responsibilities:
 *   - isAuthenticated / isNewUser / parentUser in memory
 *   - Hydrate from SecureStore on cold start (ONE read via storage.readAuth)
 *   - loginSuccess: persist tokens + user to SecureStore, update state
 *   - setIsNewUser: called by updates.jsx after onboarding completes
 *   - logout: clear SecureStore + state
 *
 * WHAT THIS STORE DOES NOT DO (compared to original):
 *   - No jwt-decode — expiresAt comes directly from backend (expiresAt field)
 *   - No separate cache key — user is stored inside the single auth_v1 blob
 *   - No internal mutex — storage.writeAuth() already serialises writes
 *   - No setLoading — screens manage their own loading state
 */

import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

// ── Validation ────────────────────────────────────────────────────────────────
// Relaxed: phone is optional — backend only returns { id } in parent object.
// Phone is populated later from GET /parent/me via profile.store.

const isValidUser = (u) =>
  u !== null &&
  typeof u === "object" &&
  typeof u.id === "string" &&
  u.id.trim() !== "";

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => {
  let _hydrationPromise = null;

  return {
    // ── State ─────────────────────────────────────────────────────────────────
    isAuthenticated: false,
    isHydrated: false,
    isNewUser: false,
    parentUser: null, // { id, phone? } — minimal, full profile in profile.store

    // ── Hydrate ───────────────────────────────────────────────────────────────
    /**
     * Called once from AuthProvider on cold start.
     * ONE SecureStore read → sets all auth state synchronously.
     *
     * isNewUser is persisted — if parent killed app during onboarding,
     * they're correctly routed back to /updates on next open.
     */
    hydrate: async () => {
      if (_hydrationPromise) return _hydrationPromise;

      _hydrationPromise = (async () => {
        try {
          const authState = await storage.readAuth(); // single read
          const hasSession = authState
            ? authState.expiresAt - Math.floor(Date.now() / 1000) > 60 &&
              !!authState.accessToken &&
              !!authState.refreshToken
            : false;

          set({
            isAuthenticated: hasSession,
            parentUser:
              hasSession && isValidUser(authState?.user)
                ? Object.freeze(authState.user)
                : null,
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
     * Called by useLoginSuccess (login) and useRegistrationSuccess (register)
     * in AuthProvider — NOT called directly from otp.jsx.
     *
     * Persists tokens + user + isNewUser to SecureStore in a single writeAuth call.
     */
    loginSuccess: async (
      user,
      accessToken,
      refreshToken,
      expiresAt,
      isNewUser = false,
    ) => {
      const validUser = isValidUser(user) ? user : null;

      // Single write — atomically stores everything together
      await storage.writeAuth({
        accessToken,
        refreshToken,
        expiresAt,
        user: validUser,
        isNewUser,
      });

      set({
        isAuthenticated: true,
        parentUser: validUser ? Object.freeze(validUser) : null,
        isNewUser,
        isHydrated: true,
      });
    },

    // ── Set Is New User ───────────────────────────────────────────────────────
    /**
     * Called by updates.jsx after onboarding PATCH + fetchAndPersist completes.
     * Flipping isNewUser to false unlocks the rest of the app.
     * Persisted immediately so app-kill after onboarding won't re-trigger it.
     */
    setIsNewUser: async (val) => {
      const value = Boolean(val);
      set({ isNewUser: value });
      await storage.writeAuth({ isNewUser: value });
    },

    // ── Set Parent User ───────────────────────────────────────────────────────
    /**
     * Called by profile.store after GET /parent/me returns phone + full data.
     */
    setParentUser: async (user) => {
      if (!isValidUser(user)) {
        set({ parentUser: null });
        await storage.writeAuth({ user: null });
        return;
      }
      set({ parentUser: Object.freeze(user) });
      await storage.writeAuth({ user });
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    /**
     * Clears SecureStore + resets state.
     * isHydrated stays true so AuthProvider redirect fires immediately.
     */
    logout: async () => {
      await Promise.allSettled([storage.clearAuth(), storage.clearProfile()]);
      set({
        isAuthenticated: false,
        parentUser: null,
        isNewUser: false,
        isHydrated: true, // must stay true — AuthProvider needs it to redirect
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

/** True when hydration is complete and ready to render screens. */
export const useAuthReady = () => useAuthStore((s) => s.isHydrated);
