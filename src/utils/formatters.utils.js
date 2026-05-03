// components/scan-history/formatters.utils.js

export function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function formatFullDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(iso) {
  return `${formatFullDate(iso)} at ${formatTime(iso)}`;
}

export function getLocationString(scan) {
  const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
}

export function hasCoordinates(scan) {
  return scan.latitude != null && scan.longitude != null;
}

export function openMaps(latitude, longitude) {
  const { Platform, Linking } = require("react-native");
  const url = Platform.select({
    ios: `maps:0,0?q=${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    default: `https://maps.google.com/?q=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch((err) => {
    console.warn("[openMaps] Failed to open maps:", err);
  });
}
