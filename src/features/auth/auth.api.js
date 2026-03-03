// auth.api.js — Production Grade
// Fixes applied:
//   [F4]  refreshToken uses attemptTokenRefresh from tokenRefresh.js
//   [F9]  requestOtp / resendOtp validate cardNumber, not phone
//         (parent enters card number → backend resolves phone)
//   [F15] validateSession distinguishes NETWORK_ERROR from auth failure

import { apiClient, ApiError } from "@/lib/api/apiClient";
import { attemptTokenRefresh } from "@/lib/api/tokenRefresh";
import Constants from "expo-constants";
import * as Device from "expo-device";

// ── Validators ────────────────────────────────────────────────────────────────

// [F9] Card number format — alphanumeric + hyphens, 6–20 chars.
//      Adjust this regex if your Card.card_number format differs.
const CARD_RE = /^[A-Z0-9\-]{6,20}$/;

// OTP: exactly 6 digits (matches OtpLog.max_attempts default and MSG91 length)
const OTP_RE = /^\d{6}$/;

// E.164 Indian mobile — still used for verifyOtp payload
const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;

const validators = {
  // [F9] Step 1 payload: cardNumber, not phone.
  //      Backend maps: Card → Token → Student → ParentStudent → ParentUser.phone
  cardPayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.cardNumber === "string" &&
    CARD_RE.test(p.cardNumber.trim().toUpperCase()),

  // Step 2 payload: otp + cardNumber (sessionId handled by server via cardNumber)
  verifyPayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.cardNumber === "string" &&
    CARD_RE.test(p.cardNumber.trim().toUpperCase()) &&
    typeof p.otp === "string" &&
    OTP_RE.test(p.otp),

  token: (t) => typeof t === "string" && t.trim().length > 0,

  otpResponse: (d) => d?.success === true,

  verifyResponse: (d) =>
    typeof d?.accessToken === "string" &&
    d.accessToken.trim().length > 0 &&
    typeof d?.refreshToken === "string" &&
    d.refreshToken.trim().length > 0 &&
    typeof d?.expiresAt === "number" &&
    d.expiresAt > 0 &&
    d?.user !== null &&
    typeof d?.user === "object" &&
    typeof d?.user?.id === "string" &&
    d.user.id.trim().length > 0,

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
   * Step 1 — Parent enters QR card number, backend resolves phone and sends OTP.
   * [F9] Payload is { cardNumber }, NOT { phone }.
   *      Backend: Card.card_number → Token → Student → ParentStudent
   *               → ParentUser.phone → OtpLog (hashed, 10min TTL)
   *
   * @param {{ cardNumber: string }} payload
   * @returns {{ success: boolean, maskedContact: string, sessionId: string }}
   */
  async requestOtp(payload) {
    if (!validators.cardPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_CARD_NUMBER", null, null);
    }
    // Normalise to uppercase before sending
    return request({
      url: "/auth/request-otp",
      payload: { cardNumber: payload.cardNumber.trim().toUpperCase() },
      errorCode: "OTP_REQUEST_FAILED",
      validate: validators.otpResponse,
    });
  },

  /**
   * Resend OTP — backend sets old OtpLog.invalidated=true, creates new OtpLog.
   * [F9] Same card-number-based payload as requestOtp.
   */
  async resendOtp(payload) {
    if (!validators.cardPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_CARD_NUMBER", null, null);
    }
    return request({
      url: "/auth/resend-otp",
      payload: { cardNumber: payload.cardNumber.trim().toUpperCase() },
      errorCode: "OTP_RESEND_FAILED",
      validate: validators.otpResponse,
    });
  },

  /**
   * Step 2 — Verify OTP.
   * Backend checks OtpLog (hash, attempts, expiry, !invalidated)
   * → creates Session → returns JWT pair + ParentUser data.
   *
   * @param {{ cardNumber: string, otp: string }} payload
   * @returns {{ accessToken, refreshToken, expiresAt, user }}
   */
  async verifyOtp(payload) {
    if (!validators.verifyPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_OTP", null, null);
    }
    return request({
      url: "/auth/verify-otp",
      payload: {
        cardNumber: payload.cardNumber.trim().toUpperCase(),
        otp: payload.otp,
      },
      errorCode: "OTP_VERIFICATION_FAILED",
      validate: validators.verifyResponse,
    });
  },

  /**
   * Token refresh.
   * [F4] Delegates to the shared attemptTokenRefresh() in tokenRefresh.js.
   *      This eliminates the duplicate implementation in apiClient.js.
   *      Returns new access token string (already persisted to SecureStore).
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
   * [F15] Now distinguishes network errors from auth failure:
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
      // [F15] Network errors are not auth failures — let caller decide
      if (
        error?.code === "NETWORK_ERROR" ||
        error?.code === "REQUEST_TIMEOUT"
      ) {
        throw error;
      }
      return false; // 401, 403, etc. → session is invalid
    }
  },

  /**
   * Revoke all sessions — used when card is lost/stolen.
   * Maps to CARD_BLOCK OtpPurpose in OtpLog schema.
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
