import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// ─── Theme (matches Dashboard) ────────────────────────────────────────────────

const THEME = {
  colors: {
    bg: "#0D0F14",
    surface: "#161921",
    card: "#1E2230",
    cardBorder: "#2A2F42",
    accent: "#5B7FFF",
    accentSoft: "#2A3A80",
    accentGlow: "rgba(91, 127, 255, 0.18)",
    mint: "#34D399",
    mintSoft: "rgba(52, 211, 153, 0.12)",
    light: "#E8ECF4",
    muted: "#6B7280",
    dimmed: "#3D4358",
    white: "#FFFFFF",
  },
  font: {
    display: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia",
    }),
    body: Platform.select({
      ios: "Helvetica Neue",
      android: "sans-serif",
      default: "sans-serif",
    }),
    mono: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 50 },
};

// ─── Feature Pills ─────────────────────────────────────────────────────────────

const FEATURES = [
  { label: "Instant QR", icon: "⚡" },
  { label: "Medical Info", icon: "🏥" },
  { label: "Guardian Alert", icon: "🔔" },
];

// ─── Animated Pulse Ring (reused from Dashboard) ───────────────────────────────

function PulseRing({ size }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size + 26,
        height: size + 26,
        borderRadius: (size + 26) / 2,
        borderWidth: 2,
        borderColor: THEME.colors.accent,
        opacity: pulseOpacity,
        transform: [{ scale: pulse }],
      }}
    />
  );
}

// ─── Blinking Status Dot ───────────────────────────────────────────────────────

function StatusBadge() {
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={badge.wrap}>
      <Animated.View style={[badge.dot, { opacity: blink }]} />
      <Text style={badge.text}>Active</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.colors.mintSoft,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.mint,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.mint,
    letterSpacing: 0.8,
    fontFamily: THEME.font.body,
  },
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Welcome() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const hPad = isTablet ? width * 0.18 : 20;

  const scale = (size) => (width / 375) * size;
  const logoSize = scale(isTablet ? 110 : 88);

  // Entrance animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-18)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(16)).current;
  const pillsFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;

  // Button press scales
  const primaryScale = useRef(new Animated.Value(1)).current;
  const secondaryScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(100, [
      // Wordmark
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlide, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Logo
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      // Title + subtitle
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(heroSlide, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Feature pills
      Animated.timing(pillsFade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      // Buttons
      Animated.parallel([
        Animated.timing(btnFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(btnSlide, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const pressIn = (anim) =>
    Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = (anim) =>
    Animated.spring(anim, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />

      {/* Decorative background blobs */}
      <View
        style={[
          styles.blob,
          {
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: width * 0.4,
            top: -width * 0.22,
            left: -width * 0.25,
          },
        ]}
      />
      <View
        style={[
          styles.blobSm,
          {
            width: width * 0.5,
            height: width * 0.5,
            borderRadius: width * 0.25,
            bottom: height * 0.1,
            right: -width * 0.18,
          },
        ]}
      />

      {/* Accent right edge stripe */}
      <View style={styles.stripe} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wordmark ── */}
        <Animated.View
          style={[
            styles.wordmark,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmarkText}>SAFETY QR</Text>
          <View style={{ flex: 1 }} />
          <StatusBadge />
        </Animated.View>

        <View style={styles.divider} />

        {/* ── Hero Logo ── */}
        <Animated.View
          style={[
            styles.logoSection,
            { opacity: logoFade, transform: [{ scale: logoScale }] },
          ]}
        >
          <PulseRing size={logoSize} />
          <View
            style={[
              styles.logoCard,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize * 0.28,
              },
            ]}
          >
            {/* Shield icon layers */}
            <View style={styles.shieldWrap}>
              <View style={styles.shieldTop} />
              <View style={styles.shieldBottom} />
              <Text
                style={[
                  styles.shieldGlyph,
                  { fontSize: scale(isTablet ? 22 : 18) },
                ]}
              >
                ✦
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Title & Subtitle ── */}
        <Animated.View
          style={[
            styles.heroText,
            { opacity: heroFade, transform: [{ translateY: heroSlide }] },
          ]}
        >
          <Text style={[styles.title, { fontSize: scale(isTablet ? 36 : 30) }]}>
            Your Digital{"\n"}Emergency ID
          </Text>
          <Text
            style={[styles.subtitle, { fontSize: scale(isTablet ? 17 : 14) }]}
          >
            One scan. All the info that matters.
          </Text>
        </Animated.View>

        {/* ── Feature Pills ── */}
        <Animated.View style={[styles.pills, { opacity: pillsFade }]}>
          {FEATURES.map(({ label, icon }, i) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillIcon}>{icon}</Text>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 32 }} />

        {/* ── Buttons ── */}
        <Animated.View
          style={[
            styles.btnGroup,
            { opacity: btnFade, transform: [{ translateY: btnSlide }] },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: primaryScale }] }}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={1}
              onPressIn={() => pressIn(primaryScale)}
              onPressOut={() => pressOut(primaryScale)}
              onPress={() => router.push("/scan")}
              accessibilityRole="button"
              accessibilityLabel="Register"
            >
              <Text style={styles.primaryText}>Get Started</Text>
              <View style={styles.arrowBadge}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: secondaryScale }] }}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={1}
              onPressIn={() => pressIn(secondaryScale)}
              onPressOut={() => pressOut(secondaryScale)}
              onPress={() => router.push("/auth")}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Text style={styles.secondaryText}>
                Already have an account? Log in
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Stylesheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },

  blob: {
    position: "absolute",
    backgroundColor: THEME.colors.accent,
    opacity: 0.05,
  },
  blobSm: {
    position: "absolute",
    backgroundColor: THEME.colors.accent,
    opacity: 0.04,
  },
  stripe: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 3,
    height: "100%",
    backgroundColor: THEME.colors.accent,
    opacity: 0.4,
  },

  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingBottom: 44,
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
    marginBottom: 44,
    opacity: 0.5,
  },

  // Logo
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  logoCard: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  shieldTop: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: THEME.colors.accent,
    top: 0,
    opacity: 0.9,
  },
  shieldBottom: {
    position: "absolute",
    bottom: 2,
    width: 40,
    height: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: THEME.colors.accent,
    opacity: 0.9,
  },
  shieldGlyph: {
    color: THEME.colors.white,
    fontWeight: "800",
    zIndex: 10,
    marginTop: 2,
  },

  // Hero text
  heroText: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontWeight: "800",
    color: THEME.colors.light,
    letterSpacing: -0.8,
    textAlign: "center",
    fontFamily: THEME.font.display,
    marginBottom: 12,
    lineHeight: undefined,
  },
  subtitle: {
    color: THEME.colors.muted,
    textAlign: "center",
    letterSpacing: 0.2,
    fontFamily: THEME.font.body,
  },

  // Pills
  pills: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillIcon: {
    fontSize: 12,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.muted,
    letterSpacing: 0.4,
    fontFamily: THEME.font.body,
  },

  // Buttons
  btnGroup: {
    gap: 12,
    alignItems: "stretch",
  },
  primaryBtn: {
    backgroundColor: THEME.colors.accent,
    borderRadius: THEME.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryText: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: THEME.font.body,
  },
  arrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: THEME.colors.white,
    fontSize: 18,
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    borderRadius: THEME.radius.md,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: THEME.colors.card,
  },
  secondaryText: {
    color: THEME.colors.muted,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
    fontFamily: THEME.font.body,
  },
  legal: {
    textAlign: "center",
    color: THEME.colors.dimmed,
    fontSize: 11,
    letterSpacing: 0.3,
    fontFamily: THEME.font.body,
    marginTop: 4,
  },
});
