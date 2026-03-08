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
  StyleSheet,
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

import { authApi } from "@/features/auth/auth.api";
import { useAuthStore } from "@/features/auth/auth.store";
import { registrationApi } from "@/features/profile/profile.api";

// ── Constants ───────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;
const PHONE_REGEX = /^[+\d\s-]{10,}$/;

const COLORS = {
  bg: "#0D0D0F",
  bgMid: "#120909",
  surface: "#161820",
  card: "#1A1B22",
  cardBorder: "rgba(255,255,255,0.08)",
  red: "#FF3B30",
  redDark: "#C8211A",
  redGlow: "rgba(255,59,48,0.18)",
  boxBg: "#1C1D24",
  boxBgFilled: "#211215",
  boxBorder: "rgba(255,255,255,0.10)",
  boxBorderActive: "#FF3B30",
  boxBorderFilled: "rgba(255,59,48,0.55)",
  white: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.45)",
  timerBg: "rgba(255,255,255,0.07)",
  timerBorder: "rgba(255,255,255,0.10)",
  timerDot: "#FF9500",
  green: "#2ECC71",
  greenSoft: "rgba(46,204,113,0.12)",
  danger: "#FF3B30",
};

// ── Icons ───────────────────────────────────────
const PhoneIcon = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Path
      d="M6 5.5C6 5.5 8.5 3 10.5 3C12.5 3 14 6.5 14.5 8.5C15 10.5 13 12 13 13C13 14 16 19 18 21C20 23 24 25.5 25.5 25.5C27 25.5 28.5 23.5 30 23C31.5 22.5 34 24 34 26C34 28 31 31 29 31C27 31 18 28 12 22C6 16 3 7 5.5 5.5H6Z"
      stroke={COLORS.red}
      strokeWidth={1.8}
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const ArrowRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke={COLORS.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BackArrow = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M11 6l-6 6 6 6" stroke={COLORS.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── OTP Box ─────────────────────────────────────
const OtpBox = ({ value, isFocused, hasError, index, boxSize }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(300 + index * 70, withTiming(1, { duration: 300 }));
    scale.value = withDelay(300 + index * 70, withSpring(1, { damping: 14, stiffness: 160 }));
  }, [index, opacity, scale]);

  useEffect(() => {
    if (value) {
      pop.value = withSequence(
        withSpring(1.18, { damping: 8, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }
  }, [value, pop]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const digitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  const borderColor = hasError
    ? COLORS.danger
    : isFocused
      ? COLORS.boxBorderActive
      : value
        ? COLORS.boxBorderFilled
        : COLORS.boxBorder;

  return (
    <Animated.View style={containerStyle}>
      <View
        style={[
          styles.otpBox,
          {
            width: boxSize,
            height: boxSize,
            borderColor,
            backgroundColor: value ? COLORS.boxBgFilled : COLORS.boxBg,
          },
          isFocused && styles.otpBoxFocused,
        ]}
      >
        {isFocused && !value && <View style={styles.cursor} />}
        <Animated.Text style={[styles.otpDigit, digitStyle]}>
          {value}
        </Animated.Text>
      </View>
      {(isFocused || value) && (
        <View
          style={[
            styles.otpGlowLine,
            { backgroundColor: hasError ? COLORS.danger : COLORS.red },
          ]}
        />
      )}
    </Animated.View>
  );
};

// ── Main Screen ─────────────────────────────────
export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  // ── Params validation ──
  const rawPhone = (params.phone || "").replace(/[^\d+\s-]/g, "").trim();
  const mode = params.mode === "login" ? "login" : "register";

  // Registration-only params — nonce links OTP verify to the card + phone from init
  // nonce is a 64-char hex string, never stored to disk, used once then discarded
  const nonce = typeof params.nonce === "string" ? params.nonce.trim() : null;
  const maskedPhone = typeof params.maskedPhone === "string" ? params.maskedPhone : null;
  // cardNumber needed for resend in register mode — re-calls initRegistration to get new nonce
  const cardNumber = typeof params.cardNumber === "string" ? params.cardNumber.trim() : null;

  useEffect(() => {
    if (!rawPhone || !PHONE_REGEX.test(rawPhone)) {
      router.replace("/(auth)/login");
    }
    // Guard: if register mode but no nonce, someone navigated here directly
    // Redirect to register screen so they go through init again
    if (mode === "register" && !nonce) {
      router.replace({ pathname: "/(auth)/login", params: { mode: "register" } });
    }
  }, [rawPhone, mode, nonce]);

  // ── Dynamic box size ──
  const boxSize = useMemo(
    () => Math.min(Math.floor((width - 48 - 5 * 8) / 6), 52),
    [width]
  );

  // ── State ──
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActive] = useState(0);
  const [hasError, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  // activeNonce: starts from router params, gets replaced on each resend
  // Never stored to disk — lives only in component state for this session
  const [activeNonce, setActiveNonce] = useState(nonce);

  // ── Resend timer state (single source of truth) ──
  const [resendDeadline, setResendDeadline] = useState(
    () => Date.now() + RESEND_SECONDS * 1000
  );
  const [canResend, setCanResend] = useState(false);
  const [secsLeft, setSecsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining <= 0) {
        setCanResend(true);
        return;
      }
      timerId = setTimeout(tick, 500);
    };
    let timerId = setTimeout(tick, 500);
    return () => clearTimeout(timerId);
  }, [resendDeadline]);

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  // ── Animations ──
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const isFilled = otp.every((d) => d.length === 1);

  // ── Delayed focus on mount ──
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ── Input handlers (functional updates — no stale closures) ──
  const handleChange = useCallback((text, index) => {
    const digit = text.replace(/\D/g, "").slice(-1);

    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

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
          setTimeout(() => {
            inputRefs.current[index - 1]?.focus();
            setActive(index - 1);
          }, 0);
          return next;
        }
        return prev;
      });
    }
  }, []);

  // ── Submit ──
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(9, { duration: 55 }),
      withTiming(-9, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(3, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }, [shakeX]);

  const handleSubmit = useCallback(async () => {
    if (!isFilled || verified || isSubmitting) return;

    setIsSubmitting(true);
    Keyboard.dismiss();
    setError(false);

    try {
      const code = otp.join("");

      if (mode === "register") {
        // ── Registration verify ───────────────────────────────────────────
        // POST /parent/auth/register/verify { nonce, otp }
        // nonce was passed from login.jsx via router params — never stored to disk
        // Backend: validates nonce + OTP → creates student shell → ISSUED token → returns JWT
        const response = await registrationApi.verifyRegistration({ nonce: activeNonce, otp: code });

        // jwt from registration is a signed JWT with sub=parent_id, type="parent"
        // loginSuccess decodes exp, stores tokens in SecureStore, sets isAuthenticated=true
        // Note: registration returns a single jwt (not accessToken/refreshToken pair)
        // We use it as the access token; refresh will be issued on first /auth/refresh call
        await loginSuccess(
          { id: response.data.student_id, phone: rawPhone },
          response.data.jwt,
          response.data.jwt, // temporary: use same token until first refresh
        );

        setVerified(true);

        // Small delay for verified animation to show before navigation
        setTimeout(() => {
          router.replace("/(app)/updates");
        }, 800);

      } else {
        // ── Login verify ──────────────────────────────────────────────────
        // POST /auth/verify-otp { phone, otp }
        const response = await authApi.verifyOtp({ phone: rawPhone, otp: code });

        await loginSuccess(
          { id: response.parent.id, phone: rawPhone },
          response.accessToken,
          response.refreshToken,
        );
        setVerified(true);
        // AuthProvider handles navigation for login flow
      }
    } catch {
      setError(true);
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  }, [otp, isFilled, verified, isSubmitting, rawPhone, mode, activeNonce, loginSuccess, triggerShake]);

  // ── Resend (single handler for all triggers) ──
  const handleResend = useCallback(async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendDeadline(Date.now() + RESEND_SECONDS * 1000);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(false);
    setActive(0);

    try {
      if (mode === "register" && cardNumber) {
        // Re-call initRegistration to get a fresh nonce + new OTP
        // Old nonce becomes invalid on backend once new one is issued
        const response = await registrationApi.initRegistration({
          card_number: cardNumber,
          phone: rawPhone,
        });
        // Update activeNonce — old one is now stale
        setActiveNonce(response.data.nonce);
      } else {
        await authApi.resendOtp({ phone: rawPhone });
      }
    } catch {
      // Silent — timer already reset, user can try again
    }

    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [canResend, rawPhone, mode, cardNumber]);

  // ── Button press ──
  const onPressIn = () => {
    if (isFilled) btnScale.value = withSpring(0.96, { damping: 14 });
  };
  const onPressOut = () => {
    btnScale.value = withSpring(1, { damping: 14 });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <Animated.Text
        entering={FadeInDown.duration(600)}
        style={styles.heading}
      >
        OTP Verification
      </Animated.Text>

        <LinearGradient
          colors={[COLORS.bg, COLORS.bgMid, COLORS.bg]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.backRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <BackArrow />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Icon */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.iconWrap}>
            <View style={styles.iconGlow} pointerEvents="none" />
            <View style={styles.iconCard}>
              <LinearGradient
                colors={["#1E2030", "#141520"]}
                style={styles.iconCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <PhoneIcon size={38} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(500).delay(280)} style={styles.titleBlock}>
            <Text style={styles.title} allowFontScaling={false}>
              {mode === "register" ? "Verify Phone" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              {mode === "register"
                ? "We sent a 6-digit code to"
                : "Enter the code sent to"}
            </Text>
            <Text style={styles.phoneNumber} allowFontScaling={false}>
              {rawPhone}
            </Text>
          </Animated.View>

          {/* OTP Boxes */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.otpSection}>
            <Animated.View style={[styles.otpRow, shakeStyle]}>
              {otp.map((digit, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <OtpBox
                    value={digit}
                    isFocused={activeIndex === i}
                    hasError={hasError}
                    index={i}
                    boxSize={boxSize}
                  />
                  <TextInput
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[styles.hiddenInput, { width: boxSize, height: boxSize }]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => { setActive(i); setError(false); }}
                    keyboardType="number-pad"
                    maxLength={1}
                    caretHidden
                    selectTextOnFocus
                    accessibilityLabel={`OTP digit ${i + 1}`}
                  />
                </View>
              ))}
            </Animated.View>

            {hasError && (
              <Animated.Text
                entering={FadeInDown.duration(250)}
                style={styles.errorText}
                allowFontScaling={false}
              >
                Incorrect code · Please try again
              </Animated.Text>
            )}

            {verified && (
              <Animated.View entering={FadeInDown.duration(350)} style={styles.successBadge}>
                <View style={styles.successDot} />
                <Text style={styles.successText}>Verified! Redirecting…</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Timer */}
          <Animated.View entering={FadeInDown.duration(500).delay(700)} style={styles.timerRow}>
            <View style={styles.timerPill}>
              <View
                style={[
                  styles.timerDot,
                  { backgroundColor: canResend ? COLORS.green : COLORS.timerDot },
                ]}
              />
              <Text style={styles.timerText}>
                {canResend ? "Code expired — " : "Resend code in "}
                {!canResend && <Text style={styles.timerCount}>{mm}:{ss}</Text>}
              </Text>
              {canResend && (
                <TouchableOpacity onPress={handleResend} accessibilityRole="button">
                  <Text style={styles.resendActive}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.btnWrapper}>
            <Animated.View style={btnStyle}>
              <TouchableOpacity
                activeOpacity={1}
                disabled={!isFilled || verified || isSubmitting}
                onPress={handleSubmit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.btnTouchable}
                accessibilityRole="button"
                accessibilityLabel="Verify and continue"
                accessibilityState={{ disabled: !isFilled || verified || isSubmitting }}
              >
                {isFilled && !verified && !isSubmitting ? (
                  <LinearGradient
                    colors={[COLORS.red, COLORS.redDark]}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.btnLabel}>Verify & Continue</Text>
                    <View style={styles.arrowCircle}>
                      <ArrowRight />
                    </View>
                  </LinearGradient>
                ) : isSubmitting ? (
                  <LinearGradient
                    colors={[COLORS.red, COLORS.redDark]}
                    style={[styles.btnGradient, { opacity: 0.7 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.btnLabel}>Verifying…</Text>
                  </LinearGradient>
                ) : verified ? (
                  <View style={[styles.btnGradient, styles.btnVerified]}>
                    <Text style={styles.btnLabel}>Verified ✓</Text>
                  </View>
                ) : (
                  <View style={[styles.btnGradient, styles.btnDisabled]}>
                    <Text style={styles.btnLabelDisabled}>Verify & Continue</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Didn't receive — uses same gated handler */}
          <Animated.View entering={FadeInDown.duration(500).delay(750)} style={styles.didntReceiveRow}>
            <Text style={styles.didntReceiveText} allowFontScaling={false}>
              Didn't receive?{" "}
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.resendLink,
                  !canResend && { opacity: 0.3 },
                ]}
              >
                Resend OTP
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  root: {
    flex: 1, backgroundColor: COLORS.bg
  },
  scroll: {
    flexGrow: 1, paddingHorizontal: 24
  },

  backRow: { marginBottom: 28 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  backText: { color: COLORS.white, fontSize: 16, fontWeight: "500", letterSpacing: 0.1 },

  iconWrap: { alignItems: "center", marginBottom: 32 },
  iconGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.red, opacity: 0.07 },
  iconCard: { width: 90, height: 90, borderRadius: 24, overflow: "hidden", shadowColor: COLORS.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
  iconCardGradient: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 24 },

  titleBlock: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: Platform.select({ ios: "800", android: "700" }), color: COLORS.white, letterSpacing: -0.6, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, letterSpacing: 0.1, lineHeight: 22 },
  phoneNumber: { fontSize: 15, color: COLORS.white, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },

  otpSection: { marginBottom: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  otpBox: { borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  otpBoxFocused: { shadowColor: COLORS.red, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  otpGlowLine: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2.5, borderRadius: 2 },
  cursor: { position: "absolute", bottom: 10, width: 1.5, height: 18, backgroundColor: COLORS.red, borderRadius: 1 },
  otpDigit: { color: COLORS.white, fontSize: 22, fontWeight: "700", letterSpacing: 1 },
  hiddenInput: { position: "absolute", top: 0, left: 0, opacity: 0 },

  errorText: { color: COLORS.danger, fontSize: 13, letterSpacing: 0.2, marginTop: 14, textAlign: "center" },
  successBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.greenSoft, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9, alignSelf: "center", marginTop: 14 },
  successDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
  successText: { color: COLORS.green, fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },

  timerRow: { alignItems: "center", marginBottom: 32 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.timerBg, borderWidth: 1, borderColor: COLORS.timerBorder, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9 },
  timerDot: { width: 7, height: 7, borderRadius: 4 },
  timerText: { color: COLORS.textMuted, fontSize: 13, letterSpacing: 0.15 },
  timerCount: { color: COLORS.white, fontWeight: "700", letterSpacing: 1 },
  resendActive: { color: COLORS.red, fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },

  btnWrapper: { marginBottom: 18 },
  btnTouchable: { borderRadius: 16, overflow: "hidden", shadowColor: COLORS.red, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 12 },
  btnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, gap: 12 },
  btnDisabled: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, shadowOpacity: 0, elevation: 0 },
  btnVerified: { backgroundColor: COLORS.green, shadowColor: COLORS.green },
  btnLabel: { color: COLORS.white, fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  btnLabelDisabled: { color: "rgba(255,255,255,0.25)", fontSize: 17, fontWeight: "600" },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },

  didntReceiveRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  didntReceiveText: { color: COLORS.textMuted, fontSize: 14 },
  resendLink: { color: COLORS.red, fontSize: 14, fontWeight: "700", letterSpacing: 0.15 },
});