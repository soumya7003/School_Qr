import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Theme (matches full app) ─────────────────────────────────────────────────

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

const OTP_LENGTH = 4;
const RESEND_SECONDS = 25;

// ─── Single OTP Box ───────────────────────────────────────────────────────────

function OtpBox({
  value,
  focused,
  hasError,
  index,
  scale,
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Entrance stagger
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: 400 + index * 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 10, delay: 400 + index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // Focus border animation
  useEffect(() => {
    Animated.timing(borderAnim, { toValue: focused ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [focused]);

  // Digit pop
  const digitScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (value) {
      Animated.sequence([
        Animated.spring(digitScale, { toValue: 1.25, tension: 200, friction: 6, useNativeDriver: true }),
        Animated.spring(digitScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      hasError ? THEME.colors.danger : THEME.colors.cardBorder,
      THEME.colors.accent,
    ],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME.colors.card, "#191E2E"],
  });

  const boxSize = scale(62);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Animated.View
        style={[
          boxStyles.box,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: THEME.radius.md,
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        {focused && <View style={boxStyles.cursor} />}
        <Animated.Text
          style={[
            boxStyles.digit,
            { fontSize: scale(22), transform: [{ scale: digitScale }] },
            hasError && { color: THEME.colors.danger },
          ]}
        >
          {value || ""}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const boxStyles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cursor: {
    position: "absolute",
    bottom: 12,
    width: 2,
    height: 18,
    backgroundColor: THEME.colors.accent,
    borderRadius: 1,
  },
  digit: {
    color: THEME.colors.light,
    fontWeight: "700",
    fontFamily: THEME.font.mono,
    letterSpacing: 2,
  },
});

// ─── Resend Timer ─────────────────────────────────────────────────────────────

function ResendTimer({ onResend }) {
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const canResend = seconds === 0;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, delay: 900, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleResend = () => {
    if (!canResend) return;
    setSeconds(RESEND_SECONDS);
    onResend();
  };

  return (
    <Animated.View style={[timerStyles.wrap, { opacity: fade }]}>
      {canResend ? (
        <TouchableOpacity onPress={handleResend} accessibilityRole="button">
          <Text style={timerStyles.resendActive}>Resend code</Text>
        </TouchableOpacity>
      ) : (
        <Text style={timerStyles.resendMuted}>
          Resend OTP in{" "}
          <Text style={timerStyles.countdown}>{seconds}s</Text>
        </Text>
      )}
    </Animated.View>
  );
}

const timerStyles = StyleSheet.create({
  wrap: { alignItems: "center", marginTop: 20 },
  resendActive: {
    color: THEME.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: THEME.font.body,
    letterSpacing: 0.3,
  },
  resendMuted: {
    color: THEME.colors.muted,
    fontSize: 13,
    fontFamily: THEME.font.body,
  },
  countdown: {
    color: THEME.colors.accent,
    fontFamily: THEME.font.mono,
    fontWeight: "700",
  },
});

// ─── Status Badge (blinking, same as Dashboard) ───────────────────────────────

function StatusBadge({ label, color, bg }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg }]}>
      <Animated.View style={[badgeStyles.dot, { backgroundColor: color, opacity: blink }]} />
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: THEME.radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, fontFamily: THEME.font.body },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OTPVerification() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = (n) => (width / 375) * n;
  const hPad = isTablet ? width * 0.18 : 20;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  // Entrance animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(16)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Success checkmark
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnFade, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(btnSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const isFilled = otp.every((d) => d.length === 1);

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setHasError(false);
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handleSubmit = () => {
    // Demo: treat "1234" as correct
    if (otp.join("") === "1234") {
      setHasError(false);
      setVerified(true);
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => router.replace("/(tabs)/dashboard"), 900);
      });
    } else {
      setHasError(true);
      // Shake animation
      const shake = new Animated.Value(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setHasError(false);
    setActiveIndex(0);
    inputs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />
      <View style={styles.stripe} />

      <View style={[styles.container, { paddingHorizontal: hPad }]}>

        {/* ── Wordmark + Back ── */}
        <Animated.View style={[styles.topRow, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.wordmark}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmarkText}>SAFETY QR</Text>
          </View>
          <StatusBadge label="Verifying" color={THEME.colors.accent} bg={THEME.colors.accentGlow} />
        </Animated.View>

        <View style={styles.divider} />

        {/* ── Header ── */}
        <Animated.View style={[{ opacity: headerFade, transform: [{ translateY: headerSlide }] }, styles.header]}>
          <Text style={[styles.title, { fontSize: scale(isTablet ? 30 : 24) }]}>
            Verify{"\n"}Your Phone
          </Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH}-digit code sent to your number
          </Text>
        </Animated.View>

        {/* ── OTP Card ── */}
        <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ scale: cardScale }] }]}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>ONE-TIME PASSWORD</Text>
            <View style={styles.cardHeaderDot} />
          </View>

          <View style={styles.cardBody}>
            {/* OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <OtpBox
                    value={digit}
                    focused={activeIndex === i}
                    hasError={hasError}
                    index={i}
                    scale={scale}
                  />
                  {/* Hidden real input */}
                  <TextInput
                    ref={(r) => { inputs.current[i] = r; }}
                    style={styles.hiddenInput}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => { setActiveIndex(i); setHasError(false); }}
                    keyboardType="number-pad"
                    maxLength={1}
                    caretHidden
                    autoFocus={i === 0}
                  />
                </View>
              ))}
            </View>

            {/* Error message */}
            {hasError && (
              <Animated.Text style={styles.errorText}>
                Incorrect code · Please try again
              </Animated.Text>
            )}

            {/* Success overlay */}
            {verified && (
              <Animated.View style={[styles.successBadge, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>Verified!</Text>
              </Animated.View>
            )}

            {/* Resend */}
            <ResendTimer onResend={handleResend} />

            {/* Hint */}
            <Text style={styles.hintText}>
              Demo: enter <Text style={styles.hintCode}>1234</Text> to verify
            </Text>
          </View>
        </Animated.View>

        {/* ── Submit Button ── */}
        <Animated.View style={[{ opacity: btnFade, transform: [{ translateY: btnSlide }] }]}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.primaryBtn, !isFilled && styles.primaryBtnDisabled]}
              disabled={!isFilled || verified}
              onPress={handleSubmit}
              onPressIn={() => isFilled && pressIn()}
              onPressOut={pressOut}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel="Submit OTP"
            >
              <Text style={[styles.primaryBtnText, !isFilled && styles.primaryBtnTextDisabled]}>
                {verified ? "Verified ✓" : "Submit"}
              </Text>
              {isFilled && !verified && (
                <View style={styles.arrowBadge}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Text style={styles.footer}>
          Secured by your institution · {new Date().getFullYear()}
        </Text>
      </View>
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
  container: { flex: 1, paddingTop: 28, paddingBottom: 40 },

  // Top row
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  backBtn: {
    width: 36, height: 36, borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.card,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    alignItems: "center", justifyContent: "center",
  },
  backArrow: { color: THEME.colors.light, fontSize: 18, fontWeight: "600" },
  wordmark: { flexDirection: "row", alignItems: "center", gap: 6 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  wordmarkText: { fontSize: 11, fontWeight: "700", letterSpacing: 2.5, color: THEME.colors.accent, fontFamily: THEME.font.mono },

  divider: { height: 1, backgroundColor: THEME.colors.cardBorder, marginBottom: 28, opacity: 0.5 },

  // Header
  header: { marginBottom: 28 },
  title: { fontWeight: "800", color: THEME.colors.light, fontFamily: THEME.font.display, letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 13, color: THEME.colors.muted, fontFamily: THEME.font.body, letterSpacing: 0.2, lineHeight: 19 },

  // Card
  card: {
    backgroundColor: THEME.colors.card, borderRadius: THEME.radius.lg,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    overflow: "hidden", marginBottom: 20,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 13,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1, borderBottomColor: THEME.colors.cardBorder,
  },
  cardHeaderLabel: { fontSize: 10, fontFamily: THEME.font.mono, color: THEME.colors.muted, letterSpacing: 2, fontWeight: "700" },
  cardHeaderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  cardBody: { padding: 28, alignItems: "center" },

  // OTP
  otpRow: { flexDirection: "row", gap: 14, marginBottom: 8 },
  hiddenInput: {
    position: "absolute", opacity: 0,
    width: "100%", height: "100%",
    top: 0, left: 0,
  },

  // Error
  errorText: {
    color: THEME.colors.danger, fontSize: 12,
    fontFamily: THEME.font.body, letterSpacing: 0.3,
    marginTop: 10, textAlign: "center",
  },

  // Success
  successBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: THEME.colors.mintSoft,
    borderRadius: THEME.radius.pill,
    paddingHorizontal: 18, paddingVertical: 10,
    marginTop: 14,
  },
  successIcon: { color: THEME.colors.mint, fontSize: 18, fontWeight: "800" },
  successText: { color: THEME.colors.mint, fontSize: 14, fontWeight: "700", fontFamily: THEME.font.body },

  // Hint
  hintText: { color: THEME.colors.dimmed, fontSize: 11, fontFamily: THEME.font.body, marginTop: 16, letterSpacing: 0.3 },
  hintCode: { color: THEME.colors.accent, fontFamily: THEME.font.mono, fontWeight: "700" },

  // Button
  primaryBtn: {
    backgroundColor: THEME.colors.accent, borderRadius: THEME.radius.md,
    paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: THEME.colors.card, borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder, shadowOpacity: 0, elevation: 0,
  },
  primaryBtnText: { color: THEME.colors.white, fontSize: 16, fontWeight: "700", fontFamily: THEME.font.body, letterSpacing: 0.3 },
  primaryBtnTextDisabled: { color: THEME.colors.dimmed },
  arrowBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  arrowText: { color: THEME.colors.white, fontSize: 18, fontWeight: "600" },

  footer: { textAlign: "center", color: THEME.colors.dimmed, fontSize: 11, fontFamily: THEME.font.body, letterSpacing: 0.3, marginTop: 20 },
});