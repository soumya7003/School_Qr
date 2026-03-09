<<<<<<< HEAD
// storage.js — Production Grade
// Fixes applied:
//   [F1] Added setItem / getItem / deleteItem for non-token secure KV
//   [F7] Changed AFTER_FIRST_UNLOCK → WHEN_UNLOCKED_THIS_DEVICE_ONLY
//   [F14] Documented clearAll concurrency assumption explicitly

import * as SecureStore from "expo-secure-store";

// ── Constants ─────────────────────────────────────────────────────────────────

const KEYS = Object.freeze({
  ACCESS_TOKEN: "auth_token_v1",
  REFRESH_TOKEN: "refresh_token_v1",
  TOKEN_META: "auth_token_meta_v1", // stores expiry + issued-at as JSON
});

const TOKEN_LENGTH = Object.freeze({ MIN: 36, MAX: 2048 });

// [F7] WHEN_UNLOCKED_THIS_DEVICE_ONLY: tokens only readable while screen is
//      unlocked — AFTER_FIRST_UNLOCK was too permissive for auth tokens.
const SECURE_OPTIONS = Object.freeze({
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// ── Typed errors ──────────────────────────────────────────────────────────────

export const StorageError = Object.freeze({
  INVALID_TOKEN: "STORAGE_ERR_INVALID_TOKEN",
  WRITE_FAILED: "STORAGE_ERR_WRITE_FAILED",
  CLEAR_FAILED: "STORAGE_ERR_CLEAR_FAILED",
  READ_FAILED: "STORAGE_ERR_READ_FAILED",
});

export class SecureStoreError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.name = "SecureStoreError";
    this.code = code;
  }
}

// ── Concurrency lock ──────────────────────────────────────────────────────────
// Serialises all locked operations — no parallel read/write races.
//
// [F14] CONCURRENCY CONTRACT: clearAll() is an internal helper called only
//       from within already-locked operations (setTokens, clearTokens).
//       It MUST NOT be called directly from outside a lock — doing so would
//       bypass the serialisation guarantee. All public write methods are
//       wrapped with withLock to enforce this.

let _mutex = Promise.resolve();

const withLock =
  (fn) =>
  async (...args) => {
    let release;
    const next = new Promise((r) => {
      release = r;
    });
    const current = _mutex;
    _mutex = next;
    await current;
    try {
      return await fn(...args);
    } finally {
      release();
    }
  };

// ── Validation ────────────────────────────────────────────────────────────────

const isValidToken = (token) => {
  if (typeof token !== "string") return false;
  if (token.length < TOKEN_LENGTH.MIN) return false;
  if (token.length > TOKEN_LENGTH.MAX) return false;
  // Control chars incl. \t (0x09), \n (0x0A) — header injection risk
  if (/[\x00-\x1F\x7F]/.test(token)) return false;
  // Printable ASCII only — rejects unicode, emoji, RTL markers
  if (/[^\x20-\x7E]/.test(token)) return false;
  return true;
};

const isValidExpiry = (expiresAt) =>
  typeof expiresAt === "number" && Number.isFinite(expiresAt) && expiresAt > 0;

// ── Internal helpers ──────────────────────────────────────────────────────────

const safeGet = async (key) => {
  try {
    return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  } catch {
    return null;
  }
};

const safeSet = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
    return true;
  } catch {
    return false;
  }
};

const safeDelete = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  } catch {
    // best-effort — if unreachable, stale key will fail auth on next use
  }
};

// [F14] Internal only — always call from within a withLock context.
const clearAll = async () => {
  await Promise.all([
    safeDelete(KEYS.ACCESS_TOKEN),
    safeDelete(KEYS.REFRESH_TOKEN),
    safeDelete(KEYS.TOKEN_META),
  ]);
};

// ── Public API ────────────────────────────────────────────────────────────────

export const storage = Object.freeze({
  // ── Token operations (auth-specific) ───────────────────────────────────────

  /**
   * Atomically writes access token, refresh token, and metadata.
   * Pattern: clear → write all → verify → rollback on any failure.
   */
  setTokens: withLock(async (accessToken, refreshToken, expiresAt) => {
    if (!isValidToken(accessToken) || !isValidToken(refreshToken)) {
      throw new SecureStoreError(StorageError.INVALID_TOKEN);
    }
    if (!isValidExpiry(expiresAt)) {
      throw new SecureStoreError(
        StorageError.INVALID_TOKEN,
        "Invalid expiresAt",
      );
    }

    await clearAll(); // crash here → user logged out — safe state

    const meta = JSON.stringify({
      expiresAt, // Unix seconds from JWT exp
      issuedAt: Math.floor(Date.now() / 1000),
    });

    const [accessOk, refreshOk, metaOk] = await Promise.all([
      safeSet(KEYS.ACCESS_TOKEN, accessToken),
      safeSet(KEYS.REFRESH_TOKEN, refreshToken),
      safeSet(KEYS.TOKEN_META, meta),
    ]);

    if (!accessOk || !refreshOk || !metaOk) {
      await clearAll(); // rollback — no partial auth state
      throw new SecureStoreError(StorageError.WRITE_FAILED);
    }
  }),

  /**
   * Atomically reads both tokens in one locked operation.
   * Use in refresh interceptors — never call getAccessToken/getRefreshToken
   * separately when you need both.
   */
  getTokens: withLock(async () => {
    const [accessToken, refreshToken] = await Promise.all([
      safeGet(KEYS.ACCESS_TOKEN),
      safeGet(KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  }),

  /** Single token reads — fine for non-refresh use cases */
  getAccessToken: () => safeGet(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => safeGet(KEYS.REFRESH_TOKEN),

  /** Token metadata — use to decide whether proactive refresh is needed. */
  getTokenMeta: async () => {
    try {
      const raw = await safeGet(KEYS.TOKEN_META);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!isValidExpiry(parsed?.expiresAt)) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * True only when both tokens exist AND access token is not expiring soon.
   * 60-second buffer gives time to refresh before the first request fails.
   */
  hasValidSession: async () => {
    const [access, refresh, metaRaw] = await Promise.all([
      safeGet(KEYS.ACCESS_TOKEN),
      safeGet(KEYS.REFRESH_TOKEN),
      safeGet(KEYS.TOKEN_META),
    ]);

    if (!access || !refresh) return false;

    try {
      const meta = JSON.parse(metaRaw ?? "{}");
      const nowSecs = Math.floor(Date.now() / 1000);
      const BUFFER = 60;
      if (!isValidExpiry(meta?.expiresAt)) return false;
      return meta.expiresAt - nowSecs > BUFFER;
    } catch {
      return false; // corrupted meta → force refresh
    }
  },

  /**
   * True when refresh token exists and access token is within 5 min of expiry.
   * Used by apiClient request interceptor for proactive refresh.
   */
  shouldRefresh: async () => {
    const [refresh, metaRaw] = await Promise.all([
      safeGet(KEYS.REFRESH_TOKEN),
      safeGet(KEYS.TOKEN_META),
    ]);

    if (!refresh) return false;

    try {
      const meta = JSON.parse(metaRaw ?? "{}");
      const nowSecs = Math.floor(Date.now() / 1000);
      if (!isValidExpiry(meta?.expiresAt)) return false;
      return meta.expiresAt - nowSecs < 300; // refresh if <5 min remaining
    } catch {
      return false;
    }
  },

  /** Clears all three token keys. Safe to call when already logged out. */
  clearTokens: withLock(clearAll),

  // ── [F1] General-purpose secure KV — for non-token sensitive data ──────────
  // Uses the same SECURE_OPTIONS (WHEN_UNLOCKED_THIS_DEVICE_ONLY).
  // Keys must not collide with KEYS.* above — callers are responsible.
  // Writes are NOT locked — these are independent of the token lock chain.
  // If you need atomic multi-key writes, use a single JSON-serialised key.

  /**
   * Write any string value under an arbitrary secure key.
   * @param {string} key    e.g. "parent_user_cache_v1"
   * @param {string} value  Must be a string — JSON.stringify objects first
   */
  setItem: async (key, value) => {
    if (typeof key !== "string" || key.trim() === "") {
      throw new SecureStoreError(StorageError.WRITE_FAILED, "Invalid key");
    }
    const ok = await safeSet(key, String(value));
    if (!ok) throw new SecureStoreError(StorageError.WRITE_FAILED);
  },

  /**
   * Read a value written by setItem.
   * @returns {string|null}
   */
  getItem: async (key) => {
    if (typeof key !== "string" || key.trim() === "") return null;
    return safeGet(key);
  },

  /**
   * Delete a value written by setItem.
   * Safe to call when key doesn't exist.
   */
  deleteItem: async (key) => {
    if (typeof key !== "string" || key.trim() === "") return;
    await safeDelete(key);
  },
});
=======
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
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
