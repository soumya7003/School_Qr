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
});