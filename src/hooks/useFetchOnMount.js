/**
 * hooks/useFetchOnMount.js
 *
 * Drop this into every screen that reads from the profile store.
 *
 * What it does:
 *   Calls fetchIfStale() on mount.
 *   fetchIfStale() checks MMKV snapshot age synchronously (no network).
 *   Only hits the network if data is older than 30 minutes.
 *   Zero cost on most mounts — typical user session keeps data fresh.
 *
 * Add to these screens:
 *   home.jsx, qr.jsx, emergency.jsx, visibility.jsx,
 *   settings.jsx, updates.jsx
 *
 * Do NOT add to:
 *   scan-history.jsx — calls profileApi.getScanHistory() directly instead.
 *
 * Usage — two lines in any screen:
 *   import { useFetchOnMount } from '@/hooks/useFetchOnMount';
 *   // inside component:
 *   useFetchOnMount();
 */

import { useProfileStore } from "@/features/profile/profile.store";
import { useEffect } from "react";

export function useFetchOnMount() {
  const fetchIfStale = useProfileStore((s) => s.fetchIfStale);

  useEffect(() => {
    fetchIfStale();
  }, []);
}
