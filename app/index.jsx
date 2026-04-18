// app/index.jsx
import {
  BreathGlow,
  CornerBrackets,
  DataReadout,
  FeaturePill,
  FloatingIcon,
  GeometricPattern,
  OrbitParticle,
  PulseRing,
  ScanLine,
  ShimmerOverlay,
  StatusDot,
} from "@/components/welcome/welcome.index";
import { C, FEATURE_PILLS, TRUST_BADGE_TEXT, VALID_MODES } from "@/constants/constants";
import { useAuthStore } from "@/features/auth/auth.store";
import { styles } from "@/styles/welcome.style";
import { clamp } from "@/utils/scale";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { Pressable, StatusBar, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const r = clamp(windowWidth / 390, 0.75, 1.25);
  const rv = clamp(windowHeight / 844, 0.80, 1.20);
  const s = (px) => Math.round(px * r);
  const sv = (px) => Math.round(px * rv);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const iconSize = s(112);

  const navigate = useCallback((mode) => {
    const safeMode = VALID_MODES.includes(mode) ? mode : "login";
    router.replace({ pathname: "/(auth)/login", params: { mode: safeMode } });
  }, []);

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace("/(app)/home");
  }, [isHydrated, isAuthenticated]);

  if (!isHydrated || isAuthenticated) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <LinearGradient
        colors={["#08080A", "#110707", "#0C0C0E", "#080808"]}
        locations={[0, 0.3, 0.7, 1]}
        style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, { pointerEvents: "none" }]}
      />
      <GeometricPattern width={windowWidth} height={windowHeight} />
      <View style={[styles.glowTop, { pointerEvents: "none" }]} />
      <View style={[styles.glowBottom, { pointerEvents: "none" }]} />
      <View style={[styles.glowRight, { pointerEvents: "none" }]} />

      <View style={[styles.topSection, { paddingTop: insets.top + sv(14) }]}>
        <Animated.View entering={FadeIn.duration(700).delay(100)} style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <View style={styles.brandBadgeDot} />
            <Text style={styles.brandBadgeText} allowFontScaling={false}>RESQID</Text>
          </View>
          <View style={styles.brandDivider} />
          <Text style={styles.brandTagline} allowFontScaling={false}>School Safety Platform</Text>
          <View style={styles.versionTag}>
            <Text style={styles.versionText} allowFontScaling={false}>v2.4</Text>
          </View>
        </Animated.View>

        <View style={[styles.heroArea, { height: sv(272) }]}>
          <PulseRing size={s(252)} delay={0} baseOpacity={0.09} />
          <PulseRing size={s(196)} delay={700} baseOpacity={0.13} />
          <PulseRing size={s(150)} delay={350} baseOpacity={0.08} />
          <BreathGlow />
          <View style={[styles.orbitAnchor, { width: s(144), height: s(144) }]}>
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={0} />
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={120} />
            <OrbitParticle radius={s(72)} duration={5800} delay={800} startAngle={240} />
          </View>
          <FloatingIcon>
            <View style={[styles.iconWrapper, { width: iconSize, height: iconSize }]}>
              <View style={[styles.iconGlowRing, { width: iconSize + s(18), height: iconSize + s(18), borderRadius: s(34), top: -s(9), left: -s(9) }]} />
              <Animated.View entering={FadeIn.duration(900).delay(200)} style={[styles.iconCard, { width: iconSize, height: iconSize, borderRadius: s(30) }]}>
                <LinearGradient colors={["#1C1C22", "#131318", "#0E0E12"]} locations={[0, 0.5, 1]} style={styles.iconCardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.iconCardHighlight} />
                  <View style={styles.iconCardBottomSheen} />
                  <MaterialCommunityIcons name="shield-check" size={s(56)} color={C.red} />
                  <ScanLine iconHalfHeight={s(56)} />
                </LinearGradient>
              </Animated.View>
              <CornerBrackets size={iconSize} color="rgba(255,59,48,0.5)" thickness={1.5} arm={s(16)} />
              <StatusDot />
            </View>
          </FloatingIcon>

          <Animated.View entering={FadeInLeft.duration(650).delay(550)} style={[styles.floatingBadge, styles.floatingBadgeLeft]}>
            <Text style={styles.floatingBadgeNum} allowFontScaling={false}>2.4K+</Text>
            <Text style={styles.floatingBadgeLabel} allowFontScaling={false}>Protected</Text>
            <View style={styles.floatingBadgeBar} />
          </Animated.View>

          <Animated.View entering={FadeInRight.duration(650).delay(700)} style={[styles.floatingBadge, styles.floatingBadgeRight]}>
            <View style={styles.floatingBadgeLiveWrap}>
              <View style={styles.floatingBadgeDot} />
              <Text style={styles.floatingBadgeLive} allowFontScaling={false}>LIVE</Text>
            </View>
            <Text style={styles.floatingBadgeSubtext} allowFontScaling={false}>Monitoring</Text>
          </Animated.View>

          <DataReadout />
        </View>

        <Animated.View entering={FadeInDown.duration(650).delay(380)} style={styles.titleBlock}>
          <Text style={styles.titleEyebrow} allowFontScaling={false}>WELCOME TO</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.titleMain, { fontSize: s(50), lineHeight: s(54) }]} allowFontScaling={false}>RES<Text style={[styles.titleAccent, { fontSize: s(50) }]}>QID</Text></Text>
          </View>
          <View style={styles.titleSubRow}>
            <View style={styles.titleSubDash} />
            <Text style={styles.titleSub} allowFontScaling={false}>Rescue · ID · Respond</Text>
            <View style={styles.titleSubDash} />
          </View>
        </Animated.View>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, sv(24)) }]}>
        <Animated.View entering={FadeIn.duration(500).delay(520)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText} allowFontScaling={false}>Every child, identified & safe</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <View style={styles.featureRow}>
          {FEATURE_PILLS.map((pill) => <FeaturePill key={pill.label} {...pill} />)}
        </View>

        <Animated.View entering={FadeInDown.duration(650).delay(720)} style={styles.buttonGroup}>
          <Pressable onPress={() => navigate("register")} style={({ pressed }) => [styles.primaryWrapper, pressed && { opacity: 0.88, transform: [{ scale: 0.982 }] }]} accessibilityRole="button" accessibilityLabel="Get started — create a new account">
            <LinearGradient colors={[C.red, "#DC2B25", C.redDark]} style={styles.primaryButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <ShimmerOverlay />
              <Text style={styles.primaryLabel} allowFontScaling={false}>Get Started</Text>
              <View style={styles.primaryArrow}><Feather name="arrow-right" size={s(16)} color={C.white} /></View>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => navigate("login")} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.65 }]} accessibilityRole="button" accessibilityLabel="Sign in to an existing account">
            <Text style={styles.secondaryLabel} allowFontScaling={false}>Already have an account? <Text style={styles.secondaryLabelAccent}>Sign In</Text></Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(920)} style={styles.trustRow}>
          <View style={styles.trustDotWrap}><View style={styles.trustDotOuter} /><View style={styles.trustDotInner} /></View>
          <Text style={styles.trustText} allowFontScaling={false}>{TRUST_BADGE_TEXT}</Text>
        </Animated.View>
      </View>
    </View>
  );
}