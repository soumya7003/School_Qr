import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────

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

// ─── Mock scanned student data ────────────────────────────────────────────────
// In production this comes from QR JSON payload

interface ScannedStudent {
  studentId: string;
  fullName: string;
  department: string;
  year: string;
  bloodType: string;
  emergencyContact: string;
  guardianName: string;
  medicalInfo?: string;
  institution: string;
}

const STUDENT: ScannedStudent = {
  studentId: "STU-2024-0891",
  fullName: "Alex Johnson",
  department: "Computer Science",
  year: "3rd Year",
  bloodType: "O+",
  emergencyContact: "+1 (555) 123-4567",
  guardianName: "Maria Johnson",
  medicalInfo: "Allergic to penicillin. Asthma inhaler required.",
  institution: "State University",
};

// ─── Blinking pulse dot ───────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: blink }]} />;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  index,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string;
  index: number;
  accent?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay: 400 + index * 80, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, tension: 75, friction: 11, delay: 400 + index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.infoRow, { opacity, transform: [{ translateX }] }]}>
      <View style={[styles.infoIconWrap, accent && styles.infoIconAccent]}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, accent && { color: THEME.colors.accent }]}>{value}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Call Button ──────────────────────────────────────────────────────────────

function CallButton({ number, label }: { number: string; label: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.callBtn}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => Linking.openURL(`tel:${number.replace(/\D/g, "")}`)}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Call ${label}`}
      >
        <View style={styles.callBtnLeft}>
          <View style={styles.callIcon}>
            <Text style={styles.callIconText}>📞</Text>
          </View>
          <View>
            <Text style={styles.callLabel}>{label}</Text>
            <Text style={styles.callNumber}>{number}</Text>
          </View>
        </View>
        <View style={styles.callArrow}>
          <Text style={styles.callArrowText}>→</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Blood Type Badge ─────────────────────────────────────────────────────────

function BloodBadge({ type }: { type: string }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 8, delay: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.bloodBadge, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.bloodIcon}>🩸</Text>
      <Text style={styles.bloodType}>{type}</Text>
      <Text style={styles.bloodLabel}>BLOOD TYPE</Text>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScanResult() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = (n: number) => (width / 375) * n;
  const hPad = isTablet ? width * 0.18 : 20;

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.94)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(btnFade, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />
      <View style={styles.stripe} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <Animated.View style={[styles.topBar, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.wordmark}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmarkText}>SAFETY QR</Text>
          </View>
          {/* Verified scan badge */}
          <View style={styles.verifiedBadge}>
            <PulseDot color={THEME.colors.mint} />
            <Text style={styles.verifiedText}>QR Scanned</Text>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {/* ── Alert banner ── */}
        <Animated.View style={[styles.alertBanner, { opacity: headerFade }]}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Emergency Information</Text>
            <Text style={styles.alertSub}>This card was scanned from a student's Safety QR</Text>
          </View>
        </Animated.View>

        {/* ── Hero card ── */}
        <Animated.View style={[styles.heroCard, { opacity: heroFade, transform: [{ scale: heroScale }] }]}>
          <View style={styles.heroCardHeader}>
            <Text style={styles.heroCardHeaderLabel}>STUDENT IDENTITY</Text>
            <View style={styles.heroCardHeaderDot} />
          </View>

          <View style={styles.heroCardBody}>
            {/* Avatar placeholder + blood type side by side */}
            <View style={styles.heroTop}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarInitial}>
                  {STUDENT.fullName.charAt(0)}
                </Text>
              </View>
              <View style={styles.heroTopText}>
                <Text style={[styles.studentName, { fontSize: scale(isTablet ? 24 : 20) }]}>
                  {STUDENT.fullName}
                </Text>
                <Text style={styles.studentMeta}>
                  {STUDENT.year} · {STUDENT.department}
                </Text>
                <Text style={styles.studentId}>{STUDENT.studentId}</Text>
                <Text style={styles.institution}>{STUDENT.institution}</Text>
              </View>
            </View>

            <BloodBadge type={STUDENT.bloodType} />
          </View>
        </Animated.View>

        {/* ── Info rows card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoCardHeaderLabel}>CONTACT DETAILS</Text>
            <View style={styles.infoCardHeaderDot} />
          </View>
          <View style={styles.infoCardBody}>
            <InfoRow icon="🛡" label="Guardian" value={STUDENT.guardianName} index={0} />
            <View style={styles.infoSep} />
            <InfoRow icon="📞" label="Emergency Contact" value={STUDENT.emergencyContact} index={1} accent />
            <View style={styles.infoSep} />
            <InfoRow icon="🏥" label="Medical Info" value={STUDENT.medicalInfo || "None recorded"} index={2} />
          </View>
        </View>

        {/* ── Call buttons ── */}
        <Animated.View style={[styles.callSection, { opacity: btnFade }]}>
          <Text style={styles.callSectionLabel}>QUICK CALL</Text>
          <CallButton number={STUDENT.emergencyContact} label={`${STUDENT.guardianName} (Guardian)`} />
        </Animated.View>

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by Safety QR · {STUDENT.institution} · {new Date().getFullYear()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.bg },
  stripe: {
    position: "absolute", top: 0, right: 0,
    width: 3, height: "100%",
    backgroundColor: THEME.colors.accent, opacity: 0.4, zIndex: 10,
  },
  scroll: { paddingTop: 28, paddingBottom: 48 },

  // Top bar
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  wordmark: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  wordmarkText: { fontSize: 11, fontWeight: "700", letterSpacing: 2.5, color: THEME.colors.accent, fontFamily: THEME.font.mono },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: THEME.colors.mintSoft,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  pulseDot: { width: 7, height: 7, borderRadius: 4 },
  verifiedText: { fontSize: 11, fontWeight: "700", color: THEME.colors.mint, letterSpacing: 0.8, fontFamily: THEME.font.body },

  divider: { height: 1, backgroundColor: THEME.colors.cardBorder, marginBottom: 20, opacity: 0.5 },

  // Alert banner
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: THEME.colors.dangerSoft,
    borderRadius: THEME.radius.md,
    borderWidth: 1, borderColor: THEME.colors.danger,
    padding: 14, marginBottom: 20,
  },
  alertIcon: { fontSize: 22 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: THEME.colors.danger, fontFamily: THEME.font.body, marginBottom: 2 },
  alertSub: { fontSize: 11, color: THEME.colors.muted, fontFamily: THEME.font.body, letterSpacing: 0.2 },

  // Hero card
  heroCard: {
    backgroundColor: THEME.colors.card, borderRadius: THEME.radius.lg,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    overflow: "hidden", marginBottom: 16,
  },
  heroCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 13,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1, borderBottomColor: THEME.colors.cardBorder,
  },
  heroCardHeaderLabel: { fontSize: 10, fontFamily: THEME.font.mono, color: THEME.colors.muted, letterSpacing: 2, fontWeight: "700" },
  heroCardHeaderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  heroCardBody: { padding: 20, gap: 20 },

  heroTop: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: THEME.colors.accentGlow,
    borderWidth: 2, borderColor: THEME.colors.accent,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 24, fontWeight: "800", color: THEME.colors.accent, fontFamily: THEME.font.display },
  heroTopText: { flex: 1, gap: 3 },
  studentName: { fontWeight: "800", color: THEME.colors.light, fontFamily: THEME.font.display, letterSpacing: -0.3 },
  studentMeta: { fontSize: 12, color: THEME.colors.muted, fontFamily: THEME.font.body },
  studentId: { fontSize: 11, color: THEME.colors.accent, fontFamily: THEME.font.mono, letterSpacing: 1.5, marginTop: 2 },
  institution: { fontSize: 11, color: THEME.colors.dimmed, fontFamily: THEME.font.body, marginTop: 1 },

  // Blood badge
  bloodBadge: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: THEME.colors.dangerSoft,
    borderRadius: THEME.radius.md,
    borderWidth: 1, borderColor: THEME.colors.danger,
    paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: "flex-start",
  },
  bloodIcon: { fontSize: 20 },
  bloodType: { fontSize: 22, fontWeight: "800", color: THEME.colors.danger, fontFamily: THEME.font.mono },
  bloodLabel: { fontSize: 9, fontWeight: "700", color: THEME.colors.danger, letterSpacing: 1.5, fontFamily: THEME.font.mono, opacity: 0.7 },

  // Info card
  infoCard: {
    backgroundColor: THEME.colors.card, borderRadius: THEME.radius.lg,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    overflow: "hidden", marginBottom: 20,
  },
  infoCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 13,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1, borderBottomColor: THEME.colors.cardBorder,
  },
  infoCardHeaderLabel: { fontSize: 10, fontFamily: THEME.font.mono, color: THEME.colors.muted, letterSpacing: 2, fontWeight: "700" },
  infoCardHeaderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.mint },
  infoCardBody: { padding: 16 },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 6 },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  infoIconAccent: { backgroundColor: THEME.colors.accentGlow },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: THEME.colors.dimmed, fontFamily: THEME.font.mono, letterSpacing: 1.2, marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: "600", color: THEME.colors.light, fontFamily: THEME.font.body, lineHeight: 20 },
  infoSep: { height: 1, backgroundColor: THEME.colors.cardBorder, marginVertical: 4, opacity: 0.5 },

  // Call section
  callSection: { gap: 10, marginBottom: 8 },
  callSectionLabel: { fontSize: 10, fontWeight: "700", color: THEME.colors.muted, fontFamily: THEME.font.mono, letterSpacing: 2, marginBottom: 4 },
  callBtn: {
    backgroundColor: THEME.colors.mint,
    borderRadius: THEME.radius.md,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16, paddingHorizontal: 20,
    shadowColor: THEME.colors.mint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  callBtnLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  callIcon: {
    width: 38, height: 38, borderRadius: THEME.radius.sm,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  callIconText: { fontSize: 18 },
  callLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.75)", fontFamily: THEME.font.body, letterSpacing: 0.3 },
  callNumber: { fontSize: 15, fontWeight: "800", color: THEME.colors.white, fontFamily: THEME.font.mono },
  callArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  callArrowText: { color: THEME.colors.white, fontSize: 18, fontWeight: "600" },

  footer: { textAlign: "center", color: THEME.colors.dimmed, fontSize: 11, fontFamily: THEME.font.body, letterSpacing: 0.3, marginTop: 24 },
});