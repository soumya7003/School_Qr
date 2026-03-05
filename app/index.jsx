/**
 * @file app/index.jsx
 * @description Entry / Welcome screen — SchoolQR Guardian
 * REDESIGNED: Premium cinematic UI with geometric patterns, staggered reveals,
 *             diagonal layout, floating cards, and refined micro-interactions.
 *
 * All original fixes preserved:
 *  [F1]  router.replace — prevents back-nav from login to welcome
 *  [F2]  Auth/hydration guard
 *  [F3]  PulseRing useEffect deps
 *  [F4]  StatusDot intentional empty deps
 *  [F5]  mode param validated with allowlist
 *  [F6]  useWindowDimensions hook
 *  [F7]  StatusDot inside fixed container
 *  [F8]  Pressable with style callback
 *  [F9]  allowFontScaling={false} on all Text
 *  [F10] pointerEvents in style
 *  [F11] Trust badge copy as constant
 */

import { useAuthStore } from '@/features/auth/auth.store';
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
import { Circle, Defs, Path, Rect, Stop, Svg, LinearGradient as SvgGradient } from 'react-native-svg';

// ─── Design Tokens ──────────────────────────────────────────────────────────────

const C = {
  bg: '#0D0D0F',
  bgDeep: '#120909',
  bgCard: '#161618',
  bgCard2: '#1A1A1D',
  red: '#FF3B30',
  redDark: '#C8211A',
  redGlow: 'rgba(255,59,48,0.18)',
  redGlowSoft: 'rgba(255,59,48,0.08)',
  white: '#FFFFFF',
  white90: 'rgba(255,255,255,0.90)',
  white60: 'rgba(255,255,255,0.60)',
  white35: 'rgba(255,255,255,0.35)',
  white15: 'rgba(255,255,255,0.15)',
  white08: 'rgba(255,255,255,0.08)',
  white04: 'rgba(255,255,255,0.04)',
  green: '#2ECC71',
  greenGlow: 'rgba(46,204,113,0.5)',
  border: 'rgba(255,255,255,0.07)',
  borderRed: 'rgba(255,59,48,0.25)',
};

const VALID_MODES = ['register', 'login'];
const TRUST_BADGE_TEXT = 'Trusted by 2,400+ parents across India';

// ─── SVG Components ────────────────────────────────────────────────────────────

const ShieldIcon = ({ size = 52 }) => (
  <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
    <Defs>
      <SvgGradient id="sg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FF3B30" />
        <Stop offset="1" stopColor="#C8211A" />
      </SvgGradient>
    </Defs>
    <Path
      d="M26 3L7 11v14.5c0 11.8 8.5 22.8 19.5 25.7C37.5 48.3 45 37.3 45 25.5V11L26 3z"
      stroke="url(#sg)"
      strokeWidth="1.8"
      strokeLinejoin="round"
      fill="rgba(255,59,48,0.06)"
    />
    <Path
      d="M17 26l7 7 12-12"
      stroke={C.red}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={C.white60} strokeWidth="1.5" />
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={C.white60} strokeWidth="1.5" />
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={C.white60} strokeWidth="1.5" />
    <Rect x="5" y="5" width="3" height="3" rx="0.5" fill={C.white60} />
    <Rect x="16" y="5" width="3" height="3" rx="0.5" fill={C.white60} />
    <Rect x="5" y="16" width="3" height="3" rx="0.5" fill={C.white60} />
    <Path d="M14 14h2v2h-2zM18 14h3M18 18h3M14 18v3M14 21h3" stroke={C.white60} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const LockIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={C.white60} strokeWidth="1.5" />
    <Path d="M8 11V7a4 4 0 018 0v4" stroke={C.white60} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="12" cy="16" r="1.5" fill={C.white60} />
  </Svg>
);

const ArrowRight = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M13 6l6 6-6 6" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 13 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12l5 5 9-9" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Geometric Background Pattern ─────────────────────────────────────────────

const GeometricPattern = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {/* Large diagonal line grid */}
    {Array.from({ length: 12 }).map((_, i) => (
      <Path
        key={`dl-${i}`}
        d={`M${-100 + i * 80} 0 L${i * 80 + 200} ${height}`}
        stroke="rgba(255,255,255,0.018)"
        strokeWidth="1"
      />
    ))}
    {/* Horizontal thin lines */}
    {Array.from({ length: 8 }).map((_, i) => (
      <Path
        key={`hl-${i}`}
        d={`M0 ${100 + i * 90} L${width} ${100 + i * 90}`}
        stroke="rgba(255,255,255,0.015)"
        strokeWidth="1"
      />
    ))}
    {/* Corner accent — top right */}
    <Path
      d={`M${width - 80} 0 L${width} 0 L${width} 80`}
      stroke="rgba(255,59,48,0.20)"
      strokeWidth="1"
      fill="none"
    />
    {/* Corner accent — bottom left */}
    <Path
      d={`M0 ${height - 80} L0 ${height} L80 ${height}`}
      stroke="rgba(255,59,48,0.15)"
      strokeWidth="1"
      fill="none"
    />
    {/* Dot grid cluster — top right area */}
    {Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) => (
        <Circle
          key={`dot-${row}-${col}`}
          cx={width - 60 + col * 12}
          cy={120 + row * 12}
          r="1"
          fill="rgba(255,255,255,0.12)"
        />
      ))
    )}
  </Svg>
);

// ─── Animated Pulse Rings ──────────────────────────────────────────────────────

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
    <Animated.View style={[
      styles.ring,
      { width: size, height: size, borderRadius: size / 2 },
      animStyle,
    ]} />
  );
};

// ─── Blinking Status Dot ───────────────────────────────────────────────────────

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

// ─── Feature Pill ──────────────────────────────────────────────────────────────

const FeaturePill = ({ icon, label, delay }) => (
  <Animated.View entering={FadeInLeft.duration(500).delay(delay)} style={styles.featurePill}>
    <View style={styles.featurePillIcon}>{icon}</View>
    <Text style={styles.featurePillText} allowFontScaling={false}>{label}</Text>
  </Animated.View>
);

// ─── Stats Card ────────────────────────────────────────────────────────────────

const StatCard = ({ value, label, delay }) => (
  <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={styles.statCard}>
    <Text style={styles.statValue} allowFontScaling={false}>{value}</Text>
    <Text style={styles.statLabel} allowFontScaling={false}>{label}</Text>
  </Animated.View>
);

// ─── WelcomeScreen ─────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isHydrated || isAuthenticated) return null;

  const navigate = useCallback((mode) => {
    const safeMode = VALID_MODES.includes(mode) ? mode : 'login';
    router.replace({ pathname: '/(auth)/login', params: { mode: safeMode } });
  }, []);

  const handleGetStarted = useCallback(() => navigate('register'), [navigate]);
  const handleSignIn = useCallback(() => navigate('login'), [navigate]);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Deep background gradient */}
      <LinearGradient
        colors={['#0A0A0C', '#130808', '#0D0D0F']}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />

      {/* Geometric grid pattern */}
      <GeometricPattern width={windowWidth} height={windowHeight} />

      {/* Large ambient glow — top center */}
      <View style={[styles.glowTop, { pointerEvents: 'none' }]} />

      {/* Secondary glow — bottom left */}
      <View style={[styles.glowBottom, { pointerEvents: 'none' }]} />

      {/* ── TOP SECTION: Brand + Shield ── */}
      <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>

        {/* Brand row */}
        <Animated.View entering={FadeIn.duration(600).delay(100)} style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText} allowFontScaling={false}>GUARDIAN</Text>
          </View>
          <View style={styles.brandDivider} />
          <Text style={styles.brandTagline} allowFontScaling={false}>School Safety Platform</Text>
        </Animated.View>

        {/* Central hero card */}
        <View style={styles.heroArea}>
          {/* Pulse rings behind card */}
          <PulseRing size={240} delay={0} baseOpacity={0.08} />
          <PulseRing size={190} delay={600} baseOpacity={0.12} />
          <PulseRing size={148} delay={300} baseOpacity={0.07} />

          {/* Main icon card */}
          <View style={styles.iconWrapper}>
            <Animated.View entering={FadeIn.duration(800).delay(200)} style={styles.iconCard}>
              <LinearGradient
                colors={['#1E1E24', '#141418']}
                style={styles.iconCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Subtle inner border highlight */}
                <View style={styles.iconCardHighlight} />
                <ShieldIcon size={54} />
              </LinearGradient>
            </Animated.View>
            <StatusDot />
          </View>

          {/* Floating stats — left and right of icon */}
          <Animated.View
            entering={FadeInLeft.duration(600).delay(500)}
            style={[styles.floatingBadge, styles.floatingBadgeLeft]}
          >
            <Text style={styles.floatingBadgeNum} allowFontScaling={false}>{'2.4K+'}</Text>
            <Text style={styles.floatingBadgeLabel} allowFontScaling={false}>{'Parents'}</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInRight.duration(600).delay(650)}
            style={[styles.floatingBadge, styles.floatingBadgeRight]}
          >
            <View style={styles.floatingBadgeDot} />
            <Text style={styles.floatingBadgeLive} allowFontScaling={false}>{'Live'}</Text>
          </Animated.View>
        </View>

        {/* Title block */}
        <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.titleBlock}>
          <Text style={styles.titleEyebrow} allowFontScaling={false}>{'WELCOME TO'}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleMain} allowFontScaling={false}>
              {'School'}
              <Text style={styles.titleAccent}>{'QR'}</Text>
            </Text>
          </View>
          <Text style={styles.titleSub} allowFontScaling={false}>{'Guardian'}</Text>
        </Animated.View>

      </View>

      {/* ── BOTTOM SECTION ── */}
      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>

        {/* Divider line with label */}
        <Animated.View entering={FadeIn.duration(500).delay(500)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText} allowFontScaling={false}>{'Your child, always safe'}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.featureRow}>
          <FeaturePill icon={<QrIcon size={14} />} label="Instant QR Scan" delay={550} />
          <FeaturePill icon={<LockIcon size={14} />} label="Secure & Private" delay={650} />
          <FeaturePill icon={<CheckIcon size={13} />} label="Real-time Alerts" delay={750} />
        </View>

        {/* CTA Buttons */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(700)}
          style={styles.buttonGroup}
        >
          {/* Primary CTA */}
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
              <Text style={styles.primaryLabel} allowFontScaling={false}>
                {'Get Started'}
              </Text>
              <View style={styles.primaryArrow}>
                <ArrowRight size={17} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
          >
            <Text style={styles.secondaryLabel} allowFontScaling={false}>
              {'Already have an account? '}
              <Text style={styles.secondaryLabelAccent} allowFontScaling={false}>
                {'Sign In'}
              </Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(900)}
          style={styles.trustRow}
        >
          <View style={styles.trustDotWrap}>
            <View style={styles.trustDotOuter} />
            <View style={styles.trustDotInner} />
          </View>
          <Text style={styles.trustText} allowFontScaling={false}>
            {TRUST_BADGE_TEXT}
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
    backgroundColor: C.bg,
  },

  // Glows
  glowTop: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: C.red,
    opacity: 0.07,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.red,
    opacity: 0.05,
  },

  // Top section
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  brandBadge: {
    backgroundColor: C.redGlow,
    borderWidth: 1,
    borderColor: C.borderRed,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  brandBadgeText: {
    color: C.red,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  brandDivider: {
    width: 1,
    height: 12,
    backgroundColor: C.white15,
  },
  brandTagline: {
    color: C.white35,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Hero area
  heroArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.18)',
  },

  // Icon card
  iconWrapper: {
    width: 108,
    height: 108,
  },
  iconCard: {
    width: 108,
    height: 108,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: C.borderRed,
  },
  iconCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statusDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: C.bg,
  },

  // Floating badges
  floatingBadge: {
    position: 'absolute',
    backgroundColor: C.bgCard2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  floatingBadgeLeft: {
    left: 16,
    top: '30%',
  },
  floatingBadgeRight: {
    right: 16,
    top: '42%',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingVertical: 7,
  },
  floatingBadgeNum: {
    color: C.white90,
    fontSize: 15,
    fontWeight: Platform.select({ ios: '700', android: '700' }),
    letterSpacing: -0.3,
  },
  floatingBadgeLabel: {
    color: C.white35,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  floatingBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  floatingBadgeLive: {
    color: C.green,
    fontSize: 12,
    fontWeight: '600',
  },

  // Title block
  titleBlock: {
    alignItems: 'center',
  },
  titleEyebrow: {
    color: C.white35,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titleMain: {
    fontSize: 48,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: C.white,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  titleAccent: {
    color: C.red,
    fontSize: 48,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    letterSpacing: -1.5,
  },
  titleSub: {
    fontSize: 28,
    fontWeight: Platform.select({ ios: '300', android: '300' }),
    color: C.white60,
    letterSpacing: 6,
    marginTop: -2,
    textTransform: 'uppercase',
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 22,
    gap: 14,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.white08,
  },
  dividerText: {
    color: C.white35,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Feature pills
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.white04,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featurePillIcon: {
    opacity: 0.8,
  },
  featurePillText: {
    color: C.white60,
    fontSize: 11,
    fontWeight: '500',
  },

  // Buttons
  buttonGroup: {
    gap: 10,
  },
  primaryWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryLabel: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: C.white35,
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryLabelAccent: {
    color: C.white60,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: C.white35,
  },

  // Trust badge
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  trustDotWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustDotOuter: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.greenGlow,
  },
  trustDotInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  trustText: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});