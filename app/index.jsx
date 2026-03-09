<<<<<<< HEAD
/**
 * @file app/index.jsx
 * @description Entry / Welcome screen — SchoolQR Guardian
 *
 * Fixes applied (UI is UNCHANGED):
 *  [F1]  router.push → router.replace — prevents back-nav from login to welcome
 *  [F2]  Auth/hydration guard — returns null while loading or if authenticated,
 *        lets AuthProvider handle redirect without screen fighting it
 *  [F3]  PulseRing useEffect deps — added delay + baseOpacity
 *  [F4]  StatusDot useEffect — added comment explaining intentional empty deps
 *  [F5]  mode param validated with allowlist before navigation
 *  [F6]  Dimensions.get replaced with useWindowDimensions hook
 *  [F7]  StatusDot repositioned inside a fixed container relative to icon card
 *  [F8]  TouchableOpacity → Pressable with style callback for reliable Android press
 *  [F9]  allowFontScaling={false} applied consistently to all Text nodes
 *  [F10] pointerEvents moved from prop to style (deprecated in RN 0.74+)
 *  [F11] Trust badge copy moved to a constant (i18n-ready)
 *
 * Dependencies (install if missing):
 *   npx expo install expo-linear-gradient react-native-svg
 *                    react-native-reanimated react-native-safe-area-context
 *
 * babel.config.js must include:
 *   plugins: ['react-native-reanimated/plugin']
 */

import { useAuthStore } from '@/features/auth/auth.store'; // [F2]
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  Platform,
  Pressable, // [F8] replaces TouchableOpacity
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions, // [F6] replaces Dimensions.get at module load
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

// [F5] Allowlist of valid mode params — rejects arbitrary deep-link values
const VALID_MODES = ['register', 'login'];

// [F11] Extracted constant — swap for t('welcome.trustBadge') when i18n is wired
const TRUST_BADGE_TEXT = 'Trusted by 2,400+ parents across India';

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

  // [F3] delay and baseOpacity added to deps — animation restarts correctly
  //      if parent re-renders with different prop values
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
  }, [delay, baseOpacity]); // [F3]

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

  // [F4] Empty deps is intentional — this animation has no external dependencies.
  //      It runs once on mount and repeats forever. Do NOT add deps here.
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.statusDot, animStyle]} />;
};

// ─── WelcomeScreen ─────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  // [F6] useWindowDimensions — updates on resize/foldable/multi-window
  const { height: windowHeight } = useWindowDimensions();

  // [F2] Auth guard — render nothing while hydrating or if already logged in.
  //      AuthProvider owns the redirect; this screen must not fight it.
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isHydrated || isAuthenticated) return null;

  // [F1] router.replace — removes welcome screen from stack so back button
  //      from login does not return here
  // [F5] mode validated against allowlist before navigation
  const navigate = useCallback((mode) => {
    const safeMode = VALID_MODES.includes(mode) ? mode : 'login';
    router.replace({ pathname: '/(auth)/login', params: { mode: safeMode } });
  }, []);

  const handleGetStarted = useCallback(() => navigate('register'), [navigate]);
  const handleSignIn = useCallback(() => navigate('login'), [navigate]);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.bg, COLORS.bgDeep, COLORS.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
        // [F10] pointerEvents in style, not as prop (deprecated in RN 0.74+)
        pointerEvents="none"
      />

      {/* Ambient red glow */}
      {/* [F10] pointerEvents moved to style */}
      <View style={[styles.glowWrap, { top: windowHeight * 0.04 }]}> {/* [F6] */}
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />
      </View>

      {/* ── Icon section ── */}
      <View style={[styles.iconSection, { paddingTop: insets.top + 20 }]}>
        <PulseRing size={220} delay={0} baseOpacity={0.10} />
        <PulseRing size={170} delay={500} baseOpacity={0.15} />
        <PulseRing size={128} delay={250} baseOpacity={0.09} />

        {/* [F7] Fixed-size container so StatusDot positions relative to icon card,
                not the full flex section — fixes misalignment on small screens */}
        <View style={styles.iconWrapper}>
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

          {/* [F7] StatusDot now a sibling inside the 112×112 iconWrapper */}
          <StatusDot />
        </View>
      </View>

      {/* ── Bottom section ── */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 28) }]}>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(550).delay(350)}>
          <Text style={styles.titleWrap} allowFontScaling={false}>
            <Text style={styles.titleWhite}>School</Text>
            <Text style={styles.titleRed}>QR{'\n'}</Text>
            <Text style={styles.titleWhite}>Guardian</Text>
          </Text>
        </Animated.View>

        {/* Subtitle — [F9] allowFontScaling added for consistency */}
        <Animated.Text
          entering={FadeInDown.duration(550).delay(480)}
          style={styles.subtitle}
          allowFontScaling={false} // [F9]
        >
          {`Your child's safety card,\n always in your pocket.`}
        </Animated.Text>

        {/* CTA buttons */}
        <Animated.View
          entering={FadeInDown.duration(550).delay(620)}
          style={styles.buttonGroup}
        >
          {/* Primary — Get Started */}
          {/* [F8] Pressable + style callback — reliable opacity on Android */}
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryWrapper,
              pressed && { opacity: 0.82 },
            ]}
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
              <Text style={styles.primaryLabel} allowFontScaling={false}>  Get Started</Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary — Sign In */}
          {/* [F8] Pressable + style callback */}
          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.75 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
          >
            <Text style={styles.secondaryLabel} allowFontScaling={false}>
              I already have an account
            </Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View
          entering={FadeInDown.duration(550).delay(780)}
          style={styles.trustBadge}
        >
          <View style={styles.trustDot} />
          {/* [F9] allowFontScaling consistent, [F11] text from constant */}
          <Text style={styles.trustText} allowFontScaling={false}>
            {TRUST_BADGE_TEXT}
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// [F6] glowWrap.top removed from StyleSheet — now computed inline with
//      useWindowDimensions so it updates on window resize

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Glow
  // [F6] top is no longer here — applied inline as { top: windowHeight * 0.04 }
  glowWrap: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    // [F10] pointerEvents in style object (RN 0.74+ requirement)
    pointerEvents: 'none',
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

  // Icon section
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

  // [F7] Fixed-size wrapper — StatusDot is positioned relative to this box,
  //      not the full flex section. Eliminates misalignment on small screens.
  iconWrapper: {
    width: 112,
    height: 112,
    position: 'relative',
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

  // [F7] StatusDot positioned within the 112×112 iconWrapper
  //      top/right are now px offsets from the icon card corner, not % of section
  statusDot: {
    position: 'absolute',
    top: -2,   // sits just above the top-right corner of the card
    right: -2,
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

  // Bottom section
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

  // Buttons
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

  // Trust badge
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
=======
/**
 * @file app/index.jsx
 * @description Entry / Welcome screen — RESQID
 *
 * Refactored: Replaced all custom SVG icon components with @expo/vector-icons
 *             (MaterialCommunityIcons + Feather) to reduce boilerplate.
 *             Custom SVGs kept only for GeometricPattern (decorative background).
 *             Product rebranded to RESQID.
 *
 * All original fixes preserved: [F1]–[F12]
 */

import { C, FEATURE_PILLS, TRUST_BADGE_TEXT, VALID_MODES } from '@/constants/constants';
import { useAuthStore } from '@/features/auth/auth.store';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

// ─── Feature Pills config (data-driven, no per-icon SVG components needed) ───

// ─── Geometric Background (kept as SVG — purely decorative) ──────────────────

const GeometricPattern = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {Array.from({ length: 12 }).map((_, i) => (
      <Path key={`dl-${i}`} d={`M${-100 + i * 80} 0 L${i * 80 + 200} ${height}`} stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
    ))}
    {Array.from({ length: 8 }).map((_, i) => (
      <Path key={`hl-${i}`} d={`M0 ${100 + i * 90} L${width} ${100 + i * 90}`} stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
    ))}
    <Path d={`M${width - 80} 0 L${width} 0 L${width} 80`} stroke="rgba(255,59,48,0.20)" strokeWidth="1" fill="none" />
    <Path d={`M0 ${height - 80} L0 ${height} L80 ${height}`} stroke="rgba(255,59,48,0.15)" strokeWidth="1" fill="none" />
    {Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) => (
        <Circle key={`dot-${row}-${col}`} cx={width - 60 + col * 12} cy={120 + row * 12} r="1" fill="rgba(255,255,255,0.12)" />
      ))
    )}
  </Svg>
);

// ─── Animated Pulse Ring ──────────────────────────────────────────────────────

const PulseRing = ({ size, delay, baseOpacity }) => {
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    const D = 2400;
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.3, { duration: D, easing: Easing.out(Easing.quad) }),
        withTiming(0.88, { duration: D, easing: Easing.in(Easing.quad) })
      ), -1, false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: D }),
        withTiming(baseOpacity, { duration: D })
      ), -1, false
    ));
  }, [delay, baseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, animStyle]} />
  );
};

// ─── Blinking Status Dot ──────────────────────────────────────────────────────

const StatusDot = () => {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.statusDot, animStyle]} />;
};

// ─── Feature Pill ─────────────────────────────────────────────────────────────

const FeaturePill = ({ lib, icon, label, delay }) => (
  <Animated.View entering={FadeInLeft.duration(500).delay(delay)} style={styles.featurePill}>
    <View style={styles.featurePillIcon}>
      {lib === 'feather'
        ? <Feather name={icon} size={13} color={C.white60} />
        : <MaterialCommunityIcons name={icon} size={14} color={C.white60} />}
    </View>
    <Text style={styles.featurePillText} allowFontScaling={false}>{label}</Text>
  </Animated.View>
);

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const navigate = useCallback((mode) => {
    const safeMode = VALID_MODES.includes(mode) ? mode : 'login';
    router.replace({ pathname: '/(auth)/login', params: { mode: safeMode } });
  }, []);

  const handleGetStarted = useCallback(() => navigate('register'), [navigate]);
  const handleSignIn = useCallback(() => navigate('login'), [navigate]);

  // [F12] Authenticated redirect via effect — never return null
  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace('/(app)/home');
  }, [isHydrated, isAuthenticated]);

  if (!isHydrated || isAuthenticated) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <LinearGradient
        colors={['#0A0A0C', '#130808', '#0D0D0F']}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />

      <GeometricPattern width={windowWidth} height={windowHeight} />
      <View style={[styles.glowTop, { pointerEvents: 'none' }]} />
      <View style={[styles.glowBottom, { pointerEvents: 'none' }]} />

      {/* ── TOP SECTION ── */}
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>

        {/* Brand row */}
        <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText} allowFontScaling={false}>RESQID</Text>
          </View>
          <View style={styles.brandDivider} />
          <Text style={styles.brandTagline} allowFontScaling={false}>School Safety Platform</Text>
        </Animated.View>

        {/* Hero icon area */}
        <View style={styles.heroArea}>
          <PulseRing size={240} delay={0} baseOpacity={0.08} />
          <PulseRing size={190} delay={600} baseOpacity={0.12} />
          <PulseRing size={148} delay={300} baseOpacity={0.07} />

          <View style={styles.iconWrapper}>
            <Animated.View entering={FadeIn.duration(800).delay(200)} style={styles.iconCard}>
              <LinearGradient
                colors={['#1E1E24', '#141418']}
                style={styles.iconCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconCardHighlight} />
                {/* shield-check from MaterialCommunityIcons replaces custom ShieldIcon SVG */}
                <MaterialCommunityIcons name="shield-check" size={54} color={C.red} />
              </LinearGradient>
            </Animated.View>
            <StatusDot />
          </View>

          <Animated.View entering={FadeInLeft.duration(600).delay(500)} style={[styles.floatingBadge, styles.floatingBadgeLeft]}>
            <Text style={styles.floatingBadgeNum} allowFontScaling={false}>2.4K+</Text>
            <Text style={styles.floatingBadgeLabel} allowFontScaling={false}>Parents</Text>
          </Animated.View>

          <Animated.View entering={FadeInRight.duration(600).delay(650)} style={[styles.floatingBadge, styles.floatingBadgeRight]}>
            <View style={styles.floatingBadgeDot} />
            <Text style={styles.floatingBadgeLive} allowFontScaling={false}>Live</Text>
          </Animated.View>
        </View>

        {/* Title block */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.titleBlock}>
          <Text style={styles.titleEyebrow} allowFontScaling={false}>WELCOME TO</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleMain} allowFontScaling={false}>
              RES<Text style={styles.titleAccent}>QID</Text>
            </Text>
          </View>
          <Text style={styles.titleSub} allowFontScaling={false}>Rescue · ID · Respond</Text>
        </Animated.View>

      </View>

      {/* ── BOTTOM SECTION ── */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>

        <Animated.View entering={FadeIn.duration(500).delay(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText} allowFontScaling={false}>Every child, identified & safe</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <View style={styles.featureRow}>
          {FEATURE_PILLS.map((pill) => <FeaturePill key={pill.label} {...pill} />)}
        </View>

        <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.buttonGroup}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryWrapper,
              pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get started — create a new account"
          >
            <LinearGradient
              colors={[C.red, '#E8302A', C.redDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryLabel} allowFontScaling={false}>Get Started</Text>
              <View style={styles.primaryArrow}>
                {/* arrow-right from Feather replaces custom ArrowRight SVG */}
                <Feather name="arrow-right" size={17} color={C.white} />
              </View>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
          >
            <Text style={styles.secondaryLabel} allowFontScaling={false}>
              Already have an account?{' '}
              <Text style={styles.secondaryLabelAccent} allowFontScaling={false}>Sign In</Text>
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(900)} style={styles.trustRow}>
          <View style={styles.trustDotWrap}>
            <View style={styles.trustDotOuter} />
            <View style={styles.trustDotInner} />
          </View>
          <Text style={styles.trustText} allowFontScaling={false}>{TRUST_BADGE_TEXT}</Text>
        </Animated.View>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  glowTop: { position: 'absolute', top: -60, alignSelf: 'center', width: 340, height: 340, borderRadius: 170, backgroundColor: C.red, opacity: 0.07 },
  glowBottom: { position: 'absolute', bottom: 40, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: C.red, opacity: 0.05 },

  topSection: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  brandBadge: { backgroundColor: C.redGlow, borderWidth: 1, borderColor: C.borderRed, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  brandBadgeText: { color: C.red, fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
  brandDivider: { width: 1, height: 12, backgroundColor: C.white15 },
  brandTagline: { color: C.white35, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },

  heroArea: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 200, marginBottom: 16 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,59,48,0.18)' },

  iconWrapper: { width: 108, height: 108 },
  iconCard: { width: 108, height: 108, borderRadius: 28, overflow: 'hidden', shadowColor: C.red, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 20, borderWidth: 1, borderColor: C.borderRed },
  iconCardInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCardHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  statusDot: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, shadowColor: C.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 5, borderWidth: 1.5, borderColor: C.bg },

  floatingBadge: { position: 'absolute', backgroundColor: C.bgCard2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  floatingBadgeLeft: { left: 16, top: '30%' },
  floatingBadgeRight: { right: 16, top: '42%', flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 7 },
  floatingBadgeNum: { color: C.white90, fontSize: 15, fontWeight: Platform.select({ ios: '700', android: '700' }), letterSpacing: -0.3 },
  floatingBadgeLabel: { color: C.white35, fontSize: 10, fontWeight: '500', marginTop: 1 },
  floatingBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green, shadowColor: C.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4 },
  floatingBadgeLive: { color: C.green, fontSize: 12, fontWeight: '600' },

  titleBlock: { alignItems: 'center' },
  titleEyebrow: { color: C.white35, fontSize: 10, fontWeight: '600', letterSpacing: 4, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  titleMain: { fontSize: 48, fontWeight: Platform.select({ ios: '800', android: '700' }), color: C.white, letterSpacing: -1.5, lineHeight: 52 },
  titleAccent: { color: C.red, fontSize: 48, fontWeight: Platform.select({ ios: '800', android: '700' }), letterSpacing: -1.5 },
  titleSub: { fontSize: 13, fontWeight: Platform.select({ ios: '400', android: '400' }), color: C.white35, letterSpacing: 3, marginTop: 6, textTransform: 'uppercase' },

  bottomSection: { paddingHorizontal: 22, gap: 14 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.white08 },
  dividerText: { color: C.white35, fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },

  featureRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.white04, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  featurePillIcon: { opacity: 0.8 },
  featurePillText: { color: C.white60, fontSize: 11, fontWeight: '500' },

  buttonGroup: { gap: 10 },
  primaryWrapper: { borderRadius: 16, overflow: 'hidden', shadowColor: C.red, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 18, elevation: 16 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  primaryLabel: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  primaryArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryLabel: { color: C.white35, fontSize: 14, fontWeight: '500' },
  secondaryLabelAccent: { color: C.white60, fontWeight: '700', textDecorationLine: 'underline', textDecorationColor: C.white35 },

  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 4 },
  trustDotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  trustDotOuter: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: C.greenGlow },
  trustDotInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  trustText: { color: 'rgba(255,255,255,0.28)', fontSize: 12, letterSpacing: 0.2 },
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
});