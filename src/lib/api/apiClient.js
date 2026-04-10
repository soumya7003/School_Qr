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
 *   5. Attaches X-Device-ID for device identification
 *   6. Attaches X-App-Version + X-Platform for server-side analytics
 *   7. Attaches AbortController for cancellation
 *   8. Proactively refreshes token if < 5 min from expiry
 *   9. Attaches Authorization: Bearer <token>
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

// Add device ID to auth client requests
authClient.interceptors.request.use(async (config) => {
  try {
    const fingerprint = await getDeviceFingerprint().catch(() => "unknown");
    config.headers["X-Device-ID"] = fingerprint;
    config.headers["X-Device-Fingerprint"] = fingerprint;
  } catch {
    config.headers["X-Device-ID"] = "unknown";
    config.headers["X-Device-Fingerprint"] = "unknown";
  }
  return config;
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
    config.headers["X-Timestamp"] = Date.now().toString();

    // 4. Device fingerprint and Device ID
    const fingerprint = await getCachedFingerprint();
    config.headers["X-Device-Fingerprint"] = fingerprint;
    config.headers["X-Device-ID"] = fingerprint; // ✅ ADDED: Required by backend

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
