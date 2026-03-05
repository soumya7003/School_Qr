/**
 * @file src/features/profile/profile.api.js
 *
 * Card-based parent registration — two API calls.
 *
 * Backend routes (parent.routes.js → parent.controller.js):
 *   POST /api/parent/auth/register/init
 *     Body:    { card_number: string, phone: string }
 *     Returns: { success: true, data: { nonce: string, masked_phone: string } }
 *
 *   POST /api/parent/auth/register/verify
 *     Body:    { nonce: string, otp: string }
 *     Returns: { success: true, data: { jwt: string, student_id: string, isProfileComplete: false } }
 *
 * SECURITY:
 *   - card_number trimmed + uppercased before sending — matches DB RESQID-XXXXXX format
 *   - phone E.164 validated client-side before it leaves the device
 *   - nonce is 64-char hex (crypto.randomBytes(32)) — never logged, never stored to disk
 *   - otp validated as exactly 6 digits — rejects anything malformed before network call
 *   - HTTP status codes preserved on errors so UI can show specific messages (400/404/409/429)
 *   - All validation throws BEFORE any network call — no partial requests sent
 */

import { ApiError, apiClient } from "@/lib/api/apiClient";

// ── Validators (mirror backend parent.validation.js Zod schemas exactly) ──────
// Client-side validation = UX guard only. Backend re-validates everything independently.

// E.164 loose — matches backend z.regex(/^\+?[1-9]\d{7,14}$/)
const PHONE_RE = /^\+?[1-9]\d{7,14}$/;

// nonce: 64-char hex from backend crypto.randomBytes(32).toString('hex')
// Allow 8–128 chars to match backend Zod min(8).max(128)
const NONCE_RE = /^[a-f0-9]{8,128}$/i;

// OTP: exactly 6 digits — matches backend z.length(6).regex(/^\d{6}$/)
const OTP_RE = /^\d{6}$/;

const validators = {
  // card_number: backend z.string().trim().min(4).max(64)
  // phone: backend z.regex(/^\+?[1-9]\d{7,14}$/)
  initPayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.card_number === "string" &&
    p.card_number.trim().length >= 4 &&
    p.card_number.trim().length <= 64 &&
    typeof p.phone === "string" &&
    PHONE_RE.test(p.phone.trim()),

  // nonce: backend z.string().trim().min(8).max(128)
  // otp: backend z.string().length(6).regex(/^\d{6}$/)
  verifyPayload: (p) =>
    p !== null &&
    typeof p === "object" &&
    typeof p.nonce === "string" &&
    NONCE_RE.test(p.nonce.trim()) &&
    typeof p.otp === "string" &&
    OTP_RE.test(p.otp),

  // Backend: { success: true, data: { nonce, masked_phone } }
  initResponse: (d) =>
    d?.success === true &&
    typeof d?.data?.nonce === "string" &&
    d.data.nonce.length >= 8 &&
    typeof d?.data?.masked_phone === "string",

  // Backend: { success: true, data: { jwt, student_id, isProfileComplete } }
  verifyResponse: (d) =>
    d?.success === true &&
    typeof d?.data?.jwt === "string" &&
    d.data.jwt.trim().length > 0 &&
    typeof d?.data?.student_id === "string" &&
    d.data.student_id.trim().length > 0,
};

// ── Shared request wrapper ────────────────────────────────────────────────────

async function post({ url, payload, errorCode, validate }) {
  try {
    const { data } = await apiClient.post(url, payload);
    if (validate && !validate(data)) {
      throw new ApiError(`INVALID_RESPONSE_${errorCode}`, null, null);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Preserve HTTP status so UI can map 404/409/429 to specific messages
    throw new ApiError(errorCode, error?.response?.status ?? null, error);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const registrationApi = Object.freeze({
  /**
   * Step 1 — Init registration.
   * Sends OTP to phone tied to card_number. Returns nonce for step 2.
   *
   * @param {{ card_number: string, phone: string }} payload
   * @returns {{ success: true, data: { nonce: string, masked_phone: string } }}
   * @throws {ApiError} INVALID_PAYLOAD_INIT | REGISTRATION_INIT_FAILED
   *                    Status 404 = card not found
   *                    Status 409 = card already registered
   */
  async initRegistration(payload) {
    if (!validators.initPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_INIT", null, null);
    }
    return post({
      url: "/parent/register/init",
      payload: {
        card_number: payload.card_number.trim().toUpperCase(),
        phone: payload.phone.trim(),
      },
      errorCode: "REGISTRATION_INIT_FAILED",
      validate: validators.initResponse,
    });
  },

  /**
   * Step 2 — Verify OTP and complete registration.
   * nonce binds this call to the card + phone from step 1 (15 min TTL).
   * OTP is single-use — backend deletes from Redis on correct attempt.
   *
   * @param {{ nonce: string, otp: string }} payload
   * @returns {{ success: true, data: { jwt: string, student_id: string, isProfileComplete: boolean } }}
   * @throws {ApiError} INVALID_PAYLOAD_VERIFY | REGISTRATION_VERIFY_FAILED
   *                    Status 400 = wrong OTP / expired nonce
   *                    Status 409 = card already registered
   *                    Status 429 = too many OTP attempts
   */
  async verifyRegistration(payload) {
    if (!validators.verifyPayload(payload)) {
      throw new ApiError("INVALID_PAYLOAD_VERIFY", null, null);
    }
    return post({
      url: "/parent/register/verify",
      payload: {
        nonce: payload.nonce.trim(),
        otp: payload.otp.trim(),
      },
      errorCode: "REGISTRATION_VERIFY_FAILED",
      validate: validators.verifyResponse,
    });
  },
});
