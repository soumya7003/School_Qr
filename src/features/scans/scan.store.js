/**
 * Scan Store — UI state only, no API calls.
 */

import { mockScanLogs } from "@/mock/mockData";
import { create } from "zustand";

export const useScanStore = create((set, get) => ({
  // ── State ──────────────────────────────────────
  scanLogs: mockScanLogs,
  isLoading: false,

  // ── Computed ───────────────────────────────────
  todayCount: () => {
    const today = new Date().toDateString();
    return get().scanLogs.filter(
      (s) => new Date(s.created_at).toDateString() === today,
    ).length;
  },

  recentScans: (n = 3) => get().scanLogs.slice(0, n),

  // ── Actions ────────────────────────────────────
  setLoading: (val) => set({ isLoading: val }),
}));

export default useScanStore;
