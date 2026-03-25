/**
 * features/profile/useProfile.js
 *
 * Single hook — every screen reads from here, never directly from useProfileStore.
 *
 * FIXES vs original:
 *
 *   updateNotificationPref — accepts both call styles:
 *     Old broken style:  updateNotificationPref('scanAlerts', true)
 *     New correct style: updateNotificationPref({ scan_notify_enabled: true })
 *     The hook maps the old string-key style to correct backend field names
 *     so settings.jsx works without changes.
 *
 *   updateLocationConsent — injects studentId automatically:
 *     Old broken call: updateLocationConsent(v)         ← missing studentId
 *     New correct:     updateLocationConsent(student.id, v)
 *     Hook wraps this — settings.jsx still calls updateLocationConsent(v).
 *
 *   updateVisibility — injects studentId automatically:
 *     Old broken call: updateVisibility({ visibility, hidden_fields })
 *     New correct:     updateVisibility(student.id, { visibility, hidden_fields })
 *
 *   scanCount — now comes from real store value (not hardcoded 0 or 1).
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

// Notification pref field name mapping:
// frontend alias → backend field name (matches parent.validation.js)
const NOTIF_FIELD_MAP = {
  scanAlerts: "scan_notify_enabled",
  scanPush: "scan_notify_push",
  scanSms: "scan_notify_sms",
  anomalyPush: "anomaly_notify_push",
  anomalySms: "anomaly_notify_sms",
  cardExpiry: "card_expiry_notify",
  quietHours: "quiet_hours_enabled",
  quietStart: "quiet_hours_start",
  quietEnd: "quiet_hours_end",
};

export const useProfile = () => {
  // ── Derived selectors ──────────────────────────────────────────────────────
  const student = useActiveStudent();
  const school = useSchool();
  const token = useToken();
  const emergency = useEmergencyProfile();
  const cardVisibility = useCardVisibility();
  const locationConsent = useLocationConsent();
  const notificationPrefs = useNotificationPrefs();

  // ── Store state ────────────────────────────────────────────────────────────
  const isHydrated = useProfileStore((s) => s.isHydrated);
  const isFetching = useProfileStore((s) => s.isFetching);
  const students = useProfileStore((s) => s.students);
  const parent = useProfileStore((s) => s.parent);
  const lastScan = useLastScan();
  const scanCount = useScanCount(); // real total from backend
  const anomaly = useUnresolvedAnomaly();

  // ── Write actions (raw from store) ────────────────────────────────────────
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const _updateVisibility = useProfileStore((s) => s.updateVisibility);
  const _updateNotifications = useProfileStore((s) => s.updateNotifications);
  const _updateLocationConsent = useProfileStore(
    (s) => s.updateLocationConsent,
  );
  const lockCard = useProfileStore((s) => s.lockCard);
  const requestReplace = useProfileStore((s) => s.requestReplace);
  const deleteAccount = useProfileStore((s) => s.deleteAccount);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const fetchIfStale = useProfileStore((s) => s.fetchIfStale);
  const setActiveStudent = useProfileStore((s) => s.setActiveStudent);

  // ── Convenience aliases ────────────────────────────────────────────────────
  const card = token?.card_number ? { card_number: token.card_number } : null;
  const emergencyProfile = emergency ?? null;
  const trustedContacts = emergency?.contacts ?? [];
  const recentScans = lastScan ? [lastScan] : []; // for settings preview
  const anomalies = anomaly ? [anomaly] : []; // for settings preview
  const updateRequests = []; // not in /me yet

  // ── FIX: updateVisibility — auto-injects studentId ───────────────────────
  const updateVisibility = (visibilityPayload) => {
    if (!student?.id) return;
    return _updateVisibility(student.id, visibilityPayload);
  };

  // ── FIX: updateNotifications — accepts both call styles ──────────────────
  // Style 1 (correct, preferred):  updateNotifications({ scan_notify_enabled: true })
  // Style 2 (legacy settings.jsx): updateNotificationPref('scanAlerts', true)
  const updateNotifications = (prefsOrKey, value) => {
    if (typeof prefsOrKey === "object" && prefsOrKey !== null) {
      // Object form — pass straight through
      return _updateNotifications(prefsOrKey);
    }
    if (typeof prefsOrKey === "string") {
      // String key form — map to backend field name
      const backendKey = NOTIF_FIELD_MAP[prefsOrKey] ?? prefsOrKey;
      return _updateNotifications({ [backendKey]: value });
    }
  };

  // Alias used by settings.jsx
  const updateNotificationPref = updateNotifications;

  // ── FIX: updateLocationConsent — auto-injects studentId ──────────────────
  // settings.jsx calls updateLocationConsent(v) — no studentId.
  // This wrapper injects the active student's id automatically.
  const updateLocationConsent = (enabled) => {
    if (!student?.id) return;
    return _updateLocationConsent(student.id, enabled);
  };

  return {
    // ── Data ──────────────────────────────────────────────────────────────────
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

    // ── Status ────────────────────────────────────────────────────────────────
    isHydrated,
    isFetching,

    // ── Actions ───────────────────────────────────────────────────────────────
    patchStudent,
    updateVisibility,
    updateNotifications,
    updateNotificationPref, // alias for settings.jsx
    updateLocationConsent,
    lockCard,
    requestReplace,
    deleteAccount,
    fetchAndPersist,
    fetchIfStale,
    setActiveStudent,
  };
};
