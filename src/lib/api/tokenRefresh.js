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
