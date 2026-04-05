/**
 * @file utils/profile.utils.js
 * @description Shared helpers used across multiple screens.
 *
 * Import in:
 *   app/(app)/home.jsx             ← tokenMeta, fmtRelTime, fmtDate, profileCompleteness, missingFields
 *   app/(app)/qr.jsx               ← tokenMeta  (card status badge on QR screen)
 *   app/(app)/scan-history.jsx     ← fmtRelTime, fmtDate  (scan log timestamps)
 *   app/(app)/updates.jsx          ← profileCompleteness, missingFields  (edit form progress bar)
 *   components/common/TokenBadge   ← tokenMeta  (if you make a shared badge component)
 */

// ─── Token status metadata ────────────────────────────────────────────────────
// TokenStatus enum: UNASSIGNED | ISSUED | ACTIVE | INACTIVE | REVOKED | EXPIRED
// Returns: { label, color, bg, pulse }
// Requires: colors from @/theme

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

// ─── Relative time formatter ──────────────────────────────────────────────────
// e.g. "3d ago", "2h ago", "5m ago", "Just now"

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

// ─── Date formatter (en-IN) ───────────────────────────────────────────────────
// e.g. "09 Mar 2026"

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Emergency profile completeness (0–100) ───────────────────────────────────
// ✅ FIX: doctor_phone is optional – removed from denominator
// Fields: blood_group, allergies, conditions, medications, doctor_name, ≥1 contact
// doctor_phone is nice-to-have but not required for completeness

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
  const totalFields = fields.length; // 6 fields (doctor_phone excluded)
  return Math.round((filledCount / totalFields) * 100);
}

// ─── Missing emergency profile fields (for nudge UI) ─────────────────────────
// Returns string[] of human-readable missing field names
// ✅ FIX: doctor_phone is optional – only show if user wants to add it

export function missingFields(ep, contacts) {
  const m = [];
  if (!ep?.blood_group) m.push("Blood group");
  if (!ep?.allergies) m.push("Allergies");
  if (!ep?.doctor_name) m.push("Doctor name");
  if (!contacts?.length) m.push("Emergency contact");
  // doctor_phone is optional – not included in missing fields
  return m;
}
