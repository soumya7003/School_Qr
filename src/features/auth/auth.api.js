import { authClient } from "@/lib/api/apiClient";
import { mockApi } from "@/services/mockService";
const USE_MOCK = false;

// ── Validators (fail-fast on unexpected shapes) ───────────────────────────────

const assertVerifyResponse = (data) => {
  if (!data?.access_token) throw new Error("AUTH: missing access_token");
  if (!data?.refresh_token) throw new Error("AUTH: missing refresh_token");
  if (!data?.parent_id) throw new Error("AUTH: missing parent_id");
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /auth/send-otp
   * Returns { isNewUser } — frontend can show hint ("welcome back" vs "new account")
   * but does NOT use isNewUser for routing here (that comes after verifyOtp).
   */
  sendOtp: async (phone) => {
    if (USE_MOCK) return mockApi.sendOtp(phone);
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
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ?? null,
      isNewUser: data.is_new_user ?? false,
      parent: { id: data.parent_id },
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
