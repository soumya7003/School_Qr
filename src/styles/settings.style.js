/**
 * settings.styles.js — Screen-level styles for SettingsScreen only.
 * Component-level styles live inside each component file.
 */

import { colors, radius, spacing, typography } from "@/theme";
import { StyleSheet } from "react-native";

export const settingsStyles = StyleSheet.create({
  // ── Scroll container ──────────────────────────
  scroll: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },

  // ── Page header ───────────────────────────────
  header: { gap: spacing[1] },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageSub: { ...typography.bodySm, color: colors.textTertiary },

  // ── Parent identity card ──────────────────────
  parentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3.5],
  },
  parentAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.avatarLg,
    backgroundColor: colors.primaryBg,
    borderWidth: 1.5,
    borderColor: "rgba(232,52,42,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  parentInitial: { ...typography.h4, color: colors.primary },
  parentPhone: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  parentVerifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    marginTop: 3,
  },
  verifyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  verifyText: { ...typography.labelXs, color: colors.success },
  parentEnding: {
    ...typography.labelSm,
    color: colors.textTertiary,
    fontVariant: ["tabular-nums"],
  },

  // ── Settings group wrapper ────────────────────
  group: { gap: spacing[1.5] },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  // ── Theme row (no chevron, contains ThemeSegment) ──
  themeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    // no borderBottom — ThemeSegment is last in Appearance group
  },
  themeRowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  themeRowBody: { flex: 1, gap: spacing[0.5] },
  themeRowTitle: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  // ── Footer ────────────────────────────────────
  footer: { alignItems: "center", paddingTop: spacing[2], gap: spacing[1] },
  footerText: {
    ...typography.labelSm,
    color: colors.textTertiary,
    fontWeight: "600",
  },
  footerSub: { ...typography.labelXs, color: colors.textTertiary },
});
