/**
 * lib/storage/storage.js
 *
 * WHY ONE KEY INSTEAD OF THREE:
 * Original had 3 separate keys: auth_token_v1, refresh_token_v1, auth_token_meta_v1.
 * Problem: write could succeed for key 1 and fail for key 2 → partial auth state.
 * Fix: single JSON blob "auth_v1" — atomic read/write. Cold start = 1 SecureStore call.
 *
 * PROFILE SNAPSHOT:
 * Separate key "profile_v1" — different lifecycle (can wipe without logging out).
 * patchProfileStudent() updates a single student slice without a full re-fetch.
 *
 * SECURITY:
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY — tokens only readable while screen is unlocked.
 * Was AFTER_FIRST_UNLOCK before (too permissive — readable in background).
 */

import * as SecureStore from "expo-secure-store";

// ── Keys ──────────────────────────────────────────────────────────────────────
// Bump version suffix when the stored shape changes to avoid stale reads.

export const SK = Object.freeze({
  AUTH: "auth_v1", // { accessToken, refreshToken, expiresAt, user, isNewUser }
  PROFILE: "profile_v1", // { data: GET /parent/me response, savedAt: ISO string }
});

// ── SecureStore options ───────────────────────────────────────────────────────

const OPT = Object.freeze({
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// ── Error class ───────────────────────────────────────────────────────────────

export class StorageError extends Error {
  constructor(code, detail) {
    super(detail ?? code);
    this.name = "StorageError";
    this.code = code;
  }
}

// ── Concurrency lock ──────────────────────────────────────────────────────────
// All writes serialised. Reads are lock-free.

let _lock = Promise.resolve();

const withLock =
  (fn) =>
  async (...args) => {
    let release;
    const next = new Promise((r) => {
      release = r;
    });
    const prev = _lock;
    _lock = next;
    await prev;
    try {
      return await fn(...args);
    } finally {
      release();
    }
  };

// ── Low-level helpers — never throw ──────────────────────────────────────────

const _get = async (key) => {
  try {
    return await SecureStore.getItemAsync(key, OPT);
  } catch {
    return null;
  }
};

const _set = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value, OPT);
    return true;
  } catch {
    return false;
  }
};

const _del = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key, OPT);
  } catch {
    /* best-effort */
  }
};

const isValidExp = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

// ── Public API ────────────────────────────────────────────────────────────────

export const storage = Object.freeze({
  // ─── AUTH STATE ────────────────────────────────────────────────────────────

  /**
   * ONE SecureStore read on cold start instead of three.
   *
   * Returns null on first launch or after clearAuth().
   *
   * Shape (exactly mirrors backend verifyOtp + verifyRegistration response):
   *   accessToken  : string
   *   refreshToken : string
   *   expiresAt    : number   — Unix seconds (backend sends this directly)
   *   user         : { id: string, phone?: string }
   *   isNewUser    : boolean  — persisted so app-kill mid-onboarding recovers correctly
   */
  readAuth: async () => {
    try {
      const raw = await _get(SK.AUTH);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Merge-write auth state — only pass what changed, rest is preserved.
   * Example: after token refresh → writeAuth({ accessToken, refreshToken, expiresAt })
   * Example: after OTP verify    → writeAuth({ accessToken, refreshToken, expiresAt, user, isNewUser })
   */
  writeAuth: withLock(async (patch) => {
    let current = {};
    try {
      const raw = await _get(SK.AUTH);
      if (raw) current = JSON.parse(raw);
    } catch {
      /* start fresh */
    }

    const next = { ...current, ...patch };
    const ok = await _set(SK.AUTH, JSON.stringify(next));
    if (!ok) throw new StorageError("WRITE_FAILED", "Auth write failed");
  }),

  clearAuth: withLock(async () => {
    await _del(SK.AUTH);
  }),

  /**
   * True when both tokens present AND access token expires in > 60 seconds.
   * Used by auth.store.hydrate() to set isAuthenticated on cold start.
   */
  hasValidSession: async () => {
    try {
      const raw = await _get(SK.AUTH);
      if (!raw) return false;
      const { accessToken, refreshToken, expiresAt } = JSON.parse(raw);
      if (!accessToken || !refreshToken || !isValidExp(expiresAt)) return false;
      return expiresAt - Math.floor(Date.now() / 1000) > 60;
    } catch {
      return false;
    }
  },

  /**
   * True when access token expires in < 5 minutes.
   * apiClient request interceptor uses this for proactive refresh.
   */
  shouldProactivelyRefresh: async () => {
    try {
      const raw = await _get(SK.AUTH);
      if (!raw) return false;
      const { refreshToken, expiresAt } = JSON.parse(raw);
      if (!refreshToken || !isValidExp(expiresAt)) return false;
      return expiresAt - Math.floor(Date.now() / 1000) < 300;
    } catch {
      return false;
    }
  },

  getAccessToken: async () => {
    try {
      const raw = await _get(SK.AUTH);
      return raw ? (JSON.parse(raw).accessToken ?? null) : null;
    } catch {
      return null;
    }
  },

  getRefreshToken: async () => {
    try {
      const raw = await _get(SK.AUTH);
      return raw ? (JSON.parse(raw).refreshToken ?? null) : null;
    } catch {
      return null;
    }
  },

  // ─── PROFILE SNAPSHOT ──────────────────────────────────────────────────────

  /**
   * Persist full GET /parent/me response after login.
   * Cold-start reads this → zero API calls needed on reopen.
   */
  saveProfile: withLock(async (profileData) => {
    const payload = { data: profileData, savedAt: new Date().toISOString() };
    const ok = await _set(SK.PROFILE, JSON.stringify(payload));
    if (!ok) throw new StorageError("WRITE_FAILED", "Profile write failed");
  }),

  /** Returns { data, savedAt } or null. */
  readProfile: async () => {
    try {
      const raw = await _get(SK.PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Patch one student slice after PATCH /parent/student/:id.
   * Avoids a full re-fetch for small field updates.
   */
  patchProfileStudent: withLock(async (studentId, partial) => {
    try {
      const raw = await _get(SK.PROFILE);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.data.students = snap.data.students.map((s) =>
        s.id === studentId ? { ...s, ...partial } : s,
      );
      await _set(SK.PROFILE, JSON.stringify(snap));
    } catch {
      /* non-fatal — foreground refetch will correct */
    }
  }),

  /** True when no snapshot or snapshot older than maxAgeMs (default 30 min). */
  isProfileStale: async (maxAgeMs = 30 * 60 * 1000) => {
    try {
      const raw = await _get(SK.PROFILE);
      if (!raw) return true;
      const { savedAt } = JSON.parse(raw);
      return Date.now() - new Date(savedAt).getTime() > maxAgeMs;
    } catch {
      return true;
    }
  },

  clearProfile: withLock(async () => {
    await _del(SK.PROFILE);
  }),
});
