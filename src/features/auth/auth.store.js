// auth.store.js — Production Grade
// Fixes applied:
//   [F1]  storage.setItem / getItem / deleteItem now exist in storage.js
//   [F2]  jwt-decode install: npm install jwt-decode
//   [F6]  logout no longer sets isHydrated:false — was blocking AuthProvider
//         redirect to login screen after logout
//   [F12] cleanup() exported for test teardown — clears dangling setLoading timer

import { storage } from "@/lib/storage/storage";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode
import { create } from "zustand";

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_TIMEOUT_MS = 15_000;
const USER_CACHE_KEY = "parent_user_cache_v1";

const INITIAL_STATE = {
  isAuthenticated: false,
  isHydrated: false,
  parentUser: null,
  isLoading: false,
};

// ── Validation ────────────────────────────────────────────────────────────────
// Aligned with ParentUser schema: id (required), phone (required), name (optional)

const isValidUser = (user) => {
  if (user === null || typeof user !== "object") return false;
  if (typeof user.id !== "string" || user.id.trim() === "") return false;
  if (typeof user.phone !== "string" || user.phone.trim() === "") return false;
  if (
    user.name !== undefined &&
    user.name !== null &&
    typeof user.name !== "string"
  )
    return false;
  return true;
};

// ── User cache helpers ────────────────────────────────────────────────────────
// [F1] These now work — storage.setItem/getItem/deleteItem exist in storage.js

const persistUser = async (user) => {
  try {
    await storage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Non-fatal — user will be null on next cold start, re-populated from API
  }
};

const loadPersistedUser = async () => {
  try {
    const raw = await storage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const clearPersistedUser = async () => {
  try {
    await storage.deleteItem(USER_CACHE_KEY);
  } catch {
    // best-effort
  }
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => {
  // Mutex lives in store closure — resets with store, testable
  let _mutex = Promise.resolve();
  let _hydrationPromise = null;
  let _loadingTimer = null;

  const withLock =
    (fn) =>
    async (...args) => {
      let release;
      const next = new Promise((r) => {
        release = r;
      });
      const prev = _mutex;
      _mutex = next;
      await prev;
      try {
        return await fn(...args);
      } finally {
        release();
      }
    };

  return {
    ...INITIAL_STATE,

    // ── Hydrate ───────────────────────────────────────────────────────────────
    // Deduplicates concurrent calls. Loads persisted user for cold-start UX.

    hydrate: async () => {
      if (_hydrationPromise) return _hydrationPromise;

      _hydrationPromise = (async () => {
        try {
          const [hasSession, cachedUser] = await Promise.all([
            storage.hasValidSession(),
            loadPersistedUser(),
          ]);
          set({
            isAuthenticated: hasSession,
            parentUser:
              hasSession && cachedUser ? Object.freeze(cachedUser) : null,
            isHydrated: true,
          });
        } catch {
          set({ isAuthenticated: false, parentUser: null, isHydrated: true });
        } finally {
          _hydrationPromise = null;
        }
      })();

      return _hydrationPromise;
    },

    // ── Login Success ─────────────────────────────────────────────────────────
    // Decodes expiresAt from JWT — required by storage.setTokens.
    // Persists tokens first (fail-closed) then updates React state.

    loginSuccess: withLock(async (user, accessToken, refreshToken) => {
      let expiresAt;
      try {
        expiresAt = jwtDecode(accessToken).exp;
      } catch {
        throw new Error("LOGIN_ERR_INVALID_ACCESS_TOKEN");
      }

      await storage.setTokens(accessToken, refreshToken, expiresAt);

      const validUser = isValidUser(user) ? user : null;
      await persistUser(validUser);

      set({
        isAuthenticated: true,
        parentUser: validUser ? Object.freeze(validUser) : null,
        isHydrated: true,
      });
    }),

    // ── Logout ────────────────────────────────────────────────────────────────
    // [F6] isHydrated stays TRUE — AuthProvider route guard requires it to
    //      be true to fire the redirect to login. Setting it false was silently
    //      blocking the logout redirect.
    // _hydrationPromise reset so next login re-runs hydrate() fully.

    logout: withLock(async () => {
      try {
        await Promise.all([storage.clearTokens(), clearPersistedUser()]);
      } finally {
        set({
          isAuthenticated: false,
          parentUser: null,
          isHydrated: true, // [F6] keep true — do NOT set false here
        });
        _hydrationPromise = null;
      }
    }),

    // ── Set Parent User ───────────────────────────────────────────────────────

    setParentUser: async (user) => {
      if (!isValidUser(user)) {
        set({ parentUser: null });
        await clearPersistedUser();
        return;
      }
      set({ parentUser: Object.freeze(user) });
      await persistUser(user);
    },

    // ── Set Loading ───────────────────────────────────────────────────────────
    // Clears previous timer before setting a new one — no stacking.
    // [F12] Timer ID exposed via cleanup() for test teardown.

    setLoading: (val) => {
      if (_loadingTimer) {
        clearTimeout(_loadingTimer);
        _loadingTimer = null;
      }
      set({ isLoading: Boolean(val) });
      if (val) {
        _loadingTimer = setTimeout(() => {
          _loadingTimer = null;
          if (get().isLoading) set({ isLoading: false });
        }, LOADING_TIMEOUT_MS);
      }
    },

    // [F12] Call in test afterEach / afterAll to prevent timer leaks
    cleanup: () => {
      if (_loadingTimer) {
        clearTimeout(_loadingTimer);
        _loadingTimer = null;
      }
    },
  };
});

// ── Selectors ─────────────────────────────────────────────────────────────────
// Subscribe to slices — not the whole store — to prevent unnecessary re-renders.

export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
export const useParentUser = () => useAuthStore((s) => s.parentUser);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);

// Derived selector — true when app is ready to show auth/app screens
export const useAuthReady = () =>
  useAuthStore((s) => s.isHydrated && !s.isLoading);
