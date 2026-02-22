import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (matches Dashboard & Welcome) ─────────────────────────────────────

const THEME = {
  colors: {
    bg: "#0D0F14",
    surface: "#161921",
    card: "#1E2230",
    cardBorder: "#2A2F42",
    accent: "#5B7FFF",
    accentGlow: "rgba(91, 127, 255, 0.18)",
    mint: "#34D399",
    mintSoft: "rgba(52, 211, 153, 0.12)",
    warning: "#FBBF24",
    warningSoft: "rgba(251, 191, 36, 0.12)",
    danger: "#F87171",
    dangerSoft: "rgba(248, 113, 113, 0.12)",
    light: "#E8ECF4",
    muted: "#6B7280",
    dimmed: "#3D4358",
    white: "#FFFFFF",
  },
  font: {
    display: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    body: Platform.select({ ios: "Helvetica Neue", android: "sans-serif", default: "sans-serif" }),
    mono: Platform.select({ ios: "Courier New", android: "monospace", default: "monospace" }),
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 50 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type UpdateType = "info" | "alert" | "success" | "warning";

interface Update {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: UpdateType;
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<UpdateType, { color: string; bg: string; icon: string; label: string }> = {
  info: {
    color: THEME.colors.accent,
    bg: THEME.colors.accentGlow,
    icon: "ℹ",
    label: "INFO",
  },
  success: {
    color: THEME.colors.mint,
    bg: THEME.colors.mintSoft,
    icon: "✓",
    label: "SUCCESS",
  },
  alert: {
    color: THEME.colors.danger,
    bg: THEME.colors.dangerSoft,
    icon: "!",
    label: "ALERT",
  },
  warning: {
    color: THEME.colors.warning,
    bg: THEME.colors.warningSoft,
    icon: "⚠",
    label: "WARNING",
  },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const UPDATES: Update[] = [
  {
    id: "1",
    title: "Profile Updated",
    description: "Your personal details were successfully saved.",
    date: "Feb 23, 2026",
    type: "success",
  },
  {
    id: "2",
    title: "Emergency Contact Changed",
    description: "A new guardian number has been linked to your profile.",
    date: "Feb 20, 2026",
    type: "alert",
  },
  {
    id: "3",
    title: "QR Code Scanned",
    description: "Your QR was accessed by campus security.",
    date: "Feb 18, 2026",
    type: "info",
  },
  {
    id: "4",
    title: "Medical Info Incomplete",
    description: "Please fill in your blood type and allergies.",
    date: "Feb 15, 2026",
    type: "warning",
  },
];

// ─── Animated Card ────────────────────────────────────────────────────────────

function UpdateCard({ item, index }: { item: Update; index: number }) {
  const config = TYPE_CONFIG[item.type];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: index * 90,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 75,
        friction: 11,
        delay: index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () =>
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(pressScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale: pressScale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.card}>
          {/* Left accent bar */}
          <View style={[styles.cardBar, { backgroundColor: config.color }]} />

          <View style={styles.cardContent}>
            {/* Top row */}
            <View style={styles.cardRow}>
              {/* Icon badge */}
              <View style={[styles.iconBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.iconText, { color: config.color }]}>{config.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.cardDesc}>{item.description}</Text>
                )}
              </View>

              {/* Type chip */}
              <View style={[styles.typeChip, { backgroundColor: config.bg }]}>
                <Text style={[styles.typeChipText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            </View>

            {/* Date row */}
            <View style={styles.dateRow}>
              <View style={styles.dateDot} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.empty, { opacity: fade }]}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📭</Text>
      </View>
      <Text style={styles.emptyTitle}>All clear</Text>
      <Text style={styles.emptySubtitle}>No activity recorded yet.</Text>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Updates() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = (size: number) => (width / 375) * size;
  const hPad = isTablet ? width * 0.18 : 20;

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />

      {/* Accent stripe */}
      <View style={styles.stripe} />

      <FlatList
        data={UPDATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <UpdateCard item={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingHorizontal: hPad }]}
        ListHeaderComponent={
          <>
            {/* Wordmark */}
            <Animated.View
              style={[styles.wordmark, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
            >
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmarkText}>SAFETY QR</Text>
            </Animated.View>

            <View style={styles.divider} />

            {/* Header */}
            <Animated.View
              style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}
            >
              <View>
                <Text style={[styles.heading, { fontSize: scale(isTablet ? 30 : 24) }]}>
                  Activity Log
                </Text>
                <Text style={styles.subheading}>
                  {UPDATES.length} recent {UPDATES.length === 1 ? "event" : "events"}
                </Text>
              </View>

              {/* Count badge */}
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{UPDATES.length}</Text>
              </View>
            </Animated.View>
          </>
        }
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={
          UPDATES.length > 0 ? (
            <Text style={styles.footer}>
              Showing all {UPDATES.length} events · {new Date().getFullYear()}
            </Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  stripe: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 3,
    height: "100%",
    backgroundColor: THEME.colors.accent,
    opacity: 0.4,
    zIndex: 10,
  },
  list: {
    paddingTop: 28,
    paddingBottom: 48,
  },

  // Wordmark
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.accent,
  },
  wordmarkText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    color: THEME.colors.accent,
    fontFamily: THEME.font.mono,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.cardBorder,
    marginBottom: 22,
    opacity: 0.5,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heading: {
    fontWeight: "800",
    color: THEME.colors.light,
    fontFamily: THEME.font.display,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontFamily: THEME.font.body,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: THEME.colors.accentGlow,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countText: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: THEME.font.mono,
  },

  // Card
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    flexDirection: "row",
    overflow: "hidden",
  },
  cardBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 16,
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.light,
    fontFamily: THEME.font.body,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
    fontFamily: THEME.font.body,
    lineHeight: 17,
  },
  typeChip: {
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: THEME.font.mono,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.dimmed,
  },
  dateText: {
    fontSize: 11,
    color: THEME.colors.dimmed,
    fontFamily: THEME.font.mono,
    letterSpacing: 0.5,
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIconText: { fontSize: 32 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.light,
    fontFamily: THEME.font.display,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.muted,
    fontFamily: THEME.font.body,
  },

  // Footer
  footer: {
    textAlign: "center",
    color: THEME.colors.dimmed,
    fontSize: 11,
    fontFamily: THEME.font.body,
    letterSpacing: 0.4,
    marginTop: 28,
  },
});