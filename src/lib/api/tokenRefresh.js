<<<<<<< HEAD
// tokenRefresh.js — Single canonical token refresh implementation.
// [F4] Previously duplicated between apiClient.js (attemptTokenRefresh) and
//      auth.api.js (refreshToken). Both files now import from here.
//      This breaks the circular import: auth.api → apiClient → auth.api.

import { jwtDecode } from "jwt-decode";
import { storage } from "../storage/storage";
import { ApiError, ApiErrorCode, authClient } from "./apiClient";

/**
 * Performs a silent token refresh using the stored refresh token.
 * Uses authClient (no interceptors, dedicated 10s timeout).
 *
 * On success: writes new tokens to SecureStore, returns new access token.
 * On failure: throws ApiError — callers must handle SESSION_EXPIRED.
 *
 * @returns {Promise<string>} new access token
 */
export async function attemptTokenRefresh() {
  // Atomic read — never read tokens separately to avoid TOCTOU race
  const { refreshToken } = await storage.getTokens();
  if (!refreshToken) {
    throw new ApiError(ApiErrorCode.SESSION_EXPIRED, 401);
  }

  let data;
  try {
    const response = await authClient.post("/auth/refresh", { refreshToken });
    data = response.data;
  } catch (err) {
    // Network or server error during refresh
    throw new ApiError(
      ApiErrorCode.SESSION_EXPIRED,
      err?.response?.status ?? 401,
      err,
    );
  }

  // Validate response shape
  if (
    typeof data?.accessToken !== "string" ||
    data.accessToken.trim() === "" ||
    typeof data?.refreshToken !== "string" ||
    data.refreshToken.trim() === ""
  ) {
    throw new ApiError("INVALID_REFRESH_RESPONSE", 401);
  }

  // Resolve expiresAt: prefer explicit server value, fall back to JWT decode
  let expiresAt;
  if (typeof data.expiresAt === "number" && data.expiresAt > 0) {
    expiresAt = data.expiresAt;
  } else {
    try {
      expiresAt = jwtDecode(data.accessToken).exp;
    } catch {
      throw new ApiError("INVALID_REFRESH_RESPONSE_EXP", 401);
    }
  }

  // Persist atomically — throws SecureStoreError on failure
  await storage.setTokens(data.accessToken, data.refreshToken, expiresAt);

  return data.accessToken;
}
=======
/**
 * lib/api/tokenRefresh.js
 *
 * Circular import fix:
 *   OLD: apiClient → authApi → apiClient  ← loop
 *   NEW: apiClient → tokenRefresh → bare axios  ← no loop
 *
 * Subscriber queue: if 5 requests 401 simultaneously, only ONE refresh
 * call goes to the backend. The other 4 queue up and receive the new
 * token the moment the refresh resolves.
 *
 * Backend contract (POST /auth/refresh):
 *   Request:  { refreshToken: string }           ← body, NOT cookie (React Native)
 *   Response: { success, data: { accessToken, refreshToken, expiresAt } }
 *   Side effect: old session deleted, new session created (rotation)
 *   Mobile MUST save new refreshToken — old one is now invalid.
 */

import { storage } from "@/lib/storage/storage";
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ── Subscriber queue ──────────────────────────────────────────────────────────

let _refreshing = false;
let _queue = []; // { resolve, reject }[]

const drainQueue = (token, err) => {
  _queue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(err),
  );
  _queue = [];
};

// ── Main ──────────────────────────────────────────────────────────────────────

/**
 * Called by apiClient interceptor on:
 *   a) 401 response (reactive)
 *   b) token < 5 min from expiry (proactive, request interceptor)
 *
 * Returns new accessToken on success.
 * On failure: clears auth storage (triggers AuthProvider redirect to login).
 */
export const refreshAccessToken = async () => {
  if (_refreshing) {
    return new Promise((resolve, reject) => {
      _queue.push({ resolve, reject });
    });
  }

  _refreshing = true;

  try {
    const refreshToken = await storage.getRefreshToken();

    if (!refreshToken) {
      // No refresh token — session is dead, force re-login
      await storage.clearAuth();
      const err = new Error("NO_REFRESH_TOKEN");
      drainQueue(null, err);
      throw err;
    }

    // Direct axios — bypasses apiClient interceptors to avoid recursion
    const res = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refreshToken }, // backend reads body.refreshToken (not cookie)
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10_000,
      },
    );

    // Backend returns: { success: true, data: { accessToken, refreshToken, expiresAt } }
    const data = res?.data?.data ?? res?.data;
    const newAccessToken = data?.accessToken ?? null;
    const newRefreshToken = data?.refreshToken ?? null;
    const expiresAt = data?.expiresAt ?? null;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error("MALFORMED_REFRESH_RESPONSE");
    }

    // Persist rotated tokens — old session already deleted on backend
    await storage.writeAuth({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    });

    drainQueue(newAccessToken, null);
    return newAccessToken;
  } catch (err) {
    // Refresh failed → wipe local auth → AuthProvider sees isAuthenticated=false → login screen
    await storage.clearAuth().catch(() => {});
    drainQueue(null, err);
    throw err;
  } finally {
    _refreshing = false;
  }
};
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
