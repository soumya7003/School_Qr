// auth.api.js — Production Grade
// Updated: card-number flow replaced with phone-based flow
// to match backend POST /auth/send-otp → { phone }
//                  POST /auth/verify-otp → { phone, otp }

import { apiClient, ApiError } from "@/lib/api/apiClient";
import { attemptTokenRefresh } from "@/lib/api/tokenRefresh";
import Constants from "expo-constants";
import * as Device from "expo-device";

// ── Validators ────────────────────────────────────────────────────────────────

// E.164 / loose international format — matches backend z.regex(/^\+?[1-9]\d{9,14}$/)
const PHONE_RE = /^\+?[1-9]\d{9,14}$/;

// OTP: exactly 6 digits
const OTP_RE = /^\d{6}$/;

const validators = {
  // Step 1 payload: { phone }
  phonePayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.phone === "string" &&
    PHONE_RE.test(p.phone.trim()),

  // Step 2 payload: { phone, otp }
  verifyPayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.phone === "string" &&
    PHONE_RE.test(p.phone.trim()) &&
    typeof p.otp === "string" &&
    OTP_RE.test(p.otp),

  token: (t) => typeof t === "string" && t.trim().length > 0,

  otpResponse: (d) => d?.success === true,

  // Backend wraps tokens inside { success, message, data: { ... } }
  // We validate the unwrapped `data` object, not the envelope.
  verifyResponse: (d) =>
    typeof d?.accessToken === "string" &&
    d.accessToken.trim().length > 0 &&
    typeof d?.refreshToken === "string" &&
    d.refreshToken.trim().length > 0 &&
    ((d?.user !== null &&
      typeof d?.user?.id === "string" &&
      d.user.id.trim().length > 0) ||
      (d?.parent !== null &&
        typeof d?.parent?.id === "string" &&
        d.parent.id.trim().length > 0)),

  refreshResponse: (d) =>
    typeof d?.accessToken === "string" &&
    d.accessToken.trim().length > 0 &&
    typeof d?.refreshToken === "string" &&
    d.refreshToken.trim().length > 0 &&
    typeof d?.expiresAt === "number" &&
    d.expiresAt > 0,

  deviceToken: (t) => typeof t === "string" && t.trim().length > 0,
};

// ── Supported HTTP methods ────────────────────────────────────────────────────

const ALLOWED_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

// ── Shared request wrapper ────────────────────────────────────────────────────

async function request({
  method = "post",
  url,
  payload = undefined,
  errorCode,
  validate = null,
  client = apiClient,
  timeout = undefined,
  signal = undefined,
}) {
  if (!ALLOWED_METHODS.has(method)) {
    throw new ApiError(`UNSUPPORTED_METHOD_${method}`, null, null);
  }

  try {
    const config = {
      ...(timeout !== undefined && { timeout }),
      ...(signal !== undefined && { signal }),
    };

    let data;
    switch (method) {
      case "get":
      case "delete":
        ({ data } = await client[method](url, config));
        break;
      default:
        ({ data } = await client[method](url, payload, config));
    }

    if (validate && !validate(data)) {
      throw new ApiError(`INVALID_RESPONSE_${errorCode}`, null, null);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(errorCode, error?.response?.status ?? null, error);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const authApi = Object.freeze({
  /**
   * Step 1 — Send OTP to phone number.
   * Backend: validates phone → generates OTP → stores hash in Redis → sends SMS.
   *
   * @param {{ phone: string }} payload  e.g. { phone: "+919999999999" }
   * @returns {{ success: boolean, isNewUser: boolean, message: string }}
   */
  async requestOtp(payload) {
    if (!validators.phonePayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_PHONE", null, null);
    }
    return request({
      url: "/auth/send-otp",
      payload: { phone: payload.phone.trim() },
      errorCode: "OTP_REQUEST_FAILED",
      validate: validators.otpResponse,
    });
  },

  /**
   * Resend OTP — backend resets Redis key and sends fresh OTP.
   *
   * @param {{ phone: string }} payload
   */
  async resendOtp(payload) {
    if (!validators.phonePayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_PHONE", null, null);
    }
    return request({
      url: "/auth/resend-otp",
      payload: { phone: payload.phone.trim() },
      errorCode: "OTP_RESEND_FAILED",
      validate: validators.otpResponse,
    });
  },

  /**
   * Step 2 — Verify OTP.
   * Backend: checks Redis hash → creates/finds ParentUser → returns JWT pair.
   *
   * @param {{ phone: string, otp: string }} payload
   * @returns {{ accessToken, refreshToken, expiresAt, user }}
   */
  async verifyOtp(payload) {
    if (!validators.verifyPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_OTP", null, null);
    }
    const envelope = await request({
      url: "/auth/verify-otp",
      payload: {
        phone: payload.phone.trim(),
        otp: payload.otp,
      },
      errorCode: "OTP_VERIFICATION_FAILED",
      // Validate the unwrapped data, not the envelope
      validate: (res) => validators.verifyResponse(res?.data),
    });
    // Return the inner data so callers get { accessToken, refreshToken, parent, isNewUser }
    return envelope.data;
  },

  /**
   * Token refresh.
   * Delegates to the shared attemptTokenRefresh() in tokenRefresh.js.
   * Returns new access token string (already persisted to SecureStore).
   */
  async refreshToken() {
    return attemptTokenRefresh();
  },

  /**
   * Server-side logout — soft fail by design.
   * Client ALWAYS clears local state regardless of server response.
   */
  async logout() {
    try {
      await request({ url: "/auth/logout", errorCode: "LOGOUT_FAILED" });
      return { success: true, serverRevoked: true };
    } catch (error) {
      return {
        success: false,
        serverRevoked: false,
        error:
          error instanceof ApiError
            ? error
            : new ApiError(
                "LOGOUT_FAILED",
                error?.response?.status ?? null,
                error,
              ),
      };
    }
  },

  /**
   * Validate current session server-side.
   * Distinguishes network errors from auth failure:
   *   - Network error: rethrows so caller can show "no connection" UI
   *   - Auth error (401/403): returns false — session is genuinely invalid
   */
  async validateSession() {
    try {
      const data = await request({
        method: "get",
        url: "/auth/validate",
        errorCode: "VALIDATION_FAILED",
      });
      return data?.valid === true;
    } catch (error) {
      if (
        error?.code === "NETWORK_ERROR" ||
        error?.code === "REQUEST_TIMEOUT"
      ) {
        throw error;
      }
      return false;
    }
  },

  /**
   * Revoke all sessions.
   * Caller can pass an AbortSignal to allow cancel UI.
   */
  async revokeAllSessions({ signal } = {}) {
    return request({
      url: "/auth/revoke-all",
      errorCode: "REVOKE_ALL_FAILED",
      timeout: 15_000,
      signal,
    });
  },

  /**
   * Register/update device push token.
   * Payload matches ParentDevice schema: { deviceToken, platform, deviceName, appVersion }
   */
  async updateDeviceToken(deviceToken) {
    if (!validators.deviceToken(deviceToken)) {
      throw new ApiError("INVALID_PAYLOAD_DEVICE_TOKEN", null, null);
    }
    const payload = {
      deviceToken,
      platform:
        Device.osName === "iOS"
          ? "IOS"
          : Device.osName === "Android"
            ? "ANDROID"
            : "WEB",
      deviceName: Device.deviceName ?? Device.modelName ?? "Unknown",
      appVersion: Constants.expoConfig?.version ?? "unknown",
    };
    return request({
      url: "/auth/device-token",
      payload,
      errorCode: "DEVICE_TOKEN_UPDATE_FAILED",
    });
  },
});
