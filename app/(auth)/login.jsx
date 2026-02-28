/**
 * @file app/(auth)/login.jsx
<<<<<<< HEAD
 * @description Authentication / Link Card Screen — SchoolQR Guardian
=======
 * @description Auth screen — SchoolQR Guardian
 *
 * Modes:
 *   ?mode=register  →  "Link your child's card" (card + mobile)
 *   ?mode=login     →  "Welcome back" (mobile only)
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
 */

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
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Rect, Line } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tokens ────────────────────────────────────────────────────────────────────

<<<<<<< HEAD
const COLORS = {
  bg: '#0D0F14',
  surface: '#181B22',
  surfaceLight: '#252830',
  primary: '#E94033',
  primaryFaded: 'rgba(233, 64, 51, 0.12)',
  primaryBorder: 'rgba(233, 64, 51, 0.4)',
  white: '#FFFFFF',
  textMuted: '#8A8F9A',
  textDim: '#5A5E67',
  focusRing: '#E94033',
=======
const C = {
  bg:          '#0D0D0F',
  bgDeep:      '#120909',
  surface:     '#161619',
  red:         '#FF3B30',
  redDark:     '#C8211A',
  redSubtle:   'rgba(255,59,48,0.10)',
  redBorder:   'rgba(255,59,48,0.38)',
  white:       '#FFFFFF',
  muted:       'rgba(255,255,255,0.42)',
  dim:         'rgba(255,255,255,0.22)',
  border:      'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.11)',
  focusBorder: 'rgba(255,59,48,0.60)',
  inputBg:     'rgba(255,255,255,0.05)',
  tabBg:       'rgba(255,255,255,0.06)',
  tabInactive: 'rgba(255,255,255,0.40)',
  divider:     'rgba(255,255,255,0.09)',
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
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

<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'scan'
  const [cardNumber, setCardNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const handleBack = useCallback(() => router.back(), []);

  const handleSendOtp = useCallback(() => {
    if (!cardNumber.trim() || !mobileNumber.trim()) return; // basic guard
    router.push('/(auth)/otp');
  }, [cardNumber, mobileNumber]);

  const isDisabled = !cardNumber.trim() || !mobileNumber.trim();
=======
  const [tab, setTab]         = useState('Manual Entry');
  const [card, setCard]       = useState('');
  const [mobile, setMobile]   = useState('');
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
      withTiming(0.96, { duration: 80,  easing: Easing.out(Easing.quad) }),
      withTiming(1.00, { duration: 120, easing: Easing.out(Easing.back(2)) })
    );
    setLoading(true);
    // TODO: wire to auth.api.js
    setTimeout(() => {
      setLoading(false);
      router.push('/(auth)/otp');
    }, 1200);
  }, [canSubmit, loading]);
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8

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
<<<<<<< HEAD
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 20, 40) },
          ]}
        >
          {/* ── Back ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeftIcon />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Title ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            {/* FIX: replaced &apos; with plain apostrophe */}
            <Text style={styles.title} allowFontScaling={false}>
              {`Link your\nchild's card`}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Enter the card number on the back of the QR card, or scan it.
            </Text>
          </Animated.View>

          {/* ── Segmented Control ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.tabContainer}>
            {['manual', 'scan'].map((tab) => (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'manual' ? 'Manual Entry' : 'Scan QR'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* ── Scan Tab Content ── */}
          {activeTab === 'scan' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <TouchableOpacity activeOpacity={0.7} style={styles.scanArea}>
                <QrCodeBoxIcon />
                <Text style={styles.scanText}>Tap to scan card QR code</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Manual Tab Content ── */}
          {activeTab === 'manual' && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.formContainer}>
              <FormInput
                label="CARD NUMBER"
                inputKey="card"
                focused={focusedInput}
                onFocus={setFocusedInput}
                onBlur={setFocusedInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="SQ-YYYY-XXXXXX"
                autoCapitalize="characters"
                icon={(active) => (
                  <CreditCardIcon color={active ? COLORS.textMuted : COLORS.textDim} />
                )}
              />
              <FormInput
                label="MOBILE NUMBER"
                inputKey="mobile"
                focused={focusedInput}
                onFocus={setFocusedInput}
                onBlur={setFocusedInput}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
                icon={(active) => (
                  <PhoneIcon color={active ? COLORS.textMuted : COLORS.textDim} />
                )}
              />
            </Animated.View>
          )}
        </ScrollView>

        {/* ── Footer CTA ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(500)}
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <TouchableOpacity
            activeOpacity={isDisabled ? 1 : 0.8}
            style={[styles.primaryButton, isDisabled && styles.primaryButtonDisabled]}
            onPress={handleSendOtp}
            disabled={isDisabled}
            accessibilityRole="button"
=======
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              s.scroll,
              { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 32) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
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

<<<<<<< HEAD
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Back
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  backText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Title
=======
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
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
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
<<<<<<< HEAD

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 5,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },

  // Scan area
  scanArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryFaded,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    marginBottom: 28,
  },
  scanText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Form
  formContainer: { gap: 20 },
  inputWrapper: { width: '100%' },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 14,
    height: 60,
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    borderColor: COLORS.focusRing,
    backgroundColor: '#1C1F28',
  },
  inputIcon: { marginRight: 12 },
  textInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: COLORS.bg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
=======
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 18,
    shadowColor: '#000',
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
<<<<<<< HEAD
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
=======
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
>>>>>>> 5ff99f8571a71399dc2eb0bf934dc195ceec2ac8
});