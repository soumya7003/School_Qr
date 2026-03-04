/**
 * @file app/(auth)/login.jsx
 * @description Auth screen — SchoolQR Guardian
 *
 * Modes:
 *   ?mode=register  →  "Link your child's card" (card + mobile)
 *   ?mode=login     →  "Welcome back" (mobile only)
 */

import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Line, Path, Rect, Svg } from 'react-native-svg';

// ─── Tokens ────────────────────────────────────────────────────────────────────

const C = {
  bg: '#0D0D0F',
  bgDeep: '#120909',
  surface: '#161619',
  red: '#FF3B30',
  redDark: '#C8211A',
  redSubtle: 'rgba(255,59,48,0.10)',
  redBorder: 'rgba(255,59,48,0.38)',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.42)',
  dim: 'rgba(255,255,255,0.22)',
  border: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.11)',
  focusBorder: 'rgba(255,59,48,0.60)',
  inputBg: 'rgba(255,255,255,0.05)',
  tabBg: 'rgba(255,255,255,0.06)',
  tabInactive: 'rgba(255,255,255,0.40)',
  divider: 'rgba(255,255,255,0.09)',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12l7-7M5 12l7 7"
      stroke={C.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CardIcon = ({ active }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={active ? C.red : C.muted} strokeWidth="1.8" />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={active ? C.red : C.muted} strokeWidth="1.8" />
  </Svg>
);

const PhoneIcon = ({ active }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.08 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={active ? C.red : C.muted}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrBoxIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={C.red} strokeWidth="1.8" />
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={C.red} strokeWidth="1.8" />
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={C.red} strokeWidth="1.8" />
    <Path
      d="M14 14h3v3M17 14h3M14 17v3h3M17 20h3v-3"
      stroke={C.red}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl({ value, onChange }) {
  return (
    <View style={seg.wrap}>
      {['Manual Entry', 'Scan QR'].map((tab) => {
        const active = value === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[seg.tab, active && seg.tabActive]}
            onPress={() => onChange(tab)}
            activeOpacity={0.75}
          >
            {active ? (
              <LinearGradient
                colors={[C.red, C.redDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={seg.gradient}
              >
                <Text style={seg.labelActive}>{tab}</Text>
              </LinearGradient>
            ) : (
              <Text style={seg.labelInactive}>{tab}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: C.tabBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  tab: { flex: 1, borderRadius: 9, overflow: 'hidden' },
  tabActive: {
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: { paddingVertical: 11, alignItems: 'center', borderRadius: 9 },
  labelActive: { color: C.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  labelInactive: {
    color: C.tabInactive,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

// ─── AppInput ─────────────────────────────────────────────────────────────────

function AppInput({ label, value, onChangeText, placeholder, keyboardType, icon, prefix }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inp.wrapper}>
      {label ? <Text style={inp.label}>{label}</Text> : null}
      <View style={[inp.row, { borderColor: focused ? C.focusBorder : C.inputBorder }]}>
        {icon && <View style={inp.iconWrap}>{icon}</View>}
        {prefix && (
          <>
            <Text style={inp.prefix}>{prefix}</Text>
            <View style={inp.prefixLine} />
          </>
        )}
        <TextInput
          style={inp.field}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={C.red}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

const inp = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 13,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    height: 54,
  },
  iconWrap: { marginRight: 10 },
  prefix: { color: C.muted, fontSize: 15, fontWeight: '600', marginRight: 6 },
  prefixLine: { width: 1, height: 20, backgroundColor: C.inputBorder, marginRight: 12 },
  field: { flex: 1, color: C.white, fontSize: 15.5, fontWeight: '500', letterSpacing: 0.4 },
});

// ─── ScanBox ──────────────────────────────────────────────────────────────────

function ScanBox() {
  return (
    <TouchableOpacity style={scan.box} activeOpacity={0.75}>
      <View style={scan.inner}>
        <QrBoxIcon />
        <Text style={scan.label}>Tap to scan card QR code</Text>
      </View>
    </TouchableOpacity>
  );
}

const scan = StyleSheet.create({
  box: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.redBorder,
    borderStyle: 'dashed',
    backgroundColor: C.redSubtle,
    paddingVertical: 28,
    alignItems: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: C.red, fontSize: 15, fontWeight: '600' },
});

// ─── OrDivider ────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <View style={divStyle.row}>
      <View style={divStyle.line} />
      <Text style={divStyle.text}>or enter manually</Text>
      <View style={divStyle.line} />
    </View>
  );
}

const divStyle = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: C.divider },
  text: { color: C.dim, fontSize: 12.5, letterSpacing: 0.2 },
});

// ─── LoginScreen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mode = 'register' } = useLocalSearchParams();
  const isRegister = mode === 'register';

  const [tab, setTab] = useState('Manual Entry');
  const [card, setCard] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const canSubmit = isRegister
    ? card.trim().length > 0 && mobile.length === 10
    : mobile.length === 10;

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    btnScale.value = withSequence(
      withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(1.00, { duration: 120, easing: Easing.out(Easing.back(2)) })
    );
    setLoading(true);
    // TODO: wire to auth.api.js
    setTimeout(() => {
      setLoading(false);
      router.push('/(auth)/otp');
    }, 1200);
  }, [canSubmit, loading, btnScale]);

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <LinearGradient
        colors={[C.bg, C.bgDeep, C.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={s.glow} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              s.scroll,
              { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 32) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back */}
            <Animated.View entering={FadeIn.duration(400)}>
              <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.7}>
                <ArrowLeftIcon />
                <Text style={s.backLabel}>Back</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(480).delay(80)} style={s.header}>
              <Text style={s.title} allowFontScaling={false}>
                {isRegister ? "Link your\nchild's card" : 'Welcome\nback'}
              </Text>
              <Text style={s.subtitle} allowFontScaling={false}>
                {isRegister
                  ? 'Enter the card number on the back of the QR card, or scan it.'
                  : 'Enter your registered mobile number to continue.'}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={s.card}>
              {isRegister && <SegmentedControl value={tab} onChange={setTab} />}
              {isRegister && tab === 'Scan QR' && <ScanBox />}
              {isRegister && tab === 'Scan QR' && <OrDivider />}

              {isRegister && (
                <AppInput
                  label="Card Number"
                  value={card}
                  onChangeText={setCard}
                  placeholder="SQ-2024-000000"
                  icon={<CardIcon active={card.length > 0} />}
                />
              )}

              <AppInput
                label="Mobile Number"
                value={mobile}
                onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="enter mobile number"
                keyboardType="phone-pad"
                icon={<PhoneIcon active={mobile.length > 0} />}
                prefix="+91"
              />

              <Animated.View style={btnStyle}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  activeOpacity={canSubmit ? 0.82 : 0.5}
                  style={[s.submitWrap, !canSubmit && { opacity: 0.45 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Send OTP"
                >
                  <LinearGradient
                    colors={[C.red, C.redDark]}
                    style={s.submitBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={s.submitLabel}>
                      {loading ? 'Sending…' : 'Send OTP →'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.duration(480).delay(380)} style={s.footer}>
              <Text style={s.footerText}>
                {isRegister ? 'Already have an account?  ' : "Don't have an account?  "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.replace({
                    pathname: '/(auth)/login',
                    params: { mode: isRegister ? 'login' : 'register' },
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={s.footerLink}>
                  {isRegister ? 'Sign In' : 'Get Started'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  glow: {
    position: 'absolute',
    bottom: -80,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: C.red,
    opacity: 0.04,
  },
  scroll: { paddingHorizontal: 22, flexGrow: 1 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 30,
  },
  backLabel: { color: C.white, fontSize: 15.5, fontWeight: '600' },
  header: { marginBottom: 26, gap: 10 },
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: C.white,
    letterSpacing: -0.6,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 14.5,
    color: C.muted,
    lineHeight: 22,
    letterSpacing: 0.1,
    maxWidth: 320,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  submitWrap: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    marginTop: 4,
  },
  submitBtn: {
    paddingVertical: 17,
    alignItems: 'center',
    borderRadius: 15,
  },
  submitLabel: {
    color: C.white,
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.red, fontSize: 14, fontWeight: '700' },
});