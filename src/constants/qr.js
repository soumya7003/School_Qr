// src/constants/qr.js
import { Dimensions } from "react-native";

const { width: SW } = Dimensions.get("window");
export const CARD_W = SW - 48;
export const CARD_H = Math.round(CARD_W * 0.631);

// Blood group enum mapping
export const BLOOD_GROUP_FROM_ENUM = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  O_POS: "O+",
  O_NEG: "O−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
  UNKNOWN: "Unknown",
};

// Card palette generator
export function cardPalette(status) {
  switch (status) {
    case "ACTIVE":
      return {
        gradFront: ["#0B1A10", "#0D1F13", "#071209"],
        gradBack: ["#091509", "#0B1A0C", "#060E06"],
        glow: "#12A150",
        shimmer: "rgba(18,161,80,0.22)",
        accent: "#12A150",
        chip: "#1A3A22",
      };
    case "INACTIVE":
      return {
        gradFront: ["#1A1508", "#1D1709", "#110F05"],
        gradBack: ["#161206", "#1A1508", "#0E0B04"],
        glow: "#F97316",
        shimmer: "rgba(249,115,22,0.22)",
        accent: "#F97316",
        chip: "#2E2310",
      };
    case "REVOKED":
    case "EXPIRED":
      return {
        gradFront: ["#1A0808", "#1C0A0A", "#130606"],
        gradBack: ["#150505", "#180707", "#0D0404"],
        glow: "#EF4444",
        shimmer: "rgba(239,68,68,0.20)",
        accent: "#EF4444",
        chip: "#2E1010",
      };
    case "ISSUED":
      return {
        gradFront: ["#0A0F1C", "#0D1322", "#060A12"],
        gradBack: ["#080D18", "#0B1020", "#050810"],
        glow: "#60A5FA",
        shimmer: "rgba(96,165,250,0.20)",
        accent: "#60A5FA",
        chip: "#10182E",
      };
    default:
      return {
        gradFront: ["#10101A", "#131318", "#0A0A10"],
        gradBack: ["#0C0C14", "#0F0F18", "#08080E"],
        glow: "#444",
        shimmer: "rgba(240,240,244,0.06)",
        accent: "rgba(240,240,244,0.30)",
        chip: "#1A1A22",
      };
  }
}

// Card badge generator
export function cardBadge(status, t) {
  switch (status) {
    case "ACTIVE":
      return {
        label: t("qr.badgeActive"),
        color: "#12A150",
        bg: "rgba(18,161,80,0.18)",
        bd: "rgba(18,161,80,0.38)",
        pulse: true,
      };
    case "INACTIVE":
      return {
        label: t("qr.badgeInactive"),
        color: "#F97316",
        bg: "rgba(249,115,22,0.18)",
        bd: "rgba(249,115,22,0.38)",
        pulse: false,
      };
    case "ISSUED":
      return {
        label: t("qr.badgeIssued"),
        color: "#60A5FA",
        bg: "rgba(96,165,250,0.18)",
        bd: "rgba(96,165,250,0.38)",
        pulse: false,
      };
    case "REVOKED":
      return {
        label: t("qr.badgeRevoked"),
        color: "#EF4444",
        bg: "rgba(239,68,68,0.18)",
        bd: "rgba(239,68,68,0.38)",
        pulse: false,
      };
    case "EXPIRED":
      return {
        label: t("qr.badgeExpired"),
        color: "#EF4444",
        bg: "rgba(239,68,68,0.18)",
        bd: "rgba(239,68,68,0.38)",
        pulse: false,
      };
    default:
      return {
        label: t("qr.badgeNotSetUp"),
        color: "rgba(240,240,244,0.45)",
        bg: "rgba(255,255,255,0.06)",
        bd: "rgba(255,255,255,0.12)",
        pulse: false,
      };
  }
}

// Format helpers
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtValidThru(iso) {
  if (!iso) return "——/——";
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
}

export function fmtCardNum(n) {
  if (!n) return "RQ-0000-XXXXXXXX";
  const parts = n.split("-");
  if (parts.length === 3) return `${parts[0]}  ${parts[1]}  ${parts[2]}`;
  return n;
}
