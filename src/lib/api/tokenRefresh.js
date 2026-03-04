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
