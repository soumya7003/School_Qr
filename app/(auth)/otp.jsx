/**
 * app/(auth)/otp.jsx
 * OPTIMIZED: Removed animations, reused colors/haptics/toast
 */

import { C } from "@/constants/constants";
import { authApi } from "@/features/auth/auth.api";
import { registrationApi } from "@/features/profile/profile.api";
import { useLoginSuccess, useRegistrationSuccess } from "@/providers/AuthProvider";
import { haptics } from "@/utils/haptics";
import { showToast } from "@/utils/toast";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clipboard,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120;
const PHONE_REGEX = /^[+\d\s-]{10,}$/;

// Simple OTP Box - no animations
const OtpBox = ({ value, isFocused, hasError, boxSize }) => {
  const borderColor = hasError ? C.red : isFocused ? C.red : value ? "rgba(255,59,48,0.55)" : "rgba(255,255,255,0.10)";
  return (
    <View style={[s.otpBox, { width: boxSize, height: boxSize, borderColor, backgroundColor: value ? "#211215" : "#1C1D24" }, isFocused && s.otpBoxFocused]}>
      {isFocused && !value && <View style={s.cursor} />}
      <Text style={s.otpDigit}>{value}</Text>
    </View>
  );
};

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const onLoginSuccess = useLoginSuccess();
  const onRegistrationSuccess = useRegistrationSuccess();

  const rawPhone = (params.phone ?? "").replace(/[^\d+\s-]/g, "").trim();
  const mode = params.mode === "login" ? "login" : "register";
  const nonce = typeof params.nonce === "string" ? params.nonce.trim() : null;
  const cardNumber = typeof params.cardNumber === "string" ? params.cardNumber.trim() : null;

  const boxSize = useMemo(() => Math.min(Math.floor((width - 48 - 5 * 8) / 6), 52), [width]);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActive] = useState(0);
  const [hasError, setError] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activeNonce, setActiveNonce] = useState(nonce);
  const [canResend, setCanResend] = useState(false);
  const [secsLeft, setSecsLeft] = useState(RESEND_SECONDS);
  const [resendDeadline] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const inputRefs = useRef([]);

  const isFilled = otp.every((d) => d.length === 1);

  // Param guard
  useEffect(() => {
    if (!rawPhone || !PHONE_REGEX.test(rawPhone)) {
      router.replace("/(auth)/login");
      return;
    }
    if (mode === "register" && !nonce) {
      router.replace({ pathname: "/(auth)/login", params: { mode: "register" } });
    }
  }, []);

  // Timer
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining <= 0) setCanResend(true);
    };
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  // Auto-submit
  useEffect(() => {
    if (isFilled && !isSubmitting) handleSubmit();
  }, [otp, isFilled]);

  // Paste support
  const handlePaste = useCallback(async () => {
    try {
      const pasted = await Clipboard.getString();
      const digits = pasted.replace(/\D/g, "").slice(0, OTP_LENGTH);
      if (digits.length === OTP_LENGTH) {
        setOtp(digits.split(""));
        haptics.light();
      }
    } catch { }
  }, []);

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
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      setOtp((prev) => { const next = [...prev]; next[index - 1] = ""; return next; });
      inputRefs.current[index - 1]?.focus();
      setActive(index - 1);
    }
  }, [otp]);

  const handleSubmit = useCallback(async () => {
    if (!isFilled || isSubmitting) return;
    setSubmitting(true);
    Keyboard.dismiss();
    setError(false);

    try {
      const code = otp.join("");
      if (mode === "register") {
        const res = await registrationApi.verifyRegistration({ nonce: activeNonce, otp: code, phone: rawPhone });
        await onRegistrationSuccess({ parent_id: res.parent_id, accessToken: res.accessToken, refreshToken: res.refreshToken, expiresAt: res.expiresAt });
      } else {
        const res = await authApi.verifyOtp(rawPhone, code);
        await onLoginSuccess({ parent: res.parent, accessToken: res.accessToken, refreshToken: res.refreshToken, expiresAt: res.expiresAt, isNewUser: res.isNewUser });
      }
      haptics.success();
      showToast.success("Verified", "Redirecting...");
    } catch {
      setError(true);
      haptics.error();
      showToast.error("Invalid Code", "Please try again");
    } finally {
      setSubmitting(false);
    }
  }, [otp, isFilled, isSubmitting, rawPhone, mode, activeNonce, onLoginSuccess, onRegistrationSuccess]);

  const handleResend = useCallback(async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    haptics.light();
    setCanResend(false);
    setResendDeadline(Date.now() + RESEND_SECONDS * 1000);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(false);
    setActive(0);
    try {
      if (mode === "register" && cardNumber) {
        const res = await registrationApi.initRegistration({ card_number: cardNumber, phone: rawPhone });
        setActiveNonce(res.nonce);
      } else {
        await authApi.sendOtp(rawPhone);
      }
      showToast.info("Code Sent", "Check your messages");
    } catch {
      showToast.error("Failed", "Please try again");
    } finally {
      setIsResending(false);
      inputRefs.current[0]?.focus();
    }
  }, [canResend, isResending, rawPhone, mode, cardNumber]);

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.root}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        <LinearGradient colors={[C.bg, C.bgDeep, C.bg]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 32) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="arrow-left" size={20} color={C.white} />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          <View style={s.iconWrap}>
            <View style={s.iconCard}>
              <LinearGradient colors={["#1E2030", "#141520"]} style={s.iconGradient}>
                <Feather name="smartphone" size={38} color={C.red} />
              </LinearGradient>
            </View>
          </View>

          <View style={s.titleBlock}>
            <Text style={s.title}>{mode === "register" ? "Verify Phone" : "Welcome Back"}</Text>
            <Text style={s.subtitle}>{mode === "register" ? "We sent a 6-digit code to" : "Enter the code sent to"}</Text>
            <Text style={s.phoneNumber}>{rawPhone}</Text>
          </View>

          <View style={s.otpSection}>
            <View style={s.otpRow}>
              {otp.map((digit, i) => (
                <View key={i}>
                  <OtpBox value={digit} isFocused={activeIndex === i} hasError={hasError} boxSize={boxSize} />
                  <TextInput
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[s.hiddenInput, { width: boxSize, height: boxSize }]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    onFocus={() => { setActive(i); setError(false); }}
                    keyboardType="number-pad"
                    maxLength={1}
                    caretHidden
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>
            {hasError && <Text style={s.errorText}>Incorrect code · Please try again</Text>}
          </View>

          <View style={s.timerRow}>
            <View style={s.timerPill}>
              <View style={[s.timerDot, { backgroundColor: canResend ? C.green : C.red }]} />
              <Text style={s.timerText}>
                {canResend ? "Code expired — " : "Resend code in "}
                {!canResend && <Text style={s.timerCount}>{mm}:{ss}</Text>}
              </Text>
              {canResend && (
                <TouchableOpacity onPress={handleResend} disabled={isResending}>
                  <Text style={[s.resendActive, isResending && { opacity: 0.5 }]}>{isResending ? "Sending..." : "Resend OTP"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isFilled || isSubmitting}
            onPress={handleSubmit}
            style={[s.btnTouchable, (!isFilled || isSubmitting) && s.btnDisabled]}
          >
            <LinearGradient colors={[C.red, C.redDark]} style={s.btnGradient}>
              <Text style={s.btnLabel}>{isSubmitting ? "Verifying..." : "Verify & Continue"}</Text>
              <Feather name="arrow-right" size={18} color={C.white} style={s.arrowIcon} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.didntRow}>
            <Text style={s.didntText}>Didn't receive? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend || isResending} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={[s.resendLink, (!canResend || isResending) && { opacity: 0.3 }]}>{isResending ? "Sending..." : "Resend OTP"}</Text>
            </TouchableOpacity>
          </View>

          {!isFilled && !hasError && (
            <TouchableOpacity onPress={handlePaste} style={s.pasteHint}>
              <Text style={s.pasteHintText}>📋 Tap to paste from clipboard</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginBottom: 28 },
  backText: { color: C.white, fontSize: 16, fontWeight: "500" },
  iconWrap: { alignItems: "center", marginBottom: 32 },
  iconCard: { width: 90, height: 90, borderRadius: 24, overflow: "hidden" },
  iconGradient: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 24 },
  titleBlock: { marginBottom: 36 },
  title: { fontSize: 34, fontWeight: Platform.select({ ios: "800", android: "700" }), color: C.white, letterSpacing: -0.6, marginBottom: 8 },
  subtitle: { fontSize: 15, color: C.textMuted, lineHeight: 22 },
  phoneNumber: { fontSize: 15, color: C.white, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
  otpSection: { marginBottom: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  otpBox: { borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  otpBoxFocused: { shadowColor: C.red, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  cursor: { position: "absolute", bottom: 10, width: 1.5, height: 18, backgroundColor: C.red, borderRadius: 1 },
  otpDigit: { color: C.white, fontSize: 22, fontWeight: "700" },
  hiddenInput: { position: "absolute", top: 0, left: 0, opacity: 0 },
  errorText: { color: C.red, fontSize: 13, marginTop: 14, textAlign: "center" },
  timerRow: { alignItems: "center", marginBottom: 32 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.secondaryBg, borderWidth: 1, borderColor: C.secondaryBorder, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9 },
  timerDot: { width: 7, height: 7, borderRadius: 4 },
  timerText: { color: C.textMuted, fontSize: 13 },
  timerCount: { color: C.white, fontWeight: "700" },
  resendActive: { color: C.red, fontSize: 13, fontWeight: "700" },
  btnTouchable: { borderRadius: 16, overflow: "hidden", shadowColor: C.red, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 12 },
  btnDisabled: { shadowOpacity: 0, elevation: 0, opacity: 0.6 },
  btnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16, gap: 8 },
  btnLabel: { color: C.white, fontSize: 17, fontWeight: "700" },
  arrowIcon: { marginLeft: 4 },
  didntRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 },
  didntText: { color: C.textMuted, fontSize: 14 },
  resendLink: { color: C.red, fontSize: 14, fontWeight: "700" },
  pasteHint: { alignItems: "center", marginTop: 16 },
  pasteHintText: { color: C.textDim, fontSize: 11 },
});