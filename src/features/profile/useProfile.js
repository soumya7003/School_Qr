/**
 * features/profile/useProfile.js
 *
 * Single hook that exposes everything screens need — no screen
 * needs to call useProfileStore directly for read access.
 *
 * Covers every field that home.jsx, settings.jsx, emergency.jsx,
 * qr.jsx, visibility.jsx, scan-history.jsx, updates.jsx use.
 *
 * settings.jsx destructures these keys directly:
 *   student, token, card, emergencyProfile, trustedContacts,
 *   recentScans, anomalies, updateRequests, locationConsent,
 *   updateLocationConsent, updateNotificationPref, notificationPrefs
 *
 * All those are surfaced here — settings.jsx needs zero changes.
 */

import {
  useActiveStudent,
  useCardVisibility,
  useEmergencyProfile,
  useLastScan,
  useLocationConsent,
  useNotificationPrefs,
  useProfileStore,
  useScanCount,
  useSchool,
  useToken,
  useUnresolvedAnomaly,
} from "./profile.store";

export const useProfile = () => {
  // ── Core derived selectors ─────────────────────────────────────────────────
  const student = useActiveStudent();
  const school = useSchool();
  const token = useToken();
  const emergency = useEmergencyProfile();
  const cardVisibility = useCardVisibility();
  const locationConsent = useLocationConsent();
  const notificationPrefs = useNotificationPrefs();

  // ── Store-level state ──────────────────────────────────────────────────────
  const isHydrated = useProfileStore((s) => s.isHydrated);
  const isFetching = useProfileStore((s) => s.isFetching);
  const students = useProfileStore((s) => s.students);
  const parent = useProfileStore((s) => s.parent);
  const lastScan = useLastScan();
  const scanCount = useScanCount();
  const anomaly = useUnresolvedAnomaly();

  // ── Write actions ──────────────────────────────────────────────────────────
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const updateVisibility = useProfileStore((s) => s.updateVisibility);
  const updateNotifications = useProfileStore((s) => s.updateNotifications);
  const updateLocationConsent = useProfileStore((s) => s.updateLocationConsent);
  const lockCard = useProfileStore((s) => s.lockCard);
  const requestReplace = useProfileStore((s) => s.requestReplace);
  const deleteAccount = useProfileStore((s) => s.deleteAccount);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const setActiveStudent = useProfileStore((s) => s.setActiveStudent);

  // ── Convenience aliases ────────────────────────────────────────────────────
  // settings.jsx destructures these names directly — keeping them here means
  // settings.jsx never needs to change if the underlying store changes.

  const card = token?.card_number ? { card_number: token.card_number } : null;

  const emergencyProfile = emergency ?? null;

  const trustedContacts = emergency?.contacts ?? [];

  // settings.jsx reads recentScans as an array.
  // lastScan from /me is a single object — wrap it for the settings preview.
  // Full paginated list comes from profileApi.getScanHistory() when needed.
  const recentScans = lastScan ? [lastScan] : [];

  // settings.jsx reads anomalies as an array with a .resolved field.
  // /me only returns the latest unresolved anomaly — wrap it.
  const anomalies = anomaly ? [anomaly] : [];

  // settings.jsx reads updateRequests — not in the /me response currently.
  // Keep as empty array; when the backend adds it, add it to fetchAndShape
  // and add updateRequests to the store state — no change needed here.
  const updateRequests = [];

  // Alias for settings.jsx action names
  const updateNotificationPref = updateNotifications;

  return {
    // Data
    student,
    school,
    token,
    card,
    emergency,
    emergencyProfile,
    trustedContacts,
    cardVisibility,
    locationConsent,
    notificationPrefs,
    students,
    parent,
    lastScan,
    scanCount,
    anomaly,
    recentScans,
    anomalies,
    updateRequests,

    // Status
    isHydrated,
    isFetching,

    // Actions
    patchStudent,
    updateVisibility,
    updateNotifications,
    updateNotificationPref, // alias — same function
    updateLocationConsent,
    lockCard,
    requestReplace,
    deleteAccount,
    fetchAndPersist,
    setActiveStudent,
  };
};
