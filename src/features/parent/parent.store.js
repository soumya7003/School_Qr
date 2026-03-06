// =============================================================================
// PATCH 6 — frontend: src/features/parent/parent.store.js  (NEW FILE)
// =============================================================================

import { storage } from "@/lib/storage/storage";
import { create } from "zustand";
import { parentApi } from "./parent.api";

const CACHE_KEY = "parent_full_profile_v1";
const STALE_MS = 30 * 60 * 1000; // 30 minutes

export const useParentStore = create((set, get) => ({
  parent: null,
  students: [],
  lastFetchedAt: null,
  isLoading: false,
  error: null,

  // ── Called on cold start — loads cache instantly, no spinner
  hydrate: async () => {
    try {
      const raw = await storage.getItem(CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      set({ parent: cached.parent, students: cached.students });
    } catch {
      // cache miss — fetch will populate
    }
  },

  // ── Fetches from API + updates cache
  // Pass force=true to bypass stale check (e.g. pull-to-refresh)
  fetch: async (force = false) => {
    const { lastFetchedAt, isLoading } = get();
    if (isLoading) return;

    const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
    if (!force && !isStale) return; // still fresh — skip

    set({ isLoading: true, error: null });
    try {
      const data = await parentApi.getMe();
      set({
        parent: data.parent,
        students: data.students,
        lastFetchedAt: Date.now(),
        isLoading: false,
      });
      // Update cache
      await storage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      set({ isLoading: false, error: err });
    }
  },

  // ── Called after PATCH /student/:studentId succeeds
  // Updates the store immediately with local data, then re-fetches to sync
  updateStudent: async (studentId, payload) => {
    await parentApi.updateStudent(studentId, payload);
    // Re-fetch to get server truth — don't guess the updated shape
    await get().fetch(true);
  },

  // ── Called on logout — clears everything
  clear: async () => {
    set({ parent: null, students: [], lastFetchedAt: null });
    await storage.deleteItem(CACHE_KEY);
  },
}));

// ── Selectors — subscribe to slices not whole store
export const useParent = () => useParentStore((s) => s.parent);
export const useStudents = () => useParentStore((s) => s.students);
export const useFirstStudent = () =>
  useParentStore((s) => s.students[0] ?? null);
export const useParentLoading = () => useParentStore((s) => s.isLoading);
