// =============================================================================
// PATCH 5 — frontend: src/features/parent/parent.api.js  (NEW FILE)
// =============================================================================

import { apiClient } from "@/lib/api/apiClient";

export const parentApi = {
  async getMe() {
    const { data } = await apiClient.get("/parent/me");
    return data.data; // { parent, students[] }
  },

  async updateStudent(studentId, payload) {
    const { data } = await apiClient.patch(
      `/parent/student/${studentId}`,
      payload,
    );
    return data;
  },
};
