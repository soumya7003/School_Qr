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

import {
  C,
  FEATURE_PILLS,
  TRUST_BADGE_TEXT,
  VALID_MODES,
} from "@/constants/constants";
import { useAuthStore } from "@/features/auth/auth.store";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Circle, Path, Svg } from "react-native-svg";

// ─── Responsive scale helpers ─────────────────────────────────────────────────
const BASE_W = 390;
const BASE_H = 844;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ─── Geometric Background (kept as SVG — purely decorative) ──────────────────

const GeometricPattern = ({ width, height }) => {
  const cx = width / 2;
  const cy = height * 0.36;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {/* Diagonal grid lines */}
      {Array.from({ length: 16 }).map((_, i) => (
        <Path
          key={`dl-${i}`}
          d={`M${-120 + i * 70} 0 L${i * 70 + 160} ${height}`}
          stroke="rgba(255,255,255,0.013)"
          strokeWidth="1"
        />
      ))}
      {/* Horizontal scan lines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Path
          key={`hl-${i}`}
          d={`M0 ${80 + i * 80} L${width} ${80 + i * 80}`}
          stroke="rgba(255,255,255,0.012)"
          strokeWidth="1"
        />
      ))}

      {/* Corner bracket — top-right */}
      <Path
        d={`M${width - 32} 20 L${width - 20} 20 L${width - 20} 32`}
        stroke="rgba(255,59,48,0.35)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Corner bracket — bottom-left */}
      <Path
        d={`M20 ${height - 32} L20 ${height - 20} L32 ${height - 20}`}
        stroke="rgba(255,59,48,0.25)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Corner bracket — top-left */}
      <Path
        d={`M32 20 L20 20 L20 32`}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        fill="none"
      />
      {/* Corner bracket — bottom-right */}
      <Path
        d={`M${width - 32} ${height - 20} L${width - 20} ${height - 20} L${width - 20} ${height - 32}`}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        fill="none"
      />

      {/* Crosshair circle around hero center */}
      <Circle
        cx={cx}
        cy={cy}
        r={118}
        stroke="rgba(255,59,48,0.055)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 7"
      />
      <Circle
        cx={cx}
        cy={cy}
        r={88}
        stroke="rgba(255,255,255,0.025)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="2 12"
      />

      {/* Cross-hair tick marks */}
      <Path d={`M${cx - 128} ${cy} L${cx - 112} ${cy}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
      <Path d={`M${cx + 112} ${cy} L${cx + 128} ${cy}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
      <Path d={`M${cx} ${cy - 128} L${cx} ${cy - 112}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />
      <Path d={`M${cx} ${cy + 112} L${cx} ${cy + 128}`} stroke="rgba(255,59,48,0.22)" strokeWidth="1" />

      {/* Dot matrix — top-right cluster */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <Circle
            key={`dot-${row}-${col}`}
            cx={width - 52 + col * 10}
            cy={96 + row * 10}
            r="1"
            fill="rgba(255,255,255,0.10)"
          />
        ))
      )}

      {/* Dot matrix — bottom-left cluster */}
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <Circle
            key={`dot2-${row}-${col}`}
            cx={32 + col * 10}
            cy={height - 80 + row * 10}
            r="0.8"
            fill="rgba(255,255,255,0.07)"
          />
        ))
      )}

      {/* Horizontal rule with ticks — below hero */}
      <Path
        d={`M${cx - 60} ${cy + 140} L${cx + 60} ${cy + 140}`}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
      />
      <Path d={`M${cx - 60} ${cy + 136} L${cx - 60} ${cy + 144}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <Path d={`M${cx + 60} ${cy + 136} L${cx + 60} ${cy + 144}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <Path d={`M${cx} ${cy + 136} L${cx} ${cy + 144}`} stroke="rgba(255,59,48,0.25)" strokeWidth="1" />

      {/* Vertical side accent lines */}
      <Path
        d={`M8 ${height * 0.28} L8 ${height * 0.58}`}
        stroke="rgba(255,59,48,0.12)"
        strokeWidth="1"
      />
      <Path
        d={`M${width - 8} ${height * 0.32} L${width - 8} ${height * 0.62}`}
        stroke="rgba(255,59,48,0.09)"
        strokeWidth="1"
      />
    </Svg>
  );
};

// ─── Animated Pulse Ring ──────────────────────────────────────────────────────

const PulseRing = ({ size, delay, baseOpacity }) => {
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(baseOpacity);
  const border = useSharedValue(1);

  useEffect(() => {
    const D = 2600;
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.32, { duration: D, easing: Easing.out(Easing.cubic) }),
        withTiming(0.88, { duration: D, easing: Easing.in(Easing.cubic) }),
      ), -1, false,
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: D, easing: Easing.out(Easing.exp) }),
        withTiming(baseOpacity, { duration: D, easing: Easing.in(Easing.exp) }),
      ), -1, false,
    ));
    border.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.4, { duration: D }),
        withTiming(1.8, { duration: D }),
      ), -1, false,
    ));
  }, [delay, baseOpacity]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderWidth: border.value,
  }));

  return (
    <Animated.View
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, animStyle]}
    />
  );
};

// ─── Corner Bracket Overlay (engineering frame around icon) ──────────────────

const CornerBrackets = ({ size, color = "rgba(255,59,48,0.55)", thickness = 1.5, arm = 14 }) => (
  <Svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {/* Top-left */}
    <Path d={`M${arm} 0 L0 0 L0 ${arm}`} stroke={color} strokeWidth={thickness} fill="none" />
    {/* Top-right */}
    <Path d={`M${size - arm} 0 L${size} 0 L${size} ${arm}`} stroke={color} strokeWidth={thickness} fill="none" />
    {/* Bottom-left */}
    <Path d={`M0 ${size - arm} L0 ${size} L${arm} ${size}`} stroke={color} strokeWidth={thickness} fill="none" />
    {/* Bottom-right */}
    <Path d={`M${size} ${size - arm} L${size} ${size} L${size - arm} ${size}`} stroke={color} strokeWidth={thickness} fill="none" />
  </Svg>
);

// ─── Blinking Status Dot ──────────────────────────────────────────────────────

const StatusDot = () => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    // Heartbeat double-pump then rest
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 160, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) }),
        withTiming(1.22, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 110, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 1400 }),
      ), -1, false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.statusDot, animStyle]} />;
};

// ─── Feature Pill ─────────────────────────────────────────────────────────────

const FeaturePill = ({ lib, icon, label, delay }) => (
  <Animated.View
    entering={FadeInLeft.duration(500).delay(delay)}
    style={styles.featurePill}
  >
    <View style={styles.featurePillIcon}>
      {lib === "feather" ? (
        <Feather name={icon} size={12} color={C.white60} />
      ) : (
        <MaterialCommunityIcons name={icon} size={13} color={C.white60} />
      )}
    </View>
    <Text style={styles.featurePillText} allowFontScaling={false}>
      {label}
    </Text>
  </Animated.View>
);

// ─── Floating Icon Wrapper (bob + micro-tilt) ─────────────────────────────────

const FloatingIcon = ({ children }) => {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
};

// ─── Scan-Line Sweep ──────────────────────────────────────────────────────────

const ScanLine = ({ iconHalfHeight = 54 }) => {
  const half = iconHalfHeight;
  const translateY = useSharedValue(-half);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const loop = () => {
      translateY.value = -half;
      opacity.value = withTiming(0.6, { duration: 180 });
      translateY.value = withTiming(half, { duration: 820, easing: Easing.linear }, (done) => {
        if (done) opacity.value = withTiming(0, { duration: 180 });
      });
    };
    const id = setTimeout(() => {
      loop();
      setInterval(loop, 3400);
    }, 1600);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.scanLine, animStyle]} />
  );
};

// ─── Ambient Breath Glow ─────────────────────────────────────────────────────

const BreathGlow = () => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.14);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.85, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.32, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.10, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ), -1, false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.breathGlow, animStyle]} pointerEvents="none" />;
};

// ─── Orbiting Particle ────────────────────────────────────────────────────────

const OrbitParticle = ({ radius, duration, delay, startAngle }) => {
  const angle = useSharedValue(startAngle);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    angle.value = withDelay(delay, withRepeat(
      withTiming(startAngle + 360, { duration, easing: Easing.linear }),
      -1, false,
    ));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => {
    const rad = (angle.value * Math.PI) / 180;
    return {
      transform: [
        { translateX: radius * Math.cos(rad) },
        { translateY: radius * Math.sin(rad) },
      ],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={[styles.orbitDot, animStyle]} />;
};

// ─── Data Readout (scanning status text) ─────────────────────────────────────

const DataReadout = () => {
  const opacity = useSharedValue(0);
  const LABELS = ["SCANNING...", "ID VERIFIED", "SHIELD ACTIVE", "SYSTEM OK"];
  const idxRef = { current: 0 };

  // Simple opacity blink cycling through labels isn't possible without state,
  // so we use a perpetual fade-in/out for a single "SYSTEM ACTIVE" indicator.
  useEffect(() => {
    opacity.value = withDelay(1000, withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 1800 }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 300 }),
      ), -1, false,
    ));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.dataReadout, animStyle]} pointerEvents="none">
      <View style={styles.dataReadoutDot} />
      <Text style={styles.dataReadoutText} allowFontScaling={false}>
        SYSTEM ACTIVE
      </Text>
    </Animated.View>
  );
};

// ─── Shimmer Overlay (CTA button) ────────────────────────────────────────────

const ShimmerOverlay = () => {
  const translateX = useSharedValue(-220);
  const translateX2 = useSharedValue(-320);

  useEffect(() => {
    const run1 = () => {
      translateX.value = -220;
      translateX.value = withTiming(420, { duration: 860, easing: Easing.out(Easing.quad) });
    };
    const run2 = () => {
      translateX2.value = -320;
      translateX2.value = withTiming(420, { duration: 1100, easing: Easing.out(Easing.cubic) });
    };
    const id = setTimeout(() => {
      run1();
      setTimeout(run2, 220);
      setInterval(() => {
        run1();
        setTimeout(run2, 220);
      }, 4200);
    }, 1200);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const s1 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: "18deg" }],
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX2.value }, { rotate: "18deg" }],
  }));

  return (
    <>
      <Animated.View style={[styles.shimmer, s1]} pointerEvents="none" />
      <Animated.View style={[styles.shimmerThin, s2]} pointerEvents="none" />
    </>
  );
};

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Responsive ratios
  const r = clamp(windowWidth / BASE_W, 0.75, 1.25);
  const rv = clamp(windowHeight / BASE_H, 0.80, 1.20);
  const s = (px) => Math.round(px * r);
  const sv = (px) => Math.round(px * rv);

  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const navigate = useCallback((mode) => {
    const safeMode = VALID_MODES.includes(mode) ? mode : "login";
    router.replace({ pathname: "/(auth)/login", params: { mode: safeMode } });
  }, []);

  const handleGetStarted = useCallback(() => navigate("register"), [navigate]);
  const handleSignIn = useCallback(() => navigate("login"), [navigate]);

  // [F12] Authenticated redirect via effect — never return null
  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace("/(app)/home");
  }, [isHydrated, isAuthenticated]);

  if (!isHydrated || isAuthenticated) return <View style={styles.root} />;

  const iconSize = s(112);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Deep layered background */}
      <LinearGradient
        colors={["#08080A", "#110707", "#0C0C0E", "#080808"]}
        locations={[0, 0.3, 0.7, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}
      />

      <GeometricPattern width={windowWidth} height={windowHeight} />

      {/* Ambient glow blobs */}
      <View style={[styles.glowTop, { pointerEvents: "none" }]} />
      <View style={[styles.glowBottom, { pointerEvents: "none" }]} />
      <View style={[styles.glowRight, { pointerEvents: "none" }]} />

      {/* ── TOP SECTION ── */}
      <View style={[styles.topSection, { paddingTop: insets.top + sv(14) }]}>

        {/* Brand row */}
        <Animated.View entering={FadeIn.duration(700).delay(100)} style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <View style={styles.brandBadgeDot} />
            <Text style={styles.brandBadgeText} allowFontScaling={false}>
              RESQID
            </Text>
          </View>
          <View style={styles.brandDivider} />
          <Text style={styles.brandTagline} allowFontScaling={false}>
            School Safety Platform
          </Text>
          {/* Version tag */}
          <View style={styles.versionTag}>
            <Text style={styles.versionText} allowFontScaling={false}>v2.4</Text>
          </View>
        </Animated.View>

        {/* Hero icon area — height must accommodate outermost ring (252px + margin) */}
        <View style={[styles.heroArea, { height: sv(272) }]}>
          <PulseRing size={s(252)} delay={0} baseOpacity={0.09} />
          <PulseRing size={s(196)} delay={700} baseOpacity={0.13} />
          <PulseRing size={s(150)} delay={350} baseOpacity={0.08} />
          <BreathGlow />

          {/* Orbiting particles — anchor must have explicit size = 2×orbit radius */}
          <View style={[styles.orbitAnchor, { width: s(144), height: s(144) }]}>
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={0} />
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={120} />
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={240} />
          </View>

          <FloatingIcon>
            <View style={[styles.iconWrapper, { width: iconSize, height: iconSize }]}>
              {/* Outer glow ring — square to match card shape */}
              <View style={[styles.iconGlowRing, {
                width: iconSize + s(18),
                height: iconSize + s(18),
                borderRadius: s(34),
                top: -s(9),
                left: -s(9),
              }]} />

              <Animated.View
                entering={FadeIn.duration(900).delay(200)}
                style={[styles.iconCard, { width: iconSize, height: iconSize, borderRadius: s(30) }]}
              >
                <LinearGradient
                  colors={["#1C1C22", "#131318", "#0E0E12"]}
                  locations={[0, 0.5, 1]}
                  style={styles.iconCardInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.iconCardHighlight} />
                  <View style={styles.iconCardBottomSheen} />
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={s(56)}
                    color={C.red}
                  />
                  <ScanLine iconHalfHeight={s(56)} />
                </LinearGradient>
              </Animated.View>

              {/* Engineering corner brackets */}
              <CornerBrackets size={iconSize} color="rgba(255,59,48,0.5)" thickness={1.5} arm={s(16)} />

              <StatusDot />
            </View>
          </FloatingIcon>

          {/* Floating badge — left (Parents count) */}
          <Animated.View
            entering={FadeInLeft.duration(650).delay(550)}
            style={[styles.floatingBadge, styles.floatingBadgeLeft]}
          >
            <Text style={styles.floatingBadgeNum} allowFontScaling={false}>
              2.4K+
            </Text>
            <Text style={styles.floatingBadgeLabel} allowFontScaling={false}>
              Protected
            </Text>
            <View style={styles.floatingBadgeBar} />
          </Animated.View>

          {/* Floating badge — right (Live indicator) */}
          <Animated.View
            entering={FadeInRight.duration(650).delay(700)}
            style={[styles.floatingBadge, styles.floatingBadgeRight]}
          >
            <View style={styles.floatingBadgeLiveWrap}>
              <View style={styles.floatingBadgeDot} />
              <Text style={styles.floatingBadgeLive} allowFontScaling={false}>
                LIVE
              </Text>
            </View>
            <Text style={styles.floatingBadgeSubtext} allowFontScaling={false}>
              Monitoring
            </Text>
          </Animated.View>

          {/* Data readout below icon */}
          <DataReadout />
        </View>

        {/* Title block */}
        <Animated.View entering={FadeInDown.duration(650).delay(380)} style={styles.titleBlock}>
          <Text style={styles.titleEyebrow} allowFontScaling={false}>
            WELCOME TO
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.titleMain, { fontSize: s(50), lineHeight: s(54) }]} allowFontScaling={false}>
              RES<Text style={[styles.titleAccent, { fontSize: s(50) }]}>QID</Text>
            </Text>
          </View>
          <View style={styles.titleSubRow}>
            <View style={styles.titleSubDash} />
            <Text style={styles.titleSub} allowFontScaling={false}>
              Rescue · ID · Respond
            </Text>
            <View style={styles.titleSubDash} />
          </View>
        </Animated.View>

      </View>

      {/* ── BOTTOM SECTION ── */}
      <View
        style={[
          styles.bottomSection,
          { paddingBottom: Math.max(insets.bottom, sv(24)) },
        ]}
      >
        {/* Divider */}
        <Animated.View entering={FadeIn.duration(500).delay(520)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText} allowFontScaling={false}>
            Every child, identified & safe
          </Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Feature pills */}
        <View style={styles.featureRow}>
          {FEATURE_PILLS.map((pill) => (
            <FeaturePill key={pill.label} {...pill} />
          ))}
        </View>

        {/* CTA buttons */}
        <Animated.View entering={FadeInDown.duration(650).delay(720)} style={styles.buttonGroup}>

          {/* Primary CTA */}
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryWrapper,
              pressed && { opacity: 0.88, transform: [{ scale: 0.982 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get started — create a new account"
          >
            <LinearGradient
              colors={[C.red, "#DC2B25", C.redDark]}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ShimmerOverlay />
              <Text style={styles.primaryLabel} allowFontScaling={false}>
                Get Started
              </Text>
              <View style={styles.primaryArrow}>
                <Feather name="arrow-right" size={s(16)} color={C.white} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.65 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to an existing account"
          >
            <Text style={styles.secondaryLabel} allowFontScaling={false}>
              Already have an account?{" "}
              <Text style={styles.secondaryLabelAccent} allowFontScaling={false}>
                Sign In
              </Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* Trust badge */}
        <Animated.View entering={FadeInDown.duration(500).delay(920)} style={styles.trustRow}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Background glows ──────────────────────────────────────────────────────
  glowTop: {
    position: "absolute", top: -80, alignSelf: "center",
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: C.red, opacity: 0.065,
  },
  glowBottom: {
    position: "absolute", bottom: 20, left: -90,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: C.red, opacity: 0.04,
  },
  glowRight: {
    position: "absolute", top: "35%", right: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.red, opacity: 0.035,
  },

  // ── Top section — flex:1 distributes space, justifyContent keeps items together ──
  topSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 4,
  },

  // ── Brand row ────────────────────────────────────────────────────────────
  brandRow: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 4,
  },
  brandBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.redGlow,
    borderWidth: 1, borderColor: C.borderRed,
    borderRadius: 5,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  brandBadgeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.red,
  },
  brandBadgeText: {
    color: C.red, fontSize: 9,
    fontWeight: "800", letterSpacing: 2.8,
  },
  brandDivider: { width: 1, height: 11, backgroundColor: C.white15 },
  brandTagline: {
    color: C.white35, fontSize: 11,
    fontWeight: "500", letterSpacing: 0.4,
  },
  versionTag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginLeft: 2,
  },
  versionText: {
    color: "rgba(255,255,255,0.22)", fontSize: 8,
    fontWeight: "600", letterSpacing: 1,
  },

  // ── Hero area ─────────────────────────────────────────────────────────────
  heroArea: {
    alignItems: "center", justifyContent: "center",
    width: "100%", marginBottom: 4,
  },
  ring: {
    position: "absolute",
    borderColor: "rgba(255,59,48,0.16)",
  },

  // ── Icon card ─────────────────────────────────────────────────────────────
  iconWrapper: { position: "relative" },
  iconGlowRing: {
    position: "absolute",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.12)",
  },
  iconCard: {
    overflow: "hidden",
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.50,
    shadowRadius: 28,
    elevation: 24,
    borderWidth: 1,
    borderColor: C.borderRed,
  },
  iconCardInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconCardHighlight: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  iconCardBottomSheen: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
    backgroundColor: "rgba(255,59,48,0.04)",
  },

  // ── Status dot ────────────────────────────────────────────────────────────
  statusDot: {
    position: "absolute", top: -4, right: -4,
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 7,
    elevation: 6,
    borderWidth: 2, borderColor: C.bg,
  },

  // ── Orbit anchor — absolute, centered in heroArea ────────────────────────
  orbitAnchor: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitDot: {
    position: "absolute",
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,59,48,0.55)",
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 4,
  },

  // ── Floating badges ───────────────────────────────────────────────────────
  floatingBadge: {
    position: "absolute",
    backgroundColor: "rgba(18,14,14,0.82)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 10,
    paddingHorizontal: 11, paddingVertical: 9,
    alignItems: "center",
    // Glass blur effect via shadow layering
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12,
  },
  floatingBadgeLeft: { left: 10, top: "32%" },
  floatingBadgeRight: { right: 10, top: "46%" },
  floatingBadgeNum: {
    color: C.white90, fontSize: 16,
    fontWeight: Platform.select({ ios: "800", android: "700" }),
    letterSpacing: -0.4,
  },
  floatingBadgeLabel: {
    color: C.white35, fontSize: 9,
    fontWeight: "600", marginTop: 2,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  floatingBadgeBar: {
    width: 20, height: 2, borderRadius: 1,
    backgroundColor: C.red, marginTop: 6, opacity: 0.7,
  },
  floatingBadgeLiveWrap: {
    flexDirection: "row", alignItems: "center", gap: 5,
  },
  floatingBadgeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 4,
  },
  floatingBadgeLive: {
    color: C.green, fontSize: 11,
    fontWeight: "700", letterSpacing: 1.5,
  },
  floatingBadgeSubtext: {
    color: "rgba(255,255,255,0.28)", fontSize: 8,
    fontWeight: "500", marginTop: 3,
    letterSpacing: 0.5, textTransform: "uppercase",
  },

  // ── Data readout ──────────────────────────────────────────────────────────
  dataReadout: {
    position: "absolute", bottom: 2,
    flexDirection: "row", alignItems: "center", gap: 5,
  },
  dataReadoutDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 3,
  },
  dataReadoutText: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 8, fontWeight: "700",
    letterSpacing: 2.2,
  },

  // ── Title block ───────────────────────────────────────────────────────────
  titleBlock: { alignItems: "center" },
  titleEyebrow: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 9, fontWeight: "700",
    letterSpacing: 5, marginBottom: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "baseline" },
  titleMain: {
    fontWeight: Platform.select({ ios: "800", android: "700" }),
    color: C.white, letterSpacing: -1.8,
  },
  titleAccent: {
    color: C.red,
    fontWeight: Platform.select({ ios: "800", android: "700" }),
    letterSpacing: -1.8,
  },
  titleSubRow: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginTop: 6,
  },
  titleSubDash: {
    width: 18, height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  titleSub: {
    fontSize: 11,
    fontWeight: Platform.select({ ios: "500", android: "500" }),
    color: "rgba(255,255,255,0.30)",
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },

  // ── Bottom section ────────────────────────────────────────────────────────
  bottomSection: { paddingHorizontal: 20, gap: 12 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  dividerText: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 10, fontWeight: "600",
    letterSpacing: 0.4,
  },

  // ── Feature pills ─────────────────────────────────────────────────────────
  featureRow: {
    flexDirection: "row", gap: 7,
    justifyContent: "center", flexWrap: "wrap",
  },
  featurePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  featurePillIcon: { opacity: 0.75 },
  featurePillText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 10, fontWeight: "500",
  },

  // ── CTA buttons ───────────────────────────────────────────────────────────
  buttonGroup: { gap: 8 },
  primaryWrapper: {
    borderRadius: 14, overflow: "hidden",
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.60, shadowRadius: 20,
    elevation: 18,
  },
  primaryButton: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14, gap: 8,
  },
  primaryLabel: {
    color: C.white, fontSize: 15,
    fontWeight: "700", letterSpacing: 0.4,
  },
  primaryArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },

  secondaryButton: { paddingVertical: 12, alignItems: "center" },
  secondaryLabel: {
    color: "rgba(255,255,255,0.30)",
    fontSize: 13, fontWeight: "500",
  },
  secondaryLabelAccent: {
    color: "rgba(255,255,255,0.62)",
    fontWeight: "700",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.25)",
  },

  // ── Trust badge ───────────────────────────────────────────────────────────
  trustRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7, paddingBottom: 2,
  },
  trustDotWrap: {
    width: 10, height: 10,
    alignItems: "center", justifyContent: "center",
  },
  trustDotOuter: {
    position: "absolute",
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.greenGlow,
  },
  trustDotInner: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: C.green,
  },
  trustText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11, letterSpacing: 0.2,
  },

  // ── Animation components ──────────────────────────────────────────────────
  breathGlow: {
    position: "absolute",
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: C.red,
  },
  scanLine: {
    position: "absolute", left: 0, right: 0,
    height: 1.5, borderRadius: 1,
    backgroundColor: C.red,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 7,
    elevation: 6,
  },
  shimmer: {
    position: "absolute", top: 0, bottom: 0,
    width: 52,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 4,
  },
  shimmerThin: {
    position: "absolute", top: 0, bottom: 0,
    width: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
  },
});