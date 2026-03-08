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
