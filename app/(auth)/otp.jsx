/**
 * OTP Screen — 6-digit OTP entry with countdown timer.
 * Matches Flow 01 (OTP Verify) from the UI/UX spec.
 */

import Button from '@/src/components/common/Button';
import Screen from '@/src/components/common/Screen';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 5l-7 7 7 7"
      stroke={colors.textSecondary} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 16 19.79 19.79 0 011.61 7.36 2 2 0 013.6 5.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 12a16 16 0 006.06 6.06l.97-.97a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z"
      stroke={colors.primary} strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── OTP Box ───────────────────────────────────────────────────────────────────

function OtpBox({ value, active, filled }) {
  const shake = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.otpBox,
        filled && styles.otpBoxFilled,
        active && styles.otpBoxActive,
        animStyle,
      ]}
    >
      <Text style={styles.otpDigit}>{value ?? ''}</Text>
    </Animated.View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OtpScreen() {
  const router = useRouter();
  const { mockLogin } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleChange = (val) => {
    if (val.length <= OTP_LENGTH) setOtp(val);
  };

  const handleVerify = () => {
    if (otp.length < OTP_LENGTH) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockLogin();
      router.replace('/(app)/home');
    }, 1200);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp('');
    setTimer(RESEND_COOLDOWN);
    setCanResend(false);
  };

  return (
    <Screen bg={colors.screenBg}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Back */}
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <BackIcon />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Icon */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.iconWrap}>
            <View style={styles.iconBox}>
              <PhoneIcon />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.textBlock}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.phone}>+91 98765 43210</Text>
            </Text>
          </Animated.View>

          {/* OTP boxes — tap to focus hidden input */}
          <Animated.View entering={FadeInUp.delay(250).duration(500)}>
            <TouchableOpacity
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
              style={styles.boxRow}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <OtpBox
                  key={i}
                  value={otp[i]}
                  filled={i < otp.length}
                  active={i === otp.length && i < OTP_LENGTH}
                />
              ))}
            </TouchableOpacity>

            {/* Hidden real input */}
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              style={styles.hiddenInput}
              caretHidden
              autoFocus
            />
          </Animated.View>

          {/* Timer */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.timerWrap}>
            <View style={styles.timerBadge}>
              <View style={[styles.timerDot, canResend && styles.timerDotGreen]} />
              <Text style={styles.timerText}>
                {canResend ? 'Ready to resend' : `Resend code in ${formatTimer(timer)}`}
              </Text>
            </View>
          </Animated.View>

          {/* Verify button */}
          <Animated.View entering={FadeInUp.delay(350).duration(500)}>
            <Button
              label="Verify & Continue →"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.length < OTP_LENGTH}
            />
          </Animated.View>

          {/* Resend */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text style={[styles.resendLink, !canResend && styles.resendDisabled]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[8],
    gap: spacing[6],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.labelLg,
    color: colors.textSecondary,
  },

  // ── Icon ──────────────────────────────────────
  iconWrap: {
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: radius['5xl'],
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  // ── Text ──────────────────────────────────────
  textBlock: {
    gap: spacing[2],
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  phone: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },

  // ── OTP boxes ─────────────────────────────────
  boxRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBgSoft,
  },
  otpBoxActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  otpDigit: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  // ── Timer ─────────────────────────────────────
  timerWrap: {
    alignItems: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chipFull,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  timerDotGreen: {
    backgroundColor: colors.success,
  },
  timerText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },

  // ── Resend ────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
  },
  resendDisabled: {
    color: colors.textTertiary,
  },
});