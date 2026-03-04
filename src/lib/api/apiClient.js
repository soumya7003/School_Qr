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
