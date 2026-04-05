import { colors } from "@/theme";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

export function tokenStatusMeta(status) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", color: colors.success, bg: colors.successBg };

    case "INACTIVE":
      return {
        label: "Inactive",
        color: colors.textTertiary,
        bg: colors.surface3,
      };

    case "ISSUED":
      return { label: "Issued", color: colors.warning, bg: colors.warningBg };

    case "REVOKED":
      return { label: "Revoked", color: colors.primary, bg: colors.primaryBg };

    case "EXPIRED":
      return { label: "Expired", color: colors.primary, bg: colors.primaryBg };

    case "UNASSIGNED":
      return {
        label: "Unassigned",
        color: colors.textTertiary,
        bg: colors.surface3,
      };

    default:
      return {
        label: status ?? "—",
        color: colors.textTertiary,
        bg: colors.surface3,
      };
  }
}

export function visibilityLabel(v) {
  if (v === "PUBLIC") return "Full Info Visible";
  if (v === "MINIMAL") return "Name & Contacts Only";
  if (v === "HIDDEN") return "Hidden";
  return "—";
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ✅ FIX: Add fallback for devices that cannot get AndroidId
export async function getDeviceInfo() {
  let deviceId = null;

  try {
    if (Platform.OS === "android") {
      deviceId = await Application.getAndroidId();
    } else {
      deviceId = await Application.getIosIdForVendorAsync();
    }
  } catch (error) {
    console.warn("[getDeviceInfo] Failed to get device ID:", error);
  }

  // ✅ FIX: Generate fallback ID if native ID not available
  const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  return {
    deviceId: deviceId ?? fallbackId,
    deviceName: Device.deviceName ?? "Unknown Device",
    platform: Platform.OS,
    osVersion: Device.osVersion ?? "Unknown",
  };
}
