/**
 * @file app/index.jsx
 * @description Entry / Welcome screen — SchoolQR Guardian
 *
 * Fixes:
 *  1. Added useEffect to handle auth-based redirect directly on this screen
 *  2. Shows nothing (null) while redirect is in progress to avoid flash
 */

import { useAuthStore } from '@/src/features/auth/auth.store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0D0D0F',
  bgDeep: '#120909',
  red: '#FF3B30',
  redDark: '#C8211A',
  white: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.42)',
  textDim: 'rgba(255,255,255,0.22)',
  ringBorder: 'rgba(255,59,48,0.20)',
  cardBorder: 'rgba(255,255,255,0.06)',
  secondaryBg: 'rgba(255,255,255,0.07)',
  secondaryBorder: 'rgba(255,255,255,0.10)',
  green: '#2ECC71',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ShieldCheckIcon = ({ size = 68 }) => (
  <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
    <Path
      d="M36 5L9 16v20c0 16.3 11.7 31.4 27 35.4C52.3 67.4 63 52.3 63 36V16L36 5z"
      stroke={COLORS.red}
      strokeWidth={2.2}
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M23 36.5l9 9 17-17"
      stroke={COLORS.red}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PersonIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="4" stroke={COLORS.white} strokeWidth="2" />
    <Path
      d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7"
      stroke={COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── PulseRing ─────────────────────────────────────────────────────────────────

const PulseRing = ({ size, delay, baseOpacity }) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    const DURATION = 2200;
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.25, { duration: DURATION, easing: Easing.out(Easing.quad) }),
          withTiming(0.85, { duration: DURATION, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: DURATION }),
          withTiming(baseOpacity, { duration: DURATION })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        animStyle,
      ]}
    />
  );
};

// ─── StatusDot ─────────────────────────────────────────────────────────────────

const StatusDot = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.statusDot, animStyle]} />;
};

// ─── WelcomeScreen ─────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  // ✅ FIX: If already authenticated, skip welcome and go straight to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(app)/home');
    }
  }, [isAuthenticated]);

  // ✅ FIX: Don't render welcome UI while redirecting — prevents flash
  if (isAuthenticated) return null;

  const handleGetStarted = useCallback(() => {
    router.push({ pathname: '/(auth)/login', params: { mode: 'register' } });
  }, []);

  const handleSignIn = useCallback(() => {
    router.push({ pathname: '/(auth)/login', params: { mode: 'login' } });
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.bg, COLORS.bgDeep, COLORS.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Ambient red glow */}
      <View style={styles.glowWrap} pointerEvents="none">
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />
      </View>

      {/* ── Icon section ── */}
      <View style={[styles.iconSection, { paddingTop: insets.top + 20 }]}>
        <PulseRing size={220} delay={0} baseOpacity={0.10} />
        <PulseRing size={170} delay={500} baseOpacity={0.15} />
        <PulseRing size={128} delay={250} baseOpacity={0.09} />

        <Animated.View entering={FadeIn.duration(700).delay(150)} style={styles.iconCard}>
          <LinearGradient
            colors={['#1E2133', '#151720']}
            style={styles.iconCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ShieldCheckIcon />
          </LinearGradient>
        </Animated.View>

        <StatusDot />
      </View>

      {/* ── Bottom section ── */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 28) }]}>

        <Animated.View entering={FadeInDown.duration(550).delay(350)}>
          <Text style={styles.titleWrap} allowFontScaling={false}>
            <Text style={styles.titleWhite}>School</Text>
            <Text style={styles.titleRed}>{`QR\n`}</Text>
            <Text style={styles.titleWhite}>Guardian</Text>
          </Text>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(550).delay(480)}
          style={styles.subtitle}
          allowFontScaling={false}
        >
          {`Your child's safety card,\nalways in your pocket.`}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.duration(550).delay(620)}
          style={styles.buttonGroup}
        >
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleGetStarted}
            style={styles.primaryWrapper}
            accessibilityRole="button"
            accessibilityLabel="Get started — create a new account"
          >
            <LinearGradient
              colors={[COLORS.red, COLORS.redDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <PersonIcon />
              <Text style={styles.primaryLabel}>  Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSignIn}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
          >
            <Text style={styles.secondaryLabel}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(550).delay(780)}
          style={styles.trustBadge}
        >
          <View style={styles.trustDot} />
          <Text style={styles.trustText} allowFontScaling={false}>
            Trusted by 2,400+ parents across India
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  glowWrap: {
    position: 'absolute',
    top: Dimensions.get('window').height * 0.04,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.red,
    opacity: 0.055,
  },
  glowInner: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.red,
    opacity: 0.10,
  },
  iconSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.ringBorder,
  },
  iconCard: {
    width: 112,
    height: 112,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 18,
  },
  iconCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 30,
  },
  statusDot: {
    position: 'absolute',
    top: '26%',
    right: '29%',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  bottomSection: {
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  titleWrap: {
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 46,
  },
  titleWhite: {
    fontSize: 40,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.white,
    letterSpacing: -0.8,
  },
  titleRed: {
    fontSize: 40,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.red,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 38,
    letterSpacing: 0.15,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 26,
  },
  primaryWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.50,
    shadowRadius: 16,
    elevation: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    borderRadius: 16,
  },
  primaryLabel: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondaryBg,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondaryBorder,
  },
  secondaryLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  trustDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  trustText: {
    color: COLORS.textDim,
    fontSize: 13,
    letterSpacing: 0.15,
  },
});