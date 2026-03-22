/**
 * features/auth/auth.api.js
 *
 * Covers the LOGIN flow only (existing parent or auto-register on first login).
 * REGISTRATION flow (new card) lives in features/profile/profile.api.js.
 *
 * Backend response shapes (verified against auth.controller.js):
 *
 * POST /auth/send-otp
 *   → { success, data: { isNewUser } }
 *
 * POST /auth/verify-otp
 *   → { success, data: { accessToken, refreshToken, expiresAt, isNewUser, parent: { id } } }
 *   NOTE: expiresAt = Unix seconds (backend calls jwt.decode().exp directly)
 *
 * POST /auth/refresh  ← handled by tokenRefresh.js, not here
 *
 * POST /auth/logout
 *   → { success, message }
 */

import { authClient } from "@/lib/api/apiClient";

// ── Validators (fail-fast on unexpected shapes) ───────────────────────────────

const assertVerifyResponse = (data) => {
  if (!data?.accessToken) throw new Error("AUTH: missing accessToken");
  if (!data?.refreshToken) throw new Error("AUTH: missing refreshToken");
  if (!data?.parent?.id) throw new Error("AUTH: missing parent.id");
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/send-otp
   * Returns { isNewUser } — frontend can show hint ("welcome back" vs "new account")
   * but does NOT use isNewUser for routing here (that comes after verifyOtp).
   */
  sendOtp: async (phone) => {
    const res = await authClient.post("/auth/send-otp", { phone });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /auth/verify-otp
   *
   * Returns normalised shape that auth.store.loginSuccess() expects:
   * {
   *   accessToken  : string
   *   refreshToken : string
   *   expiresAt    : number   ← Unix seconds
   *   isNewUser    : boolean  ← route to onboarding if true
   *   parent       : { id: string }
   * }
   */
  verifyOtp: async (phone, otp) => {
    const res = await authClient.post("/auth/verify-otp", { phone, otp });
    const data = res?.data?.data ?? res?.data;

    assertVerifyResponse(data);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ?? null,
      isNewUser: data.isNewUser ?? false,
      parent: data.parent, // { id }
    };
  },

  /**
   * POST /auth/logout
   * Best-effort — local state cleared regardless of response.
   * Sends refreshToken in body (mobile cannot use httpOnly cookies).
   */
  logout: async (refreshToken) => {
    try {
      await authClient.post("/auth/logout", { refreshToken });
    } catch {
      // best-effort
    }
  },
};
