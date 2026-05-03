// components/scan-history/scanConfig.utils.js

export function getScanConfig(result, scanPurpose, C) {
  const isEmergency = scanPurpose === "EMERGENCY";

  const configs = {
    SUCCESS: {
      icon: "check-circle",
      gradient: [C.ok, "#0D9488"],
      label: "Successful Scan",
      badgeColor: C.ok,
      badgeBg: C.okBg,
    },
    INVALID: {
      icon: "x-circle",
      gradient: [C.primary, "#B91C1C"],
      label: "Invalid Code",
      badgeColor: C.primary,
      badgeBg: C.primaryBg,
    },
    REVOKED: {
      icon: "slash",
      gradient: [C.red, "#991B1B"],
      label: "Card Revoked",
      badgeColor: C.red,
      badgeBg: C.redBg,
    },
    EXPIRED: {
      icon: "clock",
      gradient: [C.amb, "#B45309"],
      label: "Card Expired",
      badgeColor: C.amb,
      badgeBg: C.ambBg,
    },
    INACTIVE: {
      icon: "pause-circle",
      gradient: [C.tx3, "#6B7280"],
      label: "Card Inactive",
      badgeColor: C.tx3,
      badgeBg: C.s4,
    },
    RATE_LIMITED: {
      icon: "alert-circle",
      gradient: [C.amb, "#B45309"],
      label: "Rate Limited",
      badgeColor: C.amb,
      badgeBg: C.ambBg,
    },
    ERROR: {
      icon: "alert-triangle",
      gradient: [C.red, "#991B1B"],
      label: "System Error",
      badgeColor: C.red,
      badgeBg: C.redBg,
    },
  };

  const baseConfig = configs[result] || {
    icon: "help-circle",
    gradient: [C.tx3, "#6B7280"],
    label: result || "Unknown",
    badgeColor: C.tx3,
    badgeBg: C.s4,
  };

  if (isEmergency) {
    baseConfig.icon = "alert-triangle";
    baseConfig.gradient = ["#DC2626", "#991B1B"];
    baseConfig.label = "🚨 Emergency Scan";
  }

  return baseConfig;
}
