/**
 * features/profile/useProfile.js
 *
 * Single hook — every screen reads from here, never directly from useProfileStore.
 */

import { Alert } from "react-native";
import {
  useActiveStudent,
  useCardVisibility,
  useEmergencyProfile,
  useIsFetchingProfile,
  useLastScan,
  useLocationConsent,
  useNotificationPrefs,
  useProfileStore,
  useScanCount,
  useSchool,
  useToken,
  useUnresolvedAnomaly,
} from "./profile.store";

// Notification pref field name mapping
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
  const isFetching = useIsFetchingProfile();
  const students = useProfileStore((s) => s.students);
  const parent = useProfileStore((s) => s.parent);
  const lastScan = useLastScan();
  const scanCount = useScanCount();
  const anomaly = useUnresolvedAnomaly();
  const activeStudentId = useProfileStore((s) => s.activeStudentId);

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
  const refresh = useProfileStore((s) => s.refresh);
  const onLogin = useProfileStore((s) => s.onLogin);
  const onLogout = useProfileStore((s) => s.onLogout);
  const setActiveStudent = useProfileStore((s) => s.setActiveStudent);

  // ── Multi-child actions ────────────────────────────────────────────────────
  const getChildrenList = useProfileStore((s) => s.getChildrenList);
  const linkCard = useProfileStore((s) => s.linkCard);
  const setActiveStudentWithSync = useProfileStore(
    (s) => s.setActiveStudentWithSync,
  );

  // ── Convenience aliases ────────────────────────────────────────────────────
  const card = token?.card_number ? { card_number: token.card_number } : null;
  const emergencyProfile = emergency ?? null;
  const trustedContacts = emergency?.contacts ?? [];
  const recentScans = lastScan ? [lastScan] : [];
  const anomalies = anomaly ? [anomaly] : [];

  // unlink child
  const unlinkChildInit = useProfileStore((s) => s.unlinkChildInit);
  const unlinkChildVerify = useProfileStore((s) => s.unlinkChild);

  // ── updateVisibility — auto-injects studentId ─────────────────────────────
  const updateVisibility = (visibilityPayload) => {
    if (!student?.id) return;
    return _updateVisibility(student.id, visibilityPayload);
  };

  // ── updateNotifications — accepts both call styles ────────────────────────
  const updateNotifications = (prefsOrKey, value) => {
    if (typeof prefsOrKey === "object" && prefsOrKey !== null) {
      return _updateNotifications(prefsOrKey);
    }
    if (typeof prefsOrKey === "string") {
      const backendKey = NOTIF_FIELD_MAP[prefsOrKey] ?? prefsOrKey;
      return _updateNotifications({ [backendKey]: value });
    }
  };

  const updateNotificationPref = updateNotifications;

  // ── updateLocationConsent — auto-injects studentId ────────────────────────
  const updateLocationConsent = (enabled) => {
    if (!student?.id) return;
    return _updateLocationConsent(student.id, enabled);
  };

  // ── Multi-child helper functions ──────────────────────────────────────────
  const fetchChildrenList = async () => {
    try {
      return await getChildrenList();
    } catch (error) {
      console.error("[useProfile] fetchChildrenList error:", error);
      return [];
    }
  };

  const addChildByCard = async ({ card_number }) => {
    try {
      const result = await linkCard({ card_number });
      Alert.alert(
        "Child Added! 🎉",
        `${result.student_name || "Your child"} has been added to your account.`,
        [{ text: "OK" }],
      );
      return result;
    } catch (error) {
      console.error("[useProfile] addChildByCard error:", error);
      Alert.alert(
        "Failed to Add Child",
        error?.message || "Please check the card number and try again.",
        [{ text: "OK" }],
      );
      throw error;
    }
  };

  const switchActiveStudent = async (studentId) => {
    if (!studentId) return;
    try {
      const result = await setActiveStudentWithSync(studentId);
      return result;
    } catch (error) {
      console.error("[useProfile] switchActiveStudent error:", error);
      Alert.alert(
        "Failed to Switch Student",
        error?.message || "Please try again.",
        [{ text: "OK" }],
      );
      throw error;
    }
  };

  // ── Pull to refresh ────────────────────────────────────────────────────────
  const pullToRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      Alert.alert("Refresh Failed", "Please try again", [{ text: "OK" }]);
    }
  };

  const removeChild = async ({ studentId, otp, nonce }) => {
    try {
      const result = await unlinkChildVerify(studentId, otp, nonce);
      Alert.alert(
        "Child Removed",
        result.message || "Child has been removed from your account.",
        [{ text: "OK" }],
      );
      return result;
    } catch (error) {
      console.error("[useProfile] removeChild error:", error);
      Alert.alert(
        "Failed to Remove Child",
        error?.message || "Please try again.",
        [{ text: "OK" }],
      );
      throw error;
    }
  };

  const initiateUnlink = async (studentId) => {
    try {
      const result = await unlinkChildInit(studentId);
      return result;
    } catch (error) {
      console.error("[useProfile] initiateUnlink error:", error);
      Alert.alert("Failed to Send OTP", error?.message || "Please try again.", [
        { text: "OK" },
      ]);
      throw error;
    }
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

    // ── Status ────────────────────────────────────────────────────────────────
    isHydrated,
    isFetching,
    activeStudentId,

    // ── Actions ───────────────────────────────────────────────────────────────
    patchStudent,
    updateVisibility,
    updateNotifications,
    updateNotificationPref,
    updateLocationConsent,
    lockCard,
    requestReplace,
    deleteAccount,
    refresh: pullToRefresh,
    onLogin,
    onLogout,
    setActiveStudent,

    // ── Multi-child ───────────────────────────────────────────────────────────
    fetchChildrenList,
    addChildByCard,
    switchActiveStudent,
    fetchAndPersist: useProfileStore((s) => s.fetchAndPersist),
    // unlink child
    initiateUnlink,
    removeChild,
  };
};
