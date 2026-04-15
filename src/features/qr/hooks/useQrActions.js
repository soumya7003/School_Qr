// src/features/qr/hooks/useQrActions.js
import { useProfileStore } from "@/features/profile/profile.store";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export function useQrActions(studentId, fetchAndPersist) {
  const { t } = useTranslation();
  const router = useRouter();
  const lockCard = useProfileStore((s) => s.lockCard);
  const requestReplace = useProfileStore((s) => s.requestReplace);

  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (key) => {
    setActionDone(key);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setActionDone(null), 3500);
  };

  const doBlock = useCallback(async () => {
    if (!studentId)
      return Alert.alert(t("common.error"), t("common.studentNotFound"));
    setLoading(true);
    try {
      await lockCard(studentId);
      showToast("blocked");
      return true;
    } catch (err) {
      Alert.alert(
        t("common.failed"),
        err?.response?.data?.message ?? t("common.tryAgain"),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [studentId, lockCard, t]);

  const doUnblock = useCallback(() => {
    Alert.alert(t("qr.contactSupport"), t("qr.unblockAlertBody"), [
      { text: t("common.ok") },
      {
        text: t("qr.openSupport"),
        onPress: () => router.push("/(app)/support"),
      },
    ]);
  }, [t, router]);

  const doRevoke = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      await requestReplace(
        studentId,
        "Card reported lost or stolen by parent via app",
      );
      await fetchAndPersist?.();
      showToast("revoked");
      return true;
    } catch (err) {
      Alert.alert(
        t("common.failed"),
        err?.response?.data?.message ?? t("common.tryAgain"),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [studentId, requestReplace, fetchAndPersist, t]);

  const doActivate = useCallback(() => {
    router.push("/(app)/support");
  }, [router]);

  return {
    loading,
    actionDone,
    setActionDone,
    doBlock,
    doUnblock,
    doRevoke,
    doActivate,
  };
}
