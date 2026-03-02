/**
 * @file app/(auth)/otp.jsx
 * @description OTP Verification screen — SchoolQR Guardian
 *
 * Flow:
 *   index.jsx → (auth)/login.jsx → (auth)/otp.jsx → /(app)/home.jsx
 *
 * Receives params:
 *   phone  — masked phone number to display  e.g. "+91 98765 43210"
 *   mode   — "register" | "login"
 *
 * Dependencies:
 *   npx expo install expo-linear-gradient react-native-svg
 *                    react-native-reanimated react-native-safe-area-context
 *
 * babel.config.js must include: plugins: ['react-native-reanimated/plugin']
 */

import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const RESEND_SECONDS = 120; // 2 min timer shown in image

const COLORS = {
  bg: '#0D0D0F',
  bgMid: '#120909',
  surface: '#161820',
  card: '#1A1B22',
  cardBorder: 'rgba(255,255,255,0.08)',
  red: '#FF3B30',
  redDark: '#C8211A',
  redGlow: 'rgba(255,59,48,0.18)',
  redFaint: 'rgba(255,59,48,0.07)',
  boxBg: '#1C1D24',
  boxBgFilled: '#211215',
  boxBorder: 'rgba(255,255,255,0.10)',
  boxBorderActive: '#FF3B30',
  boxBorderFilled: 'rgba(255,59,48,0.55)',
  white: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  textDim: 'rgba(255,255,255,0.22)',
  timerBg: 'rgba(255,255,255,0.07)',
  timerBorder: 'rgba(255,255,255,0.10)',
  timerDot: '#FF9500',
  green: '#2ECC71',
  greenSoft: 'rgba(46,204,113,0.12)',
  danger: '#FF3B30',
  dangerSoft: 'rgba(255,59,48,0.12)',
};

// ─── Phone Icon ────────────────────────────────────────────────────────────────

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

// ─── Arrow Icon ────────────────────────────────────────────────────────────────

const ArrowRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke={COLORS.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Single OTP Box ────────────────────────────────────────────────────────────

const OtpBox = ({ value, isFocused, hasError, index }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  // Entrance stagger
  useEffect(() => {
    opacity.value = withDelay(300 + index * 70, withTiming(1, { duration: 300 }));
    scale.value = withDelay(300 + index * 70, withSpring(1, { damping: 14, stiffness: 160 }));
  }, []);

  // Pop when value changes
  const pop = useSharedValue(1);
  useEffect(() => {
    if (value) {
      pop.value = withSequence(
        withSpring(1.18, { damping: 8, stiffness: 260 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }
  }, [value]);

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

  const bgColor = value
    ? COLORS.boxBgFilled
    : COLORS.boxBg;

  return (
    <Animated.View style={[styles.otpBoxOuter, containerStyle]}>
      <View
        style={[
          styles.otpBox,
          { borderColor, backgroundColor: bgColor },
          isFocused && styles.otpBoxFocused,
        ]}
      >
        {isFocused && !value && <View style={styles.cursor} />}
        <Animated.Text style={[styles.otpDigit, digitStyle]}>
          {value}
        </Animated.Text>
      </View>
      {/* Bottom glow line when active/filled */}
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

// ─── Resend Timer ──────────────────────────────────────────────────────────────

const ResendTimer = ({ onResend }) => {
  const [secs, setSecs] = useState(RESEND_SECONDS);
  const [canResend, setResend] = useState(false);

  useEffect(() => {
    if (secs <= 0) { setResend(true); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const handleResend = () => {
    if (!canResend) return;
    setSecs(RESEND_SECONDS);
    setResend(false);
    onResend();
  };

  const filledCount = otp.filter(Boolean).length;
  const isComplete = filledCount === OTP_LENGTH;

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(700)}
      style={styles.timerRow}
    >
      <View style={styles.timerPill}>
        <View style={[styles.timerDot, { backgroundColor: canResend ? COLORS.green : COLORS.timerDot }]} />
        <Text style={styles.timerText}>
          {canResend
            ? 'Code expired — '
            : `Resend code in `}
          {!canResend && (
            <Text style={styles.timerCount}>{mm}:{ss}</Text>
          )}
        </Text>
        {canResend && (
          <TouchableOpacity onPress={handleResend} accessibilityRole="button">
            <Text style={styles.resendActive}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const phone = params.phone || '+91 98765 43210';
  const mode = params.mode || 'register';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActive] = useState(0);
  const [hasError, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  // Shake animation value
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // Button press scale
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const isFilled = otp.every(d => d.length === 1);

  // ── Input Handlers ──────────────────────────────────────────────────────────

  const handleChange = useCallback((text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(false);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActive(index + 1);
    }
  }, [otp]);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      inputRefs.current[index - 1]?.focus();
      setActive(index - 1);
    }
  }, [otp]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(9, { duration: 55 }),
      withTiming(-9, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(3, { duration: 55 }),
      withTiming(0, { duration: 55 }),
    );
  };

  const handleSubmit = useCallback(() => {
    if (!isFilled || verified) return;
    Keyboard.dismiss();

    // Demo validation — replace with real API call
    if (otp.join('') === '123456') {
      setVerified(true);
      setTimeout(() => router.replace('/(app)/home'), 1200);
    } else {
      setError(true);
      triggerShake();
    }
  }, [otp, isFilled, verified]);

  const handleResend = useCallback(() => {
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(false);
    setActive(0);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const onPressIn = () => { if (isFilled) btnScale.value = withSpring(0.96, { damping: 14 }); };
  const onPressOut = () => { btnScale.value = withSpring(1, { damping: 14 }); };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.root}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

        {/* Background */}
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

          {/* ── Back button ── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.backRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M19 12H5M11 6l-6 6 6 6" stroke={COLORS.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Phone icon card ── */}
          <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.iconWrap}>
            {/* Glow */}
            <View style={styles.iconGlow} pointerEvents="none" />
            <View style={styles.iconCard}>
              <LinearGradient
                colors={['#1E2030', '#141520']}
                style={styles.iconCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <PhoneIcon size={38} />
              </LinearGradient>
            </View>
          </Animated.View>

          {/* ── Title block ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(280)}
            style={styles.titleBlock}
          >
            <Text style={styles.title} allowFontScaling={false}>Enter OTP</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.phoneNumber} allowFontScaling={false}>{phone}</Text>
          </Animated.View>

          {/* ── OTP boxes ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.otpSection}
          >
            <Animated.View style={[styles.otpRow, shakeStyle]}>
              {otp.map((digit, i) => (
                <View key={i} style={{ position: 'relative' }}>
                  <OtpBox
                    value={digit}
                    isFocused={activeIndex === i}
                    hasError={hasError}
                    index={i}
                  />
                  {/* Invisible real input layered over the box */}
                  <TextInput
                    ref={r => { inputRefs.current[i] = r; }}
                    style={styles.hiddenInput}
                    value={digit}
                    onChangeText={t => handleChange(t, i)}
                    onKeyPress={e => handleKeyPress(e, i)}
                    onFocus={() => { setActive(i); setError(false); }}
                    keyboardType="number-pad"
                    maxLength={1}
                    caretHidden
                    autoFocus={i === 0}
                    selectTextOnFocus
                    accessibilityLabel={`OTP digit ${i + 1}`}
                  />
                </View>
              ))}
            </Animated.View>

            {/* Error message */}
            {hasError && (
              <Animated.Text
                entering={FadeInDown.duration(250)}
                style={styles.errorText}
                allowFontScaling={false}
              >
                Incorrect code · Please try again
              </Animated.Text>
            )}

            {/* Success badge */}
            {verified && (
              <Animated.View
                entering={FadeInDown.duration(350)}
                style={styles.successBadge}
              >
                <View style={styles.successDot} />
                <Text style={styles.successText}>Verified! Redirecting…</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Resend timer ── */}
          <ResendTimer onResend={handleResend} />

          {/* ── CTA Button ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(600)}
            style={styles.btnWrapper}
          >
            <Animated.View style={btnStyle}>
              <TouchableOpacity
                activeOpacity={1}
                disabled={!isFilled || verified}
                onPress={handleSubmit}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.btnTouchable}
                accessibilityRole="button"
                accessibilityLabel="Verify and continue"
                accessibilityState={{ disabled: !isFilled || verified }}
              >
                {isFilled && !verified ? (
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

          {/* ── Didn't receive ── */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(750)}
            style={styles.didntReceiveRow}
          >
            <Text style={styles.didntReceiveText} allowFontScaling={false}>
              Didn't receive?{' '}
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const BOX_SIZE = Math.min(Math.floor((W - 48 - 5 * 8) / 6), 52);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bg },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Back
  backRow: { marginBottom: 28 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // Icon
  iconWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.red,
    opacity: 0.07,
  },
  iconCard: {
    width: 90,
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 24,
  },

  // Title
  titleBlock: { marginBottom: 36 },
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.white,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  phoneNumber: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // OTP
  otpSection: { marginBottom: 20 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBoxOuter: {
    position: 'relative',
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    elevation: 6,
  },
  otpGlowLine: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    borderRadius: 2,
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 1.5,
    height: 18,
    backgroundColor: COLORS.red,
    borderRadius: 1,
  },
  otpDigit: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
  },

  // Error
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    letterSpacing: 0.2,
    marginTop: 14,
    textAlign: 'center',
  },

  // Success badge
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.greenSoft,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignSelf: 'center',
    marginTop: 14,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  successText: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Timer
  timerRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.timerBg,
    borderWidth: 1,
    borderColor: COLORS.timerBorder,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  timerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  timerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    letterSpacing: 0.15,
  },
  timerCount: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendActive: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Button
  btnWrapper: { marginBottom: 18 },
  btnTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  btnDisabled: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnVerified: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
  },
  btnLabel: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnLabelDisabled: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 17,
    fontWeight: '600',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Didn't receive
  didntReceiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  didntReceiveText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
});