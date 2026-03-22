/**
 * app/(auth)/otp.jsx
 *
 * BUGS FIXED vs original:
 *
 *   [FIX-1] Uses useLoginSuccess / useRegistrationSuccess hooks from AuthProvider
 *           instead of raw useAuthStore((s) => s.loginSuccess).
 *           Original bypassed fetchAndPersist entirely — login arrived at home
 *           with an empty profile store.
 *
 *   [FIX-2] Registration branch passes isNewUser: true via useRegistrationSuccess.
 *           Original never passed the flag → isNewUser was always false → onboarding
 *           gate never triggered.
 *
 *   [FIX-3] Removed manual setTimeout router.replace("/(app)/updates") after registration.
 *           AuthProvider owns ALL navigation reactively. Manual replace + AuthProvider
 *           both firing caused a double-navigation race condition.
 *
 *   [FIX-4] Resend OTP for login mode uses authApi.sendOtp (was authApi.resendOtp
 *           which doesn't exist in auth.api.js).
 *
 *   [FIX-5] expiresAt passed through to loginSuccess — was dropped before,
 *           causing storage.hasValidSession() to return false on next cold start.
 */

import { authApi } from "@/features/auth/auth.api";
import { registrationApi } from "@/features/profile/profile.api";
import {
  useLoginSuccess,
  useRegistrationSuccess,
} from "@/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

// ── Constants ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;
const PHONE_REGEX = /^[+\d\s-]{10,}$/;

const C = {
  bg: "#0D0D0F", bgMid: "#120909", surface: "#161820", card: "#1A1B22",
  cardBorder: "rgba(255,255,255,0.08)", red: "#FF3B30", redDark: "#C8211A",
  boxBg: "#1C1D24", boxBgFilled: "#211215", boxBorder: "rgba(255,255,255,0.10)",
  boxBorderActive: "#FF3B30", boxBorderFilled: "rgba(255,59,48,0.55)",
  white: "#FFFFFF", textMuted: "rgba(255,255,255,0.45)",
  timerBg: "rgba(255,255,255,0.07)", timerBorder: "rgba(255,255,255,0.10)",
  timerDot: "#FF9500", green: "#2ECC71", greenSoft: "rgba(46,204,113,0.12)",
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const PhoneIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M6 5.5C6 5.5 8.5 3 10.5 3C12.5 3 14 6.5 14.5 8.5C15 10.5 13 12 13 13C13 14 16 19 18 21C20 23 24 25.5 25.5 25.5C27 25.5 28.5 23.5 30 23C31.5 22.5 34 24 34 26C34 28 31 31 29 31C27 31 18 28 12 22C6 16 3 7 5.5 5.5H6Z"
      stroke={C.red} strokeWidth={1.8} strokeLinejoin="round" fill="none"
    />
  </Svg>
);

const ArrowRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke={C.white} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BackArrow = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M11 6l-6 6 6 6" stroke={C.white} strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── OTP Box ───────────────────────────────────────────────────────────────────

const OtpBox = ({ value, isFocused, hasError, index, boxSize }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(300 + index * 70, withTiming(1, { duration: 300 }));
    scale.value = withDelay(300 + index * 70, withSpring(1, { damping: 14, stiffness: 160 }));
  }, []);

  useEffect(() => {
    if (value) {
      pop.value = withSequence(
        withSpring(1.18, { damping: 8, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
  }, [value]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value, transform: [{ scale: scale.value }],
  }));
  const digitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  const borderColor = hasError ? C.red
    : isFocused ? C.boxBorderActive
      : value ? C.boxBorderFilled
        : C.boxBorder;

  return (
    <Animated.View style={containerStyle}>
      <View style={[s.otpBox, {
        width: boxSize, height: boxSize, borderColor,
        backgroundColor: value ? C.boxBgFilled : C.boxBg
      }, isFocused && s.otpBoxFocused]}>
        {isFocused && !value && <View style={s.cursor} />}
        <Animated.Text style={[s.otpDigit, digitStyle]}>{value}</Animated.Text>
      </View>
      {(isFocused || value) && (
        <View style={[s.glowLine, { backgroundColor: hasError ? C.red : C.red }]} />
      )}
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();

  // [FIX-1] Use hooks — not raw loginSuccess from useAuthStore
  const onLoginSuccess = useLoginSuccess();
  const onRegistrationSuccess = useRegistrationSuccess();

  // ── Params ────────────────────────────────────────────────────────────────
  const rawPhone = (params.phone ?? "").replace(/[^\d+\s-]/g, "").trim();
  const mode = params.mode === "login" ? "login" : "register";
  const nonce = typeof params.nonce === "string" ? params.nonce.trim() : null;
  const cardNumber = typeof params.cardNumber === "string" ? params.cardNumber.trim() : null;

  // ── Param guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rawPhone || !PHONE_REGEX.test(rawPhone)) {
      router.replace("/(auth)/login");
      return;
    }
    if (mode === "register" && !nonce) {
      router.replace({ pathname: "/(auth)/login", params: { mode: "register" } });
    }
  }, [rawPhone, mode, nonce]);

  const boxSize = useMemo(
    () => Math.min(Math.floor((width - 48 - 5 * 8) / 6), 52),
    [width],
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActive] = useState(0);
  const [hasError, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [activeNonce, setActiveNonce] = useState(nonce);
  const [canResend, setCanResend] = useState(false);
  const [secsLeft, setSecsLeft] = useState(RESEND_SECONDS);
  const [resendDeadline, setResendDeadline] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const inputRefs = useRef([]);

  // ── Resend timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining <= 0) { setCanResend(true); return; }
      timerId = setTimeout(tick, 500);
    };
    let timerId = setTimeout(tick, 500);
    return () => clearTimeout(timerId);
  }, [resendDeadline]);

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  // ── Animations ────────────────────────────────────────────────────────────
  const shakeX = useSharedValue(0);
  const btnScale = useSharedValue(1);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const isFilled = otp.every((d) => d.length === 1);

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 600);
    return () => clearTimeout(t);
  }, []);

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleChange = useCallback((text, index) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    setOtp((prev) => { const next = [...prev]; next[index] = digit; return next; });
    setError(false);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActive(index + 1);
    }
  }, []);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      setOtp((prev) => {
        if (!prev[index] && index > 0) {
          const next = [...prev];
          next[index - 1] = "";
          setTimeout(() => { inputRefs.current[index - 1]?.focus(); setActive(index - 1); }, 0);
          return next;
        }
        return prev;
      });
    }
  }, []);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(9, { duration: 55 }), withTiming(-9, { duration: 55 }),
      withTiming(6, { duration: 55 }), withTiming(-6, { duration: 55 }),
      withTiming(3, { duration: 55 }), withTiming(0, { duration: 55 }),
    );
  }, [shakeX]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isFilled || verified || isSubmitting) return;
    setSubmitting(true);
    Keyboard.dismiss();
    setError(false);

    try {
      const code = otp.join("");

      if (mode === "register") {
        // POST /parent/register/verify → { accessToken, refreshToken, expiresAt, parent_id, student_id }
        const response = await registrationApi.verifyRegistration({
          nonce: activeNonce,
          otp: code,
          phone: rawPhone, // required by backend to encrypt parent's phone
        });

        // [FIX-2] useRegistrationSuccess sets isNewUser: true → AuthProvider → /updates
        // [FIX-3] No manual router.replace — AuthProvider handles it
        await onRegistrationSuccess({
          parent_id: response.parent_id,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,  // [FIX-5]
        });

        setVerified(true);
        // AuthProvider reacts to isNewUser: true and navigates to /(app)/updates

      } else {
        // POST /auth/verify-otp → { accessToken, refreshToken, expiresAt, isNewUser, parent: { id } }
        const response = await authApi.verifyOtp(rawPhone, code);

        // [FIX-1] useLoginSuccess calls fetchAndPersist — original skipped this
        // [FIX-5] expiresAt passed through
        await onLoginSuccess({
          parent: response.parent,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: response.expiresAt,
          isNewUser: response.isNewUser,
        });

        setVerified(true);
        // AuthProvider reacts to isAuthenticated: true, isNewUser: false → /(app)/home
      }

    } catch {
      setError(true);
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }, [otp, isFilled, verified, isSubmitting, rawPhone, mode, activeNonce,
    onLoginSuccess, onRegistrationSuccess, triggerShake]);

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setCanResend(false);
    setResendDeadline(Date.now() + RESEND_SECONDS * 1000);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(false);
    setActive(0);

    try {
      if (mode === "register" && cardNumber) {
        // Re-init registration → new nonce
        const response = await registrationApi.initRegistration({
          card_number: cardNumber,
          phone: rawPhone,
        });
        setActiveNonce(response.data.nonce);
      } else {
        // [FIX-4] sendOtp (not resendOtp — that method doesn't exist)
        await authApi.sendOtp(rawPhone);
      }
    } catch {
      // Silent — timer already reset, user can try again
    }

    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [canResend, rawPhone, mode, cardNumber]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      <View style={s.root}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

        <LinearGradient colors={[C.bg, C.bgMid, C.bg]} locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject} pointerEvents="none" />

        <ScrollView
          contentContainerStyle={[s.scroll, {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 32),
          }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Animated.View entering={FadeIn.duration(400)} style={s.backRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}
              accessibilityRole="button" accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <BackArrow />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Icon */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={s.iconWrap}>
            <View style={s.iconGlow} pointerEvents="none" />
            <View style={s.iconCard}>
              <LinearGradient colors={["#1E2030", "#141520"]} style={s.iconGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <PhoneIcon size={38} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(500).delay(280)} style={s.titleBlock}>
            <Text style={s.title} allowFontScaling={false}>
              {mode === "register" ? "Verify Phone" : "Welcome Back"}
            </Text>
            <Text style={s.subtitle} allowFontScaling={false}>
              {mode === "register" ? "We sent a 6-digit code to" : "Enter the code sent to"}
            </Text>
            <Text style={s.phoneNumber} allowFontScaling={false}>{rawPhone}</Text>
          </Animated.View>

          {/* OTP Boxes */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={s.otpSection}>
            <Animated.View style={[s.otpRow, shakeStyle]}>
              {otp.map((digit, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <OtpBox value={digit} isFocused={activeIndex === i}
                    hasError={hasError} index={i} boxSize={boxSize} />
                  <TextInput
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[s.hiddenInput, { width: boxSize, height: boxSize }]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => { setActive(i); setError(false); }}
                    keyboardType="number-pad" maxLength={1}
                    caretHidden selectTextOnFocus
                    accessibilityLabel={`OTP digit ${i + 1}`}
                  />
                </View>
              ))}
            </Animated.View>

            {hasError && (
              <Animated.Text entering={FadeInDown.duration(250)} style={s.errorText}
                allowFontScaling={false}>
                Incorrect code · Please try again
              </Animated.Text>
            )}

            {verified && (
              <Animated.View entering={FadeInDown.duration(350)} style={s.successBadge}>
                <View style={s.successDot} />
                <Text style={s.successText}>Verified! Redirecting…</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Timer */}
          <Animated.View entering={FadeInDown.duration(500).delay(700)} style={s.timerRow}>
            <View style={s.timerPill}>
              <View style={[s.timerDot, { backgroundColor: canResend ? C.green : C.timerDot }]} />
              <Text style={s.timerText}>
                {canResend ? "Code expired — " : "Resend code in "}
                {!canResend && <Text style={s.timerCount}>{mm}:{ss}</Text>}
              </Text>
              {canResend && (
                <TouchableOpacity onPress={handleResend} accessibilityRole="button">
                  <Text style={s.resendActive}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={s.btnWrapper}>
            <Animated.View style={btnStyle}>
              <TouchableOpacity
                activeOpacity={1}
                disabled={!isFilled || verified || isSubmitting}
                onPress={handleSubmit}
                onPressIn={() => { if (isFilled) btnScale.value = withSpring(0.96, { damping: 14 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 14 }); }}
                style={s.btnTouchable}
                accessibilityRole="button"
                accessibilityLabel="Verify and continue"
              >
                {isFilled && !verified && !isSubmitting ? (
                  <LinearGradient colors={[C.red, C.redDark]} style={s.btnGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.btnLabel}>Verify &amp; Continue</Text>
                    <View style={s.arrowCircle}><ArrowRight /></View>
                  </LinearGradient>
                ) : isSubmitting ? (
                  <LinearGradient colors={[C.red, C.redDark]}
                    style={[s.btnGradient, { opacity: 0.7 }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={s.btnLabel}>Verifying…</Text>
                  </LinearGradient>
                ) : verified ? (
                  <View style={[s.btnGradient, { backgroundColor: C.green }]}>
                    <Text style={s.btnLabel}>Verified ✓</Text>
                  </View>
                ) : (
                  <View style={[s.btnGradient, s.btnDisabled]}>
                    <Text style={s.btnLabelDim}>Verify &amp; Continue</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Didn't receive */}
          <Animated.View entering={FadeInDown.duration(500).delay(750)} style={s.didntRow}>
            <Text style={s.didntText} allowFontScaling={false}>Didn't receive? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}
              accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={[s.resendLink, !canResend && { opacity: 0.3 }]}>Resend OTP</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backRow: { marginBottom: 28 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  backText: { color: C.white, fontSize: 16, fontWeight: "500" },
  iconWrap: { alignItems: "center", marginBottom: 32 },
  iconGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: C.red, opacity: 0.07 },
  iconCard: { width: 90, height: 90, borderRadius: 24, overflow: "hidden" },
  iconGradient: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 24
  },
  titleBlock: { marginBottom: 36 },
  title: {
    fontSize: 34, fontWeight: Platform.select({ ios: "800", android: "700" }),
    color: C.white, letterSpacing: -0.6, marginBottom: 8
  },
  subtitle: { fontSize: 15, color: C.textMuted, lineHeight: 22 },
  phoneNumber: { fontSize: 15, color: C.white, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
  otpSection: { marginBottom: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  otpBox: { borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  otpBoxFocused: {
    shadowColor: C.red, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6
  },
  glowLine: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2.5, borderRadius: 2 },
  cursor: { position: "absolute", bottom: 10, width: 1.5, height: 18, backgroundColor: C.red, borderRadius: 1 },
  otpDigit: { color: C.white, fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  hiddenInput: { position: "absolute", top: 0, left: 0, opacity: 0 },
  errorText: { color: C.red, fontSize: 13, marginTop: 14, textAlign: "center" },
  successBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.greenSoft, borderRadius: 50,
    paddingHorizontal: 16, paddingVertical: 9, alignSelf: "center", marginTop: 14
  },
  successDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  successText: { color: C.green, fontSize: 13, fontWeight: "600" },
  timerRow: { alignItems: "center", marginBottom: 32 },
  timerPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.timerBg, borderWidth: 1, borderColor: C.timerBorder,
    borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9
  },
  timerDot: { width: 7, height: 7, borderRadius: 4 },
  timerText: { color: C.textMuted, fontSize: 13 },
  timerCount: { color: C.white, fontWeight: "700", letterSpacing: 1 },
  resendActive: { color: C.red, fontSize: 13, fontWeight: "700" },
  btnWrapper: { marginBottom: 18 },
  btnTouchable: {
    borderRadius: 16, overflow: "hidden", shadowColor: C.red,
    shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.45,
    shadowRadius: 16, elevation: 12
  },
  btnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, gap: 12
  },
  btnDisabled: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
    shadowOpacity: 0, elevation: 0
  },
  btnLabel: { color: C.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  btnLabelDim: { color: "rgba(255,255,255,0.25)", fontSize: 17, fontWeight: "600" },
  arrowCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center"
  },
  didntRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  didntText: { color: C.textMuted, fontSize: 14 },
  resendLink: { color: C.red, fontSize: 14, fontWeight: "700" },
});