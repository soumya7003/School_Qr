<<<<<<< HEAD
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
=======
/**
 * @file app/(auth)/login.jsx
 * @description Auth screen — RESQID
 *
 * Refactored: All custom SVG icon components replaced with @expo/vector-icons
 *             (Feather + MaterialCommunityIcons). CornerAccent kept as SVG
 *             (geometric decoration, no icon equivalent).
 *
 * Modes:
 *   ?mode=register  →  "Link your child's card" (card + mobile)
 *   ?mode=login     →  "Welcome back" (mobile only)
 */

import { Login_C as C, ERROR_MESSAGES } from '@/constants/constants';
import { authApi } from '@/features/auth/auth.api';
import { registrationApi } from '@/features/profile/profile.api';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';


const getErrorMessage = (error) =>
  ERROR_MESSAGES[error?.status] ?? ERROR_MESSAGES[error?.code] ?? ERROR_MESSAGES.DEFAULT;

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ step, total, label }) => (
  <View style={stepS.wrap}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[stepS.dot, i < step && stepS.dotActive, i === step - 1 && stepS.dotCurrent]} />
    ))}
    <Text style={stepS.label} allowFontScaling={false}>{label}</Text>
  </View>
);

const stepS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.10)' },
  dotActive: { backgroundColor: '#FF3B30', opacity: 0.5 },
  dotCurrent: { backgroundColor: '#FF3B30', opacity: 1, width: 18, borderRadius: 3 },
  label: { color: 'rgba(255,255,255,0.22)', fontSize: 11, marginLeft: 4, letterSpacing: 0.3 },
});

// ─── Corner Accent (kept as SVG — purely decorative geometry) ─────────────────

const CornerAccent = ({ position }) => {
  const isTR = position === 'topRight';
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40" fill="none"
      style={[s.cornerAccent, isTR ? s.cornerTR : s.cornerBL]}>
      {isTR ? (
        <>
          <Path d="M40 0 L40 18" stroke={C.redBorder} strokeWidth="1" />
          <Path d="M40 0 L22 0" stroke={C.redBorder} strokeWidth="1" />
          <Circle cx="40" cy="0" r="2" fill={C.red} opacity="0.6" />
        </>
      ) : (
        <>
          <Path d="M0 40 L0 22" stroke={C.redBorder} strokeWidth="1" />
          <Path d="M0 40 L18 40" stroke={C.redBorder} strokeWidth="1" />
          <Circle cx="0" cy="40" r="2" fill={C.red} opacity="0.4" />
        </>
      )}
    </Svg>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────

function AppInput({ label, hint, value, onChangeText, placeholder, keyboardType, icon, prefix, maxLength, hasError, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inpS.wrapper}>
      <View style={inpS.labelRow}>
        {label ? <Text style={[inpS.label, focused && inpS.labelFocused]} allowFontScaling={false}>{label}</Text> : null}
        {hint ? <Text style={inpS.hint} allowFontScaling={false}>{hint}</Text> : null}
      </View>
      <View style={[inpS.row, focused && inpS.rowFocused, hasError && inpS.rowError]}>
        {icon && <View style={inpS.iconWrap}>{icon}</View>}
        {prefix && (
          <>
            <Text style={inpS.prefix} allowFontScaling={false}>{prefix}</Text>
            <View style={inpS.prefixDivider} />
          </>
        )}
        <TextInput
          style={inpS.field}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={C.red}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          maxLength={maxLength}
          allowFontScaling={false}
        />
        {value.length > 0 && !hasError && <View style={inpS.validDot} />}
      </View>
    </View>
  );
}

const inpS = StyleSheet.create({
  wrapper: { gap: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.40)', fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  labelFocused: { color: '#FF3B30' },
  hint: { color: 'rgba(255,255,255,0.22)', fontSize: 11, letterSpacing: 0.2 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.2, paddingHorizontal: 14, height: 56, backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' },
  rowFocused: { borderColor: 'rgba(255,59,48,0.55)', backgroundColor: 'rgba(255,255,255,0.055)' },
  rowError: { borderColor: 'rgba(255,59,48,0.55)', backgroundColor: 'rgba(255,59,48,0.05)' },
  iconWrap: { marginRight: 10 },
  prefix: { color: 'rgba(255,255,255,0.60)', fontSize: 15, fontWeight: '600', marginRight: 8 },
  prefixDivider: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.10)', marginRight: 12 },
  field: { flex: 1, color: '#FFFFFF', fontSize: 15.5, fontWeight: '500', letterSpacing: 0.3 },
  validDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71', marginLeft: 8 },
});

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={errS.banner}>
      {/* alert-triangle from Feather replaces custom AlertIcon SVG */}
      <Feather name="alert-triangle" size={15} color={C.red} />
      <Text style={errS.text} allowFontScaling={false}>{message}</Text>
    </Animated.View>
  );
}

const errS = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,59,48,0.10)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.30)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  text: { flex: 1, color: '#FF3B30', fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
});

// ─── Security Note ────────────────────────────────────────────────────────────

function SecurityNote() {
  return (
    <View style={secS.row}>
      {/* shield from Feather replaces custom ShieldTinyIcon SVG */}
      <Feather name="shield" size={13} color="rgba(46,204,113,0.7)" />
      <Text style={secS.text} allowFontScaling={false}>Your data is encrypted and never shared</Text>
    </View>
  );
}

const secS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', paddingTop: 4 },
  text: { color: 'rgba(46,204,113,0.55)', fontSize: 11.5, letterSpacing: 0.2 },
});

// ─── Card Number Tip ──────────────────────────────────────────────────────────

function CardNumberTip() {
  return (
    <View style={tipS.wrap}>
      <View style={tipS.dot} />
      <Text style={tipS.text} allowFontScaling={false}>
        {'Find your card number on the '}
        <Text style={tipS.highlight}>front of the physical card</Text>
        {' — printed as '}
        <Text style={tipS.highlight}>RESQID-XXXXXX</Text>
      </Text>
    </View>
  );
}

const tipS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.red, marginTop: 5, flexShrink: 0 },
  text: { flex: 1, color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 18, letterSpacing: 0.1 },
  highlight: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});

// ─── LoginScreen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mode = 'register' } = useLocalSearchParams();
  const isRegister = mode === 'register';

  const [mobile, setMobile] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const cardValid = cardNumber.trim().length >= 4 && cardNumber.trim().length <= 64;
  const canSubmit = isRegister ? mobile.length === 10 && cardValid : mobile.length === 10;

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, []);

  const switchMode = useCallback(() => {
    router.replace({ pathname: '/(auth)/login', params: { mode: isRegister ? 'login' : 'register' } });
  }, [isRegister]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    setApiError(null);

    btnScale.value = withSequence(
      withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 8, stiffness: 180 })
    );

    setLoading(true);
    try {
      const phone = `+91${mobile.trim()}`;

      if (isRegister) {
        const response = await registrationApi.initRegistration({
          card_number: cardNumber.trim().toUpperCase(),
          phone,
        });
        router.push({
          pathname: '/(auth)/otp',
          params: {
            phone,
            mode: 'register',
            nonce: response.data.nonce,
            maskedPhone: response.data.masked_phone,
            cardNumber: cardNumber.trim().toUpperCase(),
          },
        });
      } else {
        await authApi.sendOtp(phone);
        router.push({ pathname: '/(auth)/otp', params: { phone, mode: 'login' } });
      }
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, mobile, cardNumber, isRegister, btnScale]);

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <LinearGradient
        colors={['#0A0A0C', '#130808', '#0D0D0F']}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />
      <View style={s.glowTopRight} />
      <View style={s.glowBottomLeft} />
      <View style={[s.stripeWrap, { pointerEvents: 'none' }]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[s.stripe, { top: i * 90 - 40, left: -60 + i * 30 }]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 32) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top nav */}
            <Animated.View entering={FadeIn.duration(400)} style={s.topNav}>
              <Pressable onPress={handleBack} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                {/* chevron-left from Feather replaces custom BackIcon SVG */}
                <Feather name="chevron-left" size={20} color={C.white} />
              </Pressable>
              <StepIndicator step={1} total={2} label="Enter mobile" />
              <Pressable onPress={switchMode} style={({ pressed }) => [s.modePill, pressed && { opacity: 0.7 }]}>
                <Text style={s.modePillText} allowFontScaling={false}>{isRegister ? 'Sign In' : 'Register'}</Text>
              </Pressable>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(500).delay(80)} style={s.header}>
              <View style={s.eyebrowRow}>
                <View style={s.eyebrowLine} />
                <Text style={s.eyebrow} allowFontScaling={false}>{isRegister ? 'NEW ACCOUNT' : 'SIGN IN'}</Text>
              </View>
              <Text style={s.title} allowFontScaling={false}>
                {isRegister ? 'Create your\n' : 'Welcome\n'}
                <Text style={s.titleAccent}>{isRegister ? 'account' : 'back'}</Text>
              </Text>
              <Text style={s.subtitle} allowFontScaling={false}>
                Enter your registered mobile number to receive a one-time verification code.
              </Text>
            </Animated.View>

            {/* Form card */}
            <Animated.View entering={FadeInDown.duration(550).delay(200)} style={s.formCard}>
              <CornerAccent position="topRight" />
              <CornerAccent position="bottomLeft" />

              {isRegister && (
                <>
                  <AppInput
                    label="Card Number"
                    value={cardNumber}
                    onChangeText={(t) => { setCardNumber(t.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 16)); setApiError(null); }}
                    placeholder="RESQID-A4F9B2"
                    // credit-card from Feather replaces custom CardIcon SVG
                    icon={<Feather name="credit-card" size={17} color={cardNumber.length > 0 ? C.red : C.white40} />}
                    maxLength={16}
                    hasError={!!apiError}
                    autoCapitalize="characters"
                  />
                  <CardNumberTip />
                </>
              )}

              <AppInput
                label="Mobile Number"
                hint={`${mobile.length}/10`}
                value={mobile}
                onChangeText={(t) => { setMobile(t.replace(/\D/g, '').slice(0, 10)); setApiError(null); }}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                // phone from Feather replaces custom PhoneIcon SVG
                icon={<Feather name="phone" size={17} color={mobile.length > 0 ? C.red : C.white40} />}
                prefix="+91"
                maxLength={10}
                hasError={!!apiError}
              />

              <ErrorBanner message={apiError} />

              <Animated.View style={btnStyle}>
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [s.submitWrap, !canSubmit && s.submitDisabled, pressed && canSubmit && { opacity: 0.88 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Send OTP"
                >
                  <LinearGradient
                    colors={canSubmit ? [C.red, '#E8302A', C.redDark] : ['#2A2A2D', '#222225']}
                    style={s.submitBtn}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={[s.submitLabel, !canSubmit && s.submitLabelDim]} allowFontScaling={false}>
                      {loading ? 'Sending OTP…' : 'Send OTP'}
                    </Text>
                    {canSubmit && !loading && (
                      <View style={s.submitArrow}>
                        {/* arrow-right from Feather replaces custom ArrowRightIcon SVG */}
                        <Feather name="arrow-right" size={18} color={C.white} />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <SecurityNote />
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInDown.duration(450).delay(400)} style={s.footer}>
              <Text style={s.footerText} allowFontScaling={false}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={switchMode} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text style={s.footerLink} allowFontScaling={false}>
                  {isRegister ? '  Sign In →' : '  Get Started →'}
                </Text>
              </Pressable>
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
  glowTopRight: { position: 'absolute', top: -40, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: C.red, opacity: 0.055, pointerEvents: 'none' },
  glowBottomLeft: { position: 'absolute', bottom: 60, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: C.red, opacity: 0.04, pointerEvents: 'none' },
  stripeWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  stripe: { position: 'absolute', width: 1, height: 600, backgroundColor: 'rgba(255,255,255,0.016)', transform: [{ rotate: '25deg' }] },
  cornerAccent: { position: 'absolute' },
  cornerTR: { top: 14, right: 14 },
  cornerBL: { bottom: 14, left: 14 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingHorizontal: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white06, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  modePill: { backgroundColor: C.white06, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  modePillText: { color: C.white60, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2 },
  header: { marginBottom: 24, gap: 12, paddingHorizontal: 2 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eyebrowLine: { width: 20, height: 1.5, backgroundColor: C.red, borderRadius: 1 },
  eyebrow: { color: C.red, fontSize: 10, fontWeight: '800', letterSpacing: 3 },
  title: { fontSize: 36, fontWeight: Platform.select({ ios: '800', android: '700' }), color: C.white, letterSpacing: -0.8, lineHeight: 44 },
  titleAccent: { color: C.red, fontSize: 36, fontWeight: Platform.select({ ios: '800', android: '700' }), letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: C.muted, lineHeight: 21, letterSpacing: 0.1, maxWidth: 300 },
  formCard: { backgroundColor: C.surface, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: C.border, gap: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 24, elevation: 12, overflow: 'hidden' },
  submitWrap: { borderRadius: 15, overflow: 'hidden', shadowColor: C.red, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.48, shadowRadius: 16, elevation: 14, marginTop: 2 },
  submitDisabled: { shadowOpacity: 0, elevation: 0 },
  submitBtn: { flexDirection: 'row', paddingVertical: 17, alignItems: 'center', justifyContent: 'center', borderRadius: 15, gap: 8 },
  submitLabel: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  submitLabelDim: { color: C.white40 },
  submitArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' },
  footerText: { color: C.muted, fontSize: 13.5 },
  footerLink: { color: C.red, fontSize: 13.5, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
});