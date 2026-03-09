<<<<<<< HEAD
// apiClient.js — Production Grade
// Fixes applied:
//   [F4]  attemptTokenRefresh moved to tokenRefresh.js — no duplication
//   [F8]  activeControllers cleaned up on ALL error paths, not just some
//   [F11] _lastRefreshFailAt cooldown prevents double-refresh after proactive
//         refresh failure + subsequent 401

import { storage } from "@/lib/storage/storage";
import axios from "axios";
import * as Crypto from "expo-crypto";
import { attemptTokenRefresh } from "./tokenRefresh";

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is not defined. Check your .env file.",
  );
}

const TIMEOUTS = Object.freeze({
  DEFAULT: 15_000,
  AUTH: 10_000,
  UPLOAD: 60_000,
});

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;

// ── [F11] Refresh failure cooldown ────────────────────────────────────────────
// If a proactive refresh in the request interceptor fails, and the server then
// returns 401, the response interceptor would attempt another refresh immediately.
// This cooldown prevents that double-attempt within 5 seconds.

let _lastRefreshFailAt = 0;
const REFRESH_COOLDOWN_MS = 5_000;

// ── Typed Errors ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(code, status = null, originalError = null) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}

export const ApiErrorCode = Object.freeze({
  REQUEST_SETUP_FAILED: "REQUEST_SETUP_FAILED",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  NETWORK_ERROR: "NETWORK_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  REFRESH_QUEUE_TIMEOUT: "REFRESH_QUEUE_TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
});

// ── Auth client — isolated, no interceptors ───────────────────────────────────
// Used only for token refresh. Never use apiClient for /auth/refresh —
// it would trigger the response interceptor recursively.

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.AUTH,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── Main client ───────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.DEFAULT,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── Cancellation ──────────────────────────────────────────────────────────────

const activeControllers = new Map();

export const cancelAllRequests = () => {
  activeControllers.forEach((c) => c.abort());
  activeControllers.clear();
};

// [F8] Centralised cleanup — call from BOTH success and error paths
const cleanupController = (reqId) => {
  if (reqId) activeControllers.delete(reqId);
};

// ── Refresh state ─────────────────────────────────────────────────────────────

const refreshState = (() => {
  let _isRefreshing = false;
  let _subscribers = [];

  return {
    get isRefreshing() {
      return _isRefreshing;
    },

    begin() {
      _isRefreshing = true;
    },

    resolve(newToken) {
      _subscribers.forEach(({ resolve, timerId }) => {
        clearTimeout(timerId);
        resolve(newToken);
      });
      _subscribers = [];
      _isRefreshing = false;
    },

    reject(err) {
      _subscribers.forEach(({ reject: rej, timerId }) => {
        clearTimeout(timerId);
        rej(err);
      });
      _subscribers = [];
      _isRefreshing = false;
      // [F11] Record failure time for cooldown check
      _lastRefreshFailAt = Date.now();
    },

    waitForToken(timeoutMs = 10_000) {
      return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => {
          reject(new ApiError(ApiErrorCode.REFRESH_QUEUE_TIMEOUT, 401));
        }, timeoutMs);
        _subscribers.push({ resolve, reject, timerId });
      });
    },
  };
})();

// ── Logout callback — decoupled from store ────────────────────────────────────
// Register with: setLogoutHandler(() => useAuthStore.getState().logout())
// Called in app root after store is initialised.

let _onLogout = null;
export const setLogoutHandler = (fn) => {
  _onLogout = fn;
};

const triggerLogout = async () => {
  try {
    await storage.clearTokens();
  } catch {
    /* best-effort */
  }
  _onLogout?.();
};

// ── Retry helper ──────────────────────────────────────────────────────────────

const isRetryable = (status) => [502, 503, 504].includes(status);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Request Interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    // Unique request ID for tracing and controller cleanup
    try {
      config.headers["X-Request-ID"] = Crypto.randomUUID();
    } catch {
      config.headers["X-Request-ID"] = `fallback-${Date.now()}`;
    }

    // Attach AbortController
    const controller = new AbortController();
    config.signal = controller.signal;
    activeControllers.set(config.headers["X-Request-ID"], controller);

    try {
      const needsRefresh = await storage.shouldRefresh();

      if (needsRefresh) {
        // [F11] Skip proactive refresh if one just failed — avoid thrash
        const recentlyFailed =
          Date.now() - _lastRefreshFailAt < REFRESH_COOLDOWN_MS;

        if (!recentlyFailed && !refreshState.isRefreshing) {
          refreshState.begin();
          try {
            const newToken = await attemptTokenRefresh(); // [F4] shared impl
            refreshState.resolve(newToken);
          } catch (err) {
            refreshState.reject(err); // sets _lastRefreshFailAt
          }
        } else if (refreshState.isRefreshing) {
          await refreshState.waitForToken();
        }
        // If recentlyFailed && !isRefreshing: fall through, send request
        // without refreshing — the 401 response handler will sort it out
      }

      const token = await storage.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Fail open — let request proceed, 401 handler will catch it
    }

    return config;
  },
  (error) =>
    Promise.reject(
      new ApiError(ApiErrorCode.REQUEST_SETUP_FAILED, null, error),
    ),
);

// ── Response Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    // [F8] Cleanup on success
    cleanupController(response.config?.headers?.["X-Request-ID"]);
    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const reqId = originalRequest?.headers?.["X-Request-ID"];

    // [F8] Cleanup on EVERY error path — was missing for non-401/non-5xx errors
    cleanupController(reqId);

    if (axios.isCancel(error)) {
      return Promise.reject(new ApiError("REQUEST_CANCELLED", null, error));
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new ApiError(ApiErrorCode.REQUEST_TIMEOUT, null, error),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError(ApiErrorCode.NETWORK_ERROR, null, error),
      );
    }

    const { status } = error.response;

    // ── 401 — Refresh + retry ─────────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // [F11] If refresh just failed, don't retry — go straight to logout
      if (Date.now() - _lastRefreshFailAt < REFRESH_COOLDOWN_MS) {
        await triggerLogout();
        return Promise.reject(
          new ApiError(ApiErrorCode.SESSION_EXPIRED, 401, error),
        );
      }

      if (refreshState.isRefreshing) {
        try {
          const newToken = await refreshState.waitForToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch {
          return Promise.reject(
            new ApiError(ApiErrorCode.SESSION_EXPIRED, 401, error),
          );
        }
      }

      refreshState.begin();

      try {
        const newToken = await attemptTokenRefresh(); // [F4] shared impl

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        const retryResponse = await apiClient(originalRequest);

        refreshState.resolve(newToken);
        return retryResponse;
      } catch {
        refreshState.reject(new ApiError(ApiErrorCode.SESSION_EXPIRED, 401));
        await triggerLogout();
        return Promise.reject(
          new ApiError(ApiErrorCode.SESSION_EXPIRED, 401, error),
        );
      }
    }

    // ── 5xx — Retry with exponential backoff ──────────────────────────────────
    if (isRetryable(status)) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      if (originalRequest._retryCount <= MAX_RETRIES) {
        const delay = RETRY_BASE_MS * 2 ** (originalRequest._retryCount - 1);
        await wait(delay);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(new ApiError(`HTTP_${status}`, status, error));
  },
);
=======
/**
 * src/lib/api/apiClient.js
 *
 * Two clients:
 *   authClient  — no interceptors, used for /auth/refresh (avoids recursive loop)
 *   apiClient   — full interceptors, used for all protected routes
 *
 * Request interceptor:
 *   1. Checks network connectivity — rejects immediately if offline
 *   2. Attaches X-Request-ID for tracing
 *   3. Attaches X-Timestamp for replay attack prevention
 *   4. Attaches X-Device-Fingerprint for single-device login enforcement
 *   5. Attaches X-App-Version + X-Platform for server-side analytics
 *   6. Attaches AbortController for cancellation
 *   7. Proactively refreshes token if < 5 min from expiry
 *   8. Attaches Authorization: Bearer <token>
 *
 * Response interceptor:
 *   1. Cleans up AbortController on success AND all error paths
 *   2. On 401: refresh once → retry original request → logout if refresh fails
 *   3. On 403: logout immediately (forbidden = session invalid on server)
 *   4. On 502/503/504: exponential backoff retry (max 2 retries)
 *   5. Refresh failure cooldown: prevents double-refresh within 5 seconds
 */

import { ApiCode } from "@/constants/constants";
import { getDeviceFingerprint } from "@/lib/security/deviceFingerprint";
import { storage } from "@/lib/storage/storage";
import { ApiError } from "@/utils/ApiError";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { refreshAccessToken } from "./tokenRefresh";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is not set. Check your .env file.");
}

// ── Config ────────────────────────────────────────────────────────────────────

const TIMEOUTS = Object.freeze({ DEFAULT: 15_000, AUTH: 10_000 });
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;
const COOLDOWN_MS = 5_000;

// ── Auth client — isolated, no interceptors ───────────────────────────────────
// Used ONLY for /auth/refresh to avoid triggering the 401 retry loop.

export const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUTS.AUTH,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── Main client ───────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUTS.DEFAULT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request cancellation ──────────────────────────────────────────────────────

const controllers = new Map(); // reqId → AbortController

export const cancelAllRequests = () => {
  controllers.forEach((c) => c.abort());
  controllers.clear();
};

const cleanupController = (reqId) => {
  if (reqId) controllers.delete(reqId);
};

// ── Refresh state ─────────────────────────────────────────────────────────────
// Single in-flight refresh with subscriber queue for concurrent 401s.

const refresh = (() => {
  let _active = false;
  let _subscribers = [];
  let _lastFailAt = 0;

  return {
    get active() {
      return _active;
    },
    get recentlyFailed() {
      return Date.now() - _lastFailAt < COOLDOWN_MS;
    },

    begin() {
      _active = true;
    },

    resolve(token) {
      _subscribers.forEach(({ resolve: res, timer }) => {
        clearTimeout(timer);
        res(token);
      });
      _subscribers = [];
      _active = false;
    },

    reject(err) {
      _subscribers.forEach(({ reject: rej, timer }) => {
        clearTimeout(timer);
        rej(err);
      });
      _subscribers = [];
      _active = false;
      _lastFailAt = Date.now();
    },

    enqueue(timeoutMs = 10_000) {
      return new Promise((res, rej) => {
        const timer = setTimeout(
          () => rej(new ApiError(ApiCode.QUEUE_TIMEOUT, 401)),
          timeoutMs,
        );
        _subscribers.push({ resolve: res, reject: rej, timer });
      });
    },
  };
})();

// ── Logout callback ───────────────────────────────────────────────────────────
// Registered from root _layout.jsx after store is initialised.

let _onLogout = null;
export const setLogoutHandler = (fn) => {
  _onLogout = fn;
};

const triggerLogout = async () => {
  await storage.clearAuth().catch(() => {});
  _onLogout?.();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isRetryable = (status) => [502, 503, 504].includes(status);

// Cache fingerprint in memory — no need to hit SecureStore on every request
let _cachedFingerprint = null;
const getCachedFingerprint = async () => {
  if (!_cachedFingerprint) {
    _cachedFingerprint = await getDeviceFingerprint().catch(() => "unknown");
  }
  return _cachedFingerprint;
};

// ── Request interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    // 1. Network check — reject immediately if offline
    const netState = await NetInfo.fetch().catch(() => null);
    if (netState && !netState.isConnected) {
      return Promise.reject(new ApiError(ApiCode.OFFLINE, null, null));
    }

    // 2. Unique request ID for distributed tracing
    try {
      config.headers["X-Request-ID"] = Crypto.randomUUID();
    } catch {
      config.headers["X-Request-ID"] = `fb-${Date.now()}`;
    }

    // 3. Timestamp — backend can reject requests older than N seconds
    //    Prevents replay attacks where attacker re-sends captured requests
    config.headers["X-Timestamp"] = Date.now().toString();

    // 4. Device fingerprint — backend enforces single-device login
    //    Backend middleware: reject if fingerprint != session's registered fingerprint
    const fingerprint = await getCachedFingerprint();
    config.headers["X-Device-Fingerprint"] = fingerprint;

    // 5. App metadata — useful for server-side analytics + version gating
    config.headers["X-App-Version"] =
      Application.nativeApplicationVersion ?? "unknown";
    config.headers["X-Platform"] = Platform.OS;

    // 6. Attach AbortController for request cancellation
    const controller = new AbortController();
    config.signal = controller.signal;
    controllers.set(config.headers["X-Request-ID"], controller);

    try {
      // 7. Proactively refresh token if expiring soon
      const needsRefresh = await storage.shouldProactivelyRefresh();

      if (needsRefresh && !refresh.recentlyFailed) {
        if (!refresh.active) {
          refresh.begin();
          try {
            const token = await refreshAccessToken();
            refresh.resolve(token);
          } catch (err) {
            refresh.reject(err);
            // Fall through — let 401 response handler deal with it
          }
        } else {
          await refresh.enqueue();
        }
      }

      // 8. Attach access token
      const token = await storage.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Fail open — let request proceed, 401 handler will catch expired token
    }

    return config;
  },
  (err) => Promise.reject(new ApiError(ApiCode.SETUP_FAILED, null, err)),
);

// ── Response interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (res) => {
    cleanupController(res.config?.headers?.["X-Request-ID"]);
    return res;
  },

  async (err) => {
    const req = err.config;
    const reqId = req?.headers?.["X-Request-ID"];

    // Always clean up AbortController
    cleanupController(reqId);

    if (axios.isCancel(err))
      return Promise.reject(new ApiError(ApiCode.CANCELLED, null, err));

    if (err.code === "ECONNABORTED")
      return Promise.reject(new ApiError(ApiCode.TIMEOUT, null, err));

    if (!err.response)
      return Promise.reject(new ApiError(ApiCode.NETWORK, null, err));

    const { status } = err.response;

    // ── 401: Token expired — refresh + retry ──────────────────────────────────
    if (status === 401 && !req._retry) {
      req._retry = true;

      if (refresh.recentlyFailed) {
        await triggerLogout();
        return Promise.reject(new ApiError(ApiCode.SESSION_EXPIRED, 401, err));
      }

      if (refresh.active) {
        try {
          const token = await refresh.enqueue();
          req.headers.Authorization = `Bearer ${token}`;
          return apiClient(req);
        } catch {
          return Promise.reject(
            new ApiError(ApiCode.SESSION_EXPIRED, 401, err),
          );
        }
      }

      refresh.begin();
      try {
        const token = await refreshAccessToken();
        req.headers.Authorization = `Bearer ${token}`;
        const retried = await apiClient(req);
        refresh.resolve(token);
        return retried;
      } catch {
        refresh.reject(new ApiError(ApiCode.SESSION_EXPIRED, 401));
        await triggerLogout();
        return Promise.reject(new ApiError(ApiCode.SESSION_EXPIRED, 401, err));
      }
    }

    // ── 403: Forbidden — device fingerprint mismatch or account suspended ─────
    // This fires when backend rejects the X-Device-Fingerprint header,
    // meaning this account is now logged in on a different device.
    if (status === 403) {
      await triggerLogout();
      return Promise.reject(new ApiError(ApiCode.FORBIDDEN, 403, err));
    }

    // ── 502/503/504: Server down — exponential backoff retry ──────────────────
    if (isRetryable(status)) {
      req._retryCount = (req._retryCount ?? 0) + 1;
      if (req._retryCount <= MAX_RETRIES) {
        await wait(RETRY_BASE_MS * 2 ** (req._retryCount - 1));
        return apiClient(req);
      }
    }

    return Promise.reject(new ApiError(`HTTP_${status}`, status, err));
  },
);
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
