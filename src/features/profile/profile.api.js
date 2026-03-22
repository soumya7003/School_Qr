/**
 * features/profile/profile.api.js
 *
 * Covers:
 *   A) Registration flow (new card parent)
 *   B) Profile read/write (all authenticated parents)
 *
 * Backend response shapes (verified against parent.controller.js + parent.service.js):
 *
 * POST /parent/register/init
 *   body: { card_number, phone }
 *   → { success, data: { nonce, masked_phone } }
 *
 * POST /parent/register/verify
 *   body: { nonce, otp, phone }        ← phone required (parent.controller.js line 10)
 *   → { success, data: { accessToken, refreshToken, expiresAt, isNewUser: true,
 *                         student_id, parent_id, isProfileComplete: false } }
 *   NOTE: parent_id is snake_case here (differs from verify-otp's parent.id)
 *
 * GET /parent/me
 *   → { success, data: { parent: { id, phone }, students: [...] } }
 *   students shape → see getFullProfile() in parent.service.js
 *
 * PATCH /parent/student/:studentId
 *   body: { student?, emergency?, contacts? }
 *   → { success: true }
 */

import { apiClient, authClient } from "@/lib/api/apiClient";

// ── Validators ────────────────────────────────────────────────────────────────

const assertRegVerifyResponse = (data) => {
  if (!data?.accessToken) throw new Error("REG: missing accessToken");
  if (!data?.refreshToken) throw new Error("REG: missing refreshToken");
  if (!data?.parent_id) throw new Error("REG: missing parent_id");
};

// ── Registration API (unauthenticated — uses authClient) ──────────────────────

export const registrationApi = {
  /**
   * POST /parent/register/init
   * Returns { nonce, masked_phone }
   * nonce is opaque to the client — passed straight to verifyRegistration.
   */
  initRegistration: async ({ card_number, phone }) => {
    const res = await authClient.post("/parent/register/init", {
      card_number,
      phone,
    });
    return res?.data ?? res;
    // Caller reads: response.data.nonce, response.data.masked_phone
  },

  /**
   * POST /parent/register/verify
   * phone MUST be included — backend needs it to encrypt + store the parent's phone.
   *
   * Returns normalised shape:
   * {
   *   accessToken  : string
   *   refreshToken : string
   *   expiresAt    : number
   *   isNewUser    : true        ← always true for registration
   *   parent_id    : string      ← NOTE: snake_case (differs from login flow's parent.id)
   *   student_id   : string
   * }
   */
  verifyRegistration: async ({ nonce, otp, phone }) => {
    const res = await authClient.post("/parent/register/verify", {
      nonce,
      otp,
      phone, // required — backend creates ParentUser with this
    });
    const data = res?.data?.data ?? res?.data;

    assertRegVerifyResponse(data);

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ?? null,
      isNewUser: true, // always true for registration path
      parent_id: data.parent_id, // snake_case from backend
      student_id: data.student_id,
    };
  },
};

// ── Profile API (authenticated — uses apiClient) ──────────────────────────────

export const profileApi = {
  /**
   * GET /parent/me
   * Returns full profile shape matching profile.store expectations:
   * {
   *   parent   : { id, phone }
   *   students : [{
   *     id, first_name, last_name, class, section, photo_url,
   *     is_primary, relationship, school,
   *     token: { id, status, expires_at, card_number, card_file_url },
   *     emergency: { blood_group, allergies, conditions, medications,
   *                  doctor_name, doctor_phone, notes, contacts: [...] },
   *     card_visibility: { visibility, hidden_fields }
   *   }]
   * }
   */
  getFullProfile: async () => {
    const res = await apiClient.get("/parent/me");
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /parent/student/:studentId
   * Accepts any combination of { student?, emergency?, contacts? }.
   * At least one section required (validated server-side by Zod).
   */
  updateStudent: async (studentId, payload) => {
    const res = await apiClient.patch(`/parent/student/${studentId}`, payload);
    return res?.data ?? res;
  },
};
