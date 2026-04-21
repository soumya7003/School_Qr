// components/scan-history/scanHistory.styles.js

import { spacing } from "@/theme";
import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenH,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, marginTop: 1, fontWeight: "500" },
  headerRight: { width: 42 },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    maxWidth: "48%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  statIconBg: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },

  // List
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 8,
    paddingBottom: 40,
  },
  listHeaderContainer: { gap: 20, marginBottom: 8 },

  // Anomaly
  anomalyAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  anomalyAlertText: { flex: 1, fontSize: 14, fontWeight: "600" },

  // Filter
  filterLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  filterContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 30,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: "600" },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  sectionBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: "700" },

  // Timeline Item
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  timelineLeft: { alignItems: "center", marginRight: 14 },
  timelineLine: { width: 3, height: 30, borderRadius: 2, marginBottom: 4 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  timelineContent: { flex: 1, gap: 8 },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  timelineHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  timelineTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  emergencyBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  emergencyBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  timelineTime: { fontSize: 12, fontWeight: "500" },
  timelineDetails: { gap: 6 },

  // Detail Row
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, fontWeight: "500", flex: 1 },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Footer
  footerContainer: { paddingVertical: 20, alignItems: "center" },
  endMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
  },
  endMessageText: { fontSize: 13, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  modalClose: { padding: 4 },
  modalBody: { padding: 20, gap: 20 },
  detailSection: { gap: 10, paddingBottom: 16, borderBottomWidth: 1 },
  detailSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  detailLabel: { fontSize: 13, fontWeight: "600", width: 45 },
  detailValue: { flex: 1, fontSize: 14, lineHeight: 20 },
  locationGroup: { gap: 4 },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  mapButtonText: { fontSize: 13, fontWeight: "700" },
  purposeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  purposeText: { fontSize: 12, fontWeight: "700" },

  // Skeleton
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  skeletonIcon: { width: 16, height: 16, borderRadius: 4 },
  skeletonTextContainer: { flex: 1, gap: 4 },
  skeletonText: { height: 14, borderRadius: 6 },
  skeletonTextSmall: { height: 10, borderRadius: 4 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16 },
});
