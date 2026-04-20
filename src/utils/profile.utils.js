// utils/profile.utils.js — CONSOLIDATED
// All shared utilities in one place

import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ────────────────────────────────────────────────────────────── TOKEN STATUS

export function tokenMeta(status, colors) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        color: colors.success,
        bg: colors.successBg,
        pulse: true,
      };
    case "INACTIVE":
      return {
        label: "Inactive",
        color: colors.textTertiary,
        bg: colors.surface3,
        pulse: false,
      };
    case "ISSUED":
      return {
        label: "Issued",
        color: colors.warning,
        bg: colors.warningBg,
        pulse: true,
      };
    case "REVOKED":
      return {
        label: "Revoked",
        color: colors.primary,
        bg: colors.primaryBg,
        pulse: false,
      };
    case "EXPIRED":
      return {
        label: "Expired",
        color: colors.primary,
        bg: colors.primaryBg,
        pulse: false,
      };
    case "UNASSIGNED":
      return {
        label: "Not Set Up",
        color: colors.warning,
        bg: colors.warningBg,
        pulse: false,
      };
    default:
      return {
        label: "Unknown",
        color: colors.textTertiary,
        bg: colors.surface3,
        pulse: false,
      };
  }
}

// ────────────────────────────────────────────────────────────── DATE/TIME

export function fmtRelTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

// ────────────────────────────────────────────────────────────── VISIBILITY

export function visibilityLabel(v) {
  if (v === "PUBLIC") return "Full Info Visible";
  if (v === "MINIMAL") return "Name & Contacts Only";
  if (v === "HIDDEN") return "Hidden";
  return "—";
}

// ────────────────────────────────────────────────────────────── PROFILE COMPLETENESS

export function profileCompleteness(ep, contacts) {
  const fields = [
    ep?.blood_group,
    ep?.allergies,
    ep?.conditions,
    ep?.medications,
    ep?.doctor_name,
    contacts?.length > 0 ? "ok" : null,
  ];
  const filledCount = fields.filter(Boolean).length;
  return Math.round((filledCount / 6) * 100);
}

export function missingFields(ep, contacts) {
  const m = [];
  if (!ep?.blood_group) m.push("Blood group");
  if (!ep?.allergies) m.push("Allergies");
  if (!ep?.doctor_name) m.push("Doctor name");
  if (!contacts?.length) m.push("Emergency contact");
  return m;
}

// ────────────────────────────────────────────────────────────── DEVICE INFO

export async function getDeviceInfo() {
  let deviceId = null;
  try {
    deviceId =
      Platform.OS === "android"
        ? await Application.getAndroidId()
        : await Application.getIosIdForVendorAsync();
  } catch (error) {
    console.warn("[getDeviceInfo] Failed:", error);
  }

  const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  return {
    deviceId: deviceId ?? fallbackId,
    deviceName: Device.deviceName ?? "Unknown Device",
    platform: Platform.OS,
    osVersion: Device.osVersion ?? "Unknown",
  };
}
