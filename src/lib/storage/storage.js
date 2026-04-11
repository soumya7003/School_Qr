/**
 * lib/storage/storage.js
 *
 * DUAL-MODE STORAGE
 * ─────────────────────────────────────────────────────────────────────────────
 * Development (Expo Go):  AsyncStorage  — no native module, works in Expo Go
 * Production (dev build): MMKV          — encrypted, synchronous, no size limit
 *
 * IMPORTANT:
 *   AsyncStorage is async (returns Promises).
 *   MMKV is sync (returns values directly).
 *   Both are wrapped here so the rest of the codebase never knows the difference.
 *
 * SECURITY:
 *   Tokens stored in SecureStore (always encrypted).
 *   Profile blob stored in MMKV without encryption key (data is not sensitive).
 *   DO NOT hardcode encryption keys in source code.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// ── Mode detection ────────────────────────────────────────────────────────────
const USE_MMKV = !false;
const LAST_ACTIVE_CHILD_KEY = "last_active_child_v1";

// ── MMKV — lazy loaded only in production ────────────────────────────────────
let _mmkv = null;
const getMmkv = () => {
  if (_mmkv) return _mmkv;
  try {
    const { MMKV } = require("react-native-mmkv");
    _mmkv = new MMKV({
      id: "resqid_profile_store",
    });
    return _mmkv;
  } catch {
    return null;
  }
};

// ── SecureStore options ───────────────────────────────────────────────────────
const OPT = Object.freeze({
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// ── Key constants ─────────────────────────────────────────────────────────────
const SK = Object.freeze({
  AUTH: "auth_v1",
  USER: "user_v1",
});

const PK = Object.freeze({
  PROFILE: "profile_v1",
});

// ── SecureStore helpers — never throw ─────────────────────────────────────────
const _secGet = async (key) => {
  try {
    return await SecureStore.getItemAsync(key, OPT);
  } catch {
    return null;
  }
};
const _secSet = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value, OPT);
    return true;
  } catch {
    return false;
  }
};
const _secDel = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key, OPT);
  } catch {}
};

// ── Write lock for SecureStore ────────────────────────────────────────────────
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

// ── AsyncStorage profile helpers ──────────────────────────────────────────────
const _asyncGet = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};
const _asyncSet = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
};
const _asyncDel = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

// ── MMKV profile helpers ──────────────────────────────────────────────────────
const _mmkvGet = (key) => {
  try {
    return getMmkv()?.getString(key) ?? null;
  } catch {
    return null;
  }
};
const _mmkvSet = (key, value) => {
  try {
    getMmkv()?.set(key, value);
  } catch {}
};
const _mmkvDel = (key) => {
  try {
    getMmkv()?.delete(key);
  } catch {}
};

// ── Profile read/write — unified async API ────────────────────────────────────
const _profileGet = async (key) => {
  if (USE_MMKV) return _mmkvGet(key);
  return _asyncGet(key);
};
const _profileSet = async (key, value) => {
  if (USE_MMKV) {
    _mmkvSet(key, value);
    return;
  }
  return _asyncSet(key, value);
};
const _profileDel = async (key) => {
  if (USE_MMKV) {
    _mmkvDel(key);
    return;
  }
  return _asyncDel(key);
};

// ── Helper ────────────────────────────────────────────────────────────────────
const isValidExp = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

// ── Public API ────────────────────────────────────────────────────────────────
export const storage = Object.freeze({
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH TOKENS — SecureStore in BOTH modes
  // ═══════════════════════════════════════════════════════════════════════════

  readAuth: async () => {
    try {
      const raw = await _secGet(SK.AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  writeAuth: withLock(async (patch) => {
    try {
      const raw = await _secGet(SK.AUTH);
      const current = raw ? JSON.parse(raw) : {};
      const merged = { ...current, ...patch };

      if (!merged.accessToken && current?.accessToken) {
        return;
      }

      await _secSet(SK.AUTH, JSON.stringify(merged));
    } catch {}
  }),

  clearAuth: withLock(async () => {
    await _secDel(SK.AUTH);
  }),

  hasValidSession: async () => {
    try {
      const raw = await _secGet(SK.AUTH);
      if (!raw) return false;
      const { accessToken, refreshToken, expiresAt } = JSON.parse(raw);
      if (!accessToken || !refreshToken || !isValidExp(expiresAt)) return false;
      return expiresAt - Math.floor(Date.now() / 1000) > 60;
    } catch {
      return false;
    }
  },

  shouldProactivelyRefresh: async () => {
    try {
      const raw = await _secGet(SK.AUTH);
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
      const raw = await _secGet(SK.AUTH);
      return raw ? (JSON.parse(raw).accessToken ?? null) : null;
    } catch {
      return null;
    }
  },

  getRefreshToken: async () => {
    try {
      const raw = await _secGet(SK.AUTH);
      return raw ? (JSON.parse(raw).refreshToken ?? null) : null;
    } catch {
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER IDENTITY — SecureStore in BOTH modes
  // ═══════════════════════════════════════════════════════════════════════════

  readUser: async () => {
    try {
      const raw = await _secGet(SK.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  writeUser: withLock(async (user) => {
    try {
      if (!user?.id) return;
      await _secSet(SK.USER, JSON.stringify(user));
    } catch {}
  }),

  clearUser: withLock(async () => {
    await _secDel(SK.USER);
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE SNAPSHOT
  // ═══════════════════════════════════════════════════════════════════════════

  saveProfile: async (profileData) => {
    try {
      await _profileSet(
        PK.PROFILE,
        JSON.stringify({
          data: profileData,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {}
  },

  readProfile: async () => {
    try {
      const raw = await _profileGet(PK.PROFILE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  patchProfileStudent: async (studentId, partial) => {
    try {
      const raw = await _profileGet(PK.PROFILE);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.data.students = (snap.data.students ?? []).map((s) =>
        s.id === studentId ? { ...s, ...partial } : s,
      );
      await _profileSet(PK.PROFILE, JSON.stringify(snap));
    } catch {}
  },

  isProfileStale: async (maxAgeMs = 30 * 24 * 60 * 60 * 1000) => {
    try {
      const raw = await _profileGet(PK.PROFILE);
      if (!raw) return true;
      const { savedAt } = JSON.parse(raw);
      return Date.now() - new Date(savedAt).getTime() > maxAgeMs;
    } catch {
      return true;
    }
  },

  clearProfile: async () => {
    try {
      await _profileDel(PK.PROFILE);
    } catch {}
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAST ACTIVE CHILD — AsyncStorage (works in both dev and prod)
  // ═══════════════════════════════════════════════════════════════════════════

  setLastActiveChild: async (studentId) => {
    try {
      await AsyncStorage.setItem(LAST_ACTIVE_CHILD_KEY, studentId);
    } catch {}
  },

  getLastActiveChild: async () => {
    try {
      return await AsyncStorage.getItem(LAST_ACTIVE_CHILD_KEY);
    } catch {
      return null;
    }
  },

  clearLastActiveChild: async () => {
    try {
      await AsyncStorage.removeItem(LAST_ACTIVE_CHILD_KEY);
    } catch {}
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL WIPE — logout
  // ═══════════════════════════════════════════════════════════════════════════

  clearAll: async () => {
    await Promise.allSettled([
      _secDel(SK.AUTH),
      _secDel(SK.USER),
      _profileDel(PK.PROFILE),
      storage.clearLastActiveChild(),
    ]);
  },
});
