/**
 * lib/api/apiClient.js
 *
 * Two clients:
 *   authClient  — no interceptors, used for /auth/refresh (avoids recursive loop)
 *   apiClient   — full interceptors, used for all protected routes
 *
 * Request interceptor:
 *   1. Attaches X-Request-ID for tracing
 *   2. Attaches AbortController for cancellation
 *   3. Proactively refreshes token if < 5 min from expiry
 *   4. Attaches Authorization: Bearer <token>
 *
 * Response interceptor:
 *   1. Cleans up AbortController on success AND all error paths
 *   2. On 401: refresh once → retry original request → logout if refresh fails
 *   3. On 502/503/504: exponential backoff retry (max 2 retries)
 *   4. Refresh failure cooldown: prevents double-refresh within 5 seconds
 */

import { storage } from "@/lib/storage/storage";
import axios from "axios";
import * as Crypto from "expo-crypto";
import { refreshAccessToken } from "./tokenRefresh";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL is not set. Check your .env file.");
}

// ── Config ────────────────────────────────────────────────────────────────────

const TIMEOUTS = Object.freeze({ DEFAULT: 15_000, AUTH: 10_000 });
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;
const COOLDOWN_MS = 5_000; // gap between refresh attempts

// ── Typed error ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(code, status = null, original = null) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.original = original;
  }
}

export const ApiCode = Object.freeze({
  SETUP_FAILED: "REQUEST_SETUP_FAILED",
  TIMEOUT: "REQUEST_TIMEOUT",
  NETWORK: "NETWORK_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  QUEUE_TIMEOUT: "REFRESH_QUEUE_TIMEOUT",
  CANCELLED: "REQUEST_CANCELLED",
});

// ── Auth client — isolated, no interceptors ───────────────────────────────────

export const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUTS.AUTH,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── Main client ───────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUTS.DEFAULT,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
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
// Decouples apiClient from the Zustand store.

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

// ── Request interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    // Unique request ID for tracing
    try {
      config.headers["X-Request-ID"] = Crypto.randomUUID();
    } catch {
      config.headers["X-Request-ID"] = `fb-${Date.now()}`;
    }

    // Attach AbortController
    const controller = new AbortController();
    config.signal = controller.signal;
    controllers.set(config.headers["X-Request-ID"], controller);

    try {
      const needsRefresh = await storage.shouldProactivelyRefresh();

      if (needsRefresh && !refresh.recentlyFailed) {
        if (!refresh.active) {
          refresh.begin();
          try {
            const token = await refreshAccessToken();
            refresh.resolve(token);
          } catch (err) {
            refresh.reject(err);
            // Fall through — request proceeds, 401 handler will handle it
          }
        } else {
          await refresh.enqueue(); // wait for in-flight refresh
        }
      }

      const token = await storage.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Fail open — let request go, 401 response handler will catch it
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

    // Always clean up AbortController regardless of error type
    cleanupController(reqId);

    if (axios.isCancel(err))
      return Promise.reject(new ApiError(ApiCode.CANCELLED, null, err));

    if (err.code === "ECONNABORTED")
      return Promise.reject(new ApiError(ApiCode.TIMEOUT, null, err));

    if (!err.response)
      return Promise.reject(new ApiError(ApiCode.NETWORK, null, err));

    const { status } = err.response;

    // ── 401: Refresh + retry ──────────────────────────────────────────────────
    if (status === 401 && !req._retry) {
      req._retry = true;

      // If refresh just failed → don't try again, logout immediately
      if (refresh.recentlyFailed) {
        await triggerLogout();
        return Promise.reject(new ApiError(ApiCode.SESSION_EXPIRED, 401, err));
      }

      // Another request is already refreshing — queue up
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

      // This request leads the refresh
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

    // ── 502/503/504: Exponential backoff retry ────────────────────────────────
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
