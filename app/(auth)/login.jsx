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
import { useCallback, useEffect, useState } from 'react';
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
      <View
        key={i}
        style={[
          stepS.dot,
          i < step && stepS.dotActive,
          i === step - 1 && stepS.dotCurrent,
        ]}
      />
    ))}
    <Text style={stepS.label} allowFontScaling={false}>
      {label}
    </Text>
  </View>
);

const stepS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.08)' },
  dotActive: { backgroundColor: '#FF3B30', opacity: 0.45 },
  dotCurrent: { backgroundColor: '#FF3B30', opacity: 1, width: 20, borderRadius: 2.5 },
  label: { color: 'rgba(255,255,255,0.20)', fontSize: 10, marginLeft: 5, letterSpacing: 0.5, fontWeight: '600' },
});

// ─── Corner Accent (kept as SVG — purely decorative geometry) ─────────────────

const CornerAccent = ({ position }) => {
  const isTR = position === 'topRight';
  return (
    <Svg
      width={44}
      height={44}
      viewBox="0 0 44 44"
      fill="none"
      style={[s.cornerAccent, isTR ? s.cornerTR : s.cornerBL]}
    >
      {isTR ? (
        <>
          <Path d="M44 0 L44 20" stroke={C.redBorder} strokeWidth="1.5" />
          <Path d="M44 0 L24 0" stroke={C.redBorder} strokeWidth="1.5" />
          <Circle cx="44" cy="0" r="2.5" fill={C.red} opacity="0.7" />
        </>
      ) : (
        <>
          <Path d="M0 44 L0 24" stroke={C.redBorder} strokeWidth="1.5" />
          <Path d="M0 44 L20 44" stroke={C.redBorder} strokeWidth="1.5" />
          <Circle cx="0" cy="44" r="2.5" fill={C.red} opacity="0.5" />
        </>
      )}
    </Svg>
  );
};

// ─── Geometric Background Decoration ─────────────────────────────────────────

const BackgroundGrid = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {/* Diagonal lines */}
    {Array.from({ length: 14 }).map((_, i) => (
      <Path
        key={`d-${i}`}
        d={`M${-80 + i * 75} 0 L${i * 75 + 140} ${height}`}
        stroke="rgba(255,255,255,0.011)"
        strokeWidth="1"
      />
    ))}
    {/* Horizontal faint grid */}
    {Array.from({ length: 9 }).map((_, i) => (
      <Path
        key={`h-${i}`}
        d={`M0 ${90 + i * 90} L${width} ${90 + i * 90}`}
        stroke="rgba(255,255,255,0.009)"
        strokeWidth="1"
      />
    ))}
    {/* Top-right corner bracket */}
    <Path
      d={`M${width - 28} 18 L${width - 18} 18 L${width - 18} 28`}
      stroke="rgba(255,59,48,0.30)"
      strokeWidth="1.5"
      fill="none"
    />
    {/* Bottom-left corner bracket */}
    <Path
      d={`M18 ${height - 28} L18 ${height - 18} L28 ${height - 18}`}
      stroke="rgba(255,59,48,0.22)"
      strokeWidth="1.5"
      fill="none"
    />
    {/* Dot cluster — top left */}
    {Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) => (
        <Circle
          key={`tl-${row}-${col}`}
          cx={22 + col * 10}
          cy={110 + row * 10}
          r="0.9"
          fill="rgba(255,255,255,0.08)"
        />
      ))
    )}
    {/* Dot cluster — bottom right */}
    {Array.from({ length: 4 }).map((_, row) =>
      Array.from({ length: 4 }).map((_, col) => (
        <Circle
          key={`br-${row}-${col}`}
          cx={width - 22 + col * 10}
          cy={height - 80 + row * 10}
          r="0.8"
          fill="rgba(255,255,255,0.07)"
        />
      ))
    )}
    {/* Left vertical accent line */}
    <Path
      d={`M6 ${height * 0.22} L6 ${height * 0.52}`}
      stroke="rgba(255,59,48,0.10)"
      strokeWidth="1"
    />
    {/* Right vertical accent line */}
    <Path
      d={`M${width - 6} ${height * 0.30} L${width - 6} ${height * 0.60}`}
      stroke="rgba(255,59,48,0.07)"
      strokeWidth="1"
    />
  </Svg>
);

// ─── Animated Input Field ─────────────────────────────────────────────────────

function AppInput({
  label, hint, value, onChangeText, placeholder,
  keyboardType, icon, prefix, maxLength, hasError,
  autoCapitalize, monospace,
}) {
  const [focused, setFocused] = useState(false);
  const glowOpacity = useSharedValue(0);
  const labelY = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
    labelY.value = withTiming(focused ? -1 : 0, { duration: 150 });
  }, [focused]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: labelY.value }],
  }));

  return (
    <View style={inpS.wrapper}>
      <View style={inpS.labelRow}>
        {label ? (
          <Animated.Text
            style={[
              inpS.label,
              focused && inpS.labelFocused,
              labelStyle,
            ]}
            allowFontScaling={false}
          >
            {label}
          </Animated.Text>
        ) : null}
        {hint ? (
          <Text style={inpS.hint} allowFontScaling={false}>
            {hint}
          </Text>
        ) : null}
      </View>

      <View style={inpS.inputOuter}>
        {/* Animated focus glow border */}
        <Animated.View
          style={[
            inpS.focusGlow,
            glowStyle,
            hasError && inpS.focusGlowError,
          ]}
        />
        <View
          style={[
            inpS.row,
            focused && inpS.rowFocused,
            hasError && inpS.rowError,
          ]}
        >
          {icon && <View style={inpS.iconWrap}>{icon}</View>}
          {prefix && (
            <>
              <Text style={inpS.prefix} allowFontScaling={false}>
                {prefix}
              </Text>
              <View style={inpS.prefixDivider} />
            </>
          )}
          <TextInput
            style={[inpS.field, monospace && inpS.fieldMono]}
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
          {value.length > 0 && !hasError && (
            <View style={inpS.validBadge}>
              <Feather name="check" size={10} color="#2ECC71" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const inpS = StyleSheet.create({
  wrapper: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  labelFocused: { color: '#FF3B30' },
  hint: { color: 'rgba(255,255,255,0.20)', fontSize: 10, letterSpacing: 0.3, fontWeight: '600' },
  inputOuter: { position: 'relative' },
  focusGlow: {
    position: 'absolute', inset: -2, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.40)',
    shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },
  focusGlowError: { borderColor: 'rgba(255,59,48,0.60)' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 54, backgroundColor: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.09)' },
  rowFocused: { borderColor: 'rgba(255,59,48,0.50)', backgroundColor: 'rgba(255,255,255,0.048)' },
  rowError: { borderColor: 'rgba(255,59,48,0.50)', backgroundColor: 'rgba(255,59,48,0.045)' },
  iconWrap: { marginRight: 10 },
  prefix: { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '700', marginRight: 8 },
  prefixDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.09)', marginRight: 12 },
  field: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500', letterSpacing: 0.3 },
  fieldMono: { fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }), letterSpacing: 1.5, fontSize: 14 },
  validBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(46,204,113,0.15)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.30)', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
});

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={errS.banner}>
      <View style={errS.iconWrap}>
        <Feather name="alert-triangle" size={13} color={C.red} />
      </View>
      <Text style={errS.text} allowFontScaling={false}>
        {message}
      </Text>
    </Animated.View>
  );
}

const errS = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,59,48,0.08)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  iconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.12)', alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, color: '#FF3B30', fontSize: 12.5, lineHeight: 17, letterSpacing: 0.1 },
});

// ─── Security Note ────────────────────────────────────────────────────────────

function SecurityNote() {
  return (
    <View style={secS.row}>
      <View style={secS.iconWrap}>
        <Feather name="shield" size={11} color="rgba(46,204,113,0.8)" />
      </View>
      <Text style={secS.text} allowFontScaling={false}>
        End-to-end encrypted · Never shared
      </Text>
    </View>
  );
}

const secS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center' },
  iconWrap: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(46,204,113,0.10)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.20)', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'rgba(46,204,113,0.50)', fontSize: 11, letterSpacing: 0.3 },
});

// ─── Card Number Tip ──────────────────────────────────────────────────────────

function CardNumberTip() {
  return (
    <View style={tipS.wrap}>
      <View style={tipS.stripe} />
      <View style={tipS.content}>
        <Text style={tipS.title} allowFontScaling={false}>WHERE TO FIND IT</Text>
        <Text style={tipS.text} allowFontScaling={false}>
          {'Printed on the '}
          <Text style={tipS.highlight}>front of your physical card</Text>
          {' as '}
          <Text style={tipS.code}>RESQID-XXXXXX</Text>
        </Text>
      </View>
    </View>
  );
}

const tipS = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.025)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' },
  stripe: { width: 3, backgroundColor: C.red, opacity: 0.5 },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  title: { color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  text: { color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 17 },
  highlight: { color: 'rgba(255,255,255,0.60)', fontWeight: '600' },
  code: { color: C.red, fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }), fontSize: 11, fontWeight: '700' },
});

// ─── Shimmer Overlay ──────────────────────────────────────────────────────────

const ShimmerOverlay = ({ active }) => {
  const translateX = useSharedValue(-240);

  useEffect(() => {
    if (!active) return;
    const run = () => {
      translateX.value = -240;
      translateX.value = withTiming(440, { duration: 820, easing: Easing.out(Easing.quad) });
    };
    const id = setTimeout(() => {
      run();
      setInterval(run, 4000);
    }, 600);
    return () => clearTimeout(id);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: '18deg' }],
  }));

  if (!active) return null;
  return <Animated.View style={[s.shimmer, animStyle]} pointerEvents="none" />;
};

// ─── LoginScreen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mode = 'register' } = useLocalSearchParams();
  const isRegister = mode === 'register';

  const [mobile, setMobile] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Window dimensions for background grid
  const [dims, setDims] = useState({ w: 390, h: 844 });

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const cardValid = cardNumber.trim().length >= 4 && cardNumber.trim().length <= 64;
  const canSubmit = isRegister
    ? mobile.length === 10 && cardValid
    : mobile.length === 10;

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, []);

  const switchMode = useCallback(() => {
    router.replace({
      pathname: '/(auth)/login',
      params: { mode: isRegister ? 'login' : 'register' },
    });
  }, [isRegister]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    setApiError(null);

    btnScale.value = withSequence(
      withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1.0, { damping: 8, stiffness: 180 }),
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
    <View
      style={s.root}
      onLayout={(e) => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Background layers */}
      <LinearGradient
        colors={['#08080A', '#110707', '#0C0C0E', '#080808']}
        locations={[0, 0.28, 0.7, 1]}
        style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
      />
      <BackgroundGrid width={dims.w} height={dims.h} />
      <View style={s.glowTopRight} pointerEvents="none" />
      <View style={s.glowBottomLeft} pointerEvents="none" />
      <View style={s.glowMidLeft} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              s.scroll,
              {
                paddingTop: insets.top + 10,
                paddingBottom: Math.max(insets.bottom, 32),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Top nav ── */}
            <Animated.View entering={FadeIn.duration(500)} style={s.topNav}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.55 }]}
                accessibilityRole="button"
              >
                <Feather name="chevron-left" size={19} color={C.white} />
              </Pressable>

              <StepIndicator step={1} total={2} label="Step 1 of 2" />

              <Pressable
                onPress={switchMode}
                style={({ pressed }) => [s.modePill, pressed && { opacity: 0.65 }]}
              >
                <View style={s.modePillDot} />
                <Text style={s.modePillText} allowFontScaling={false}>
                  {isRegister ? 'Sign In' : 'Register'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* ── Header ── */}
            <Animated.View
              entering={FadeInDown.duration(550).delay(80)}
              style={s.header}
            >
              {/* Eyebrow */}
              <View style={s.eyebrowRow}>
                <View style={s.eyebrowDash} />
                <Text style={s.eyebrow} allowFontScaling={false}>
                  {isRegister ? 'NEW ACCOUNT' : 'SIGN IN'}
                </Text>
                <View style={s.eyebrowDashFade} />
              </View>

              {/* Title */}
              <View style={s.titleWrap}>
                <Text style={s.title} allowFontScaling={false}>
                  {isRegister ? 'Link your\n' : 'Welcome\n'}
                  <Text style={s.titleAccent}>
                    {isRegister ? "child's card" : 'back'}
                  </Text>
                </Text>
                {/* Decorative bracket mark */}
                <View style={s.titleBracket} />
              </View>

              <Text style={s.subtitle} allowFontScaling={false}>
                {isRegister
                  ? 'Register your RESQID card and mobile to activate emergency identification.'
                  : 'Enter your registered mobile number to receive a verification code.'}
              </Text>
            </Animated.View>

            {/* ── Form card ── */}
            <Animated.View
              entering={FadeInDown.duration(580).delay(200)}
              style={s.formCard}
            >
              {/* Top accent bar */}
              <LinearGradient
                colors={['rgba(255,59,48,0.55)', 'rgba(255,59,48,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.cardTopBar}
              />

              <CornerAccent position="topRight" />
              <CornerAccent position="bottomLeft" />

              {/* Form content */}
              <View style={s.formInner}>
                {isRegister && (
                  <>
                    <AppInput
                      label="Card Number"
                      value={cardNumber}
                      onChangeText={(t) => {
                        setCardNumber(
                          t.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 16),
                        );
                        setApiError(null);
                      }}
                      placeholder="RESQID-A4F9B2"
                      icon={
                        <Feather
                          name="credit-card"
                          size={16}
                          color={cardNumber.length > 0 ? C.red : 'rgba(255,255,255,0.28)'}
                        />
                      }
                      maxLength={16}
                      hasError={!!apiError}
                      autoCapitalize="characters"
                      monospace
                    />
                    <CardNumberTip />
                  </>
                )}

                <AppInput
                  label="Mobile Number"
                  hint={`${mobile.length} / 10`}
                  value={mobile}
                  onChangeText={(t) => {
                    setMobile(t.replace(/\D/g, '').slice(0, 10));
                    setApiError(null);
                  }}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  icon={
                    <Feather
                      name="phone"
                      size={16}
                      color={mobile.length > 0 ? C.red : 'rgba(255,255,255,0.28)'}
                    />
                  }
                  prefix="+91"
                  maxLength={10}
                  hasError={!!apiError}
                />

                <ErrorBanner message={apiError} />

                {/* Submit button */}
                <Animated.View style={btnStyle}>
                  <Pressable
                    onPress={handleSubmit}
                    style={({ pressed }) => [
                      s.submitWrap,
                      !canSubmit && s.submitDisabled,
                      pressed && canSubmit && { opacity: 0.88 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Send OTP"
                  >
                    <LinearGradient
                      colors={
                        canSubmit
                          ? [C.red, '#E02A24', C.redDark]
                          : ['#1E1E22', '#181820']
                      }
                      style={s.submitBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <ShimmerOverlay active={canSubmit} />
                      <Text
                        style={[s.submitLabel, !canSubmit && s.submitLabelDim]}
                        allowFontScaling={false}
                      >
                        {loading ? 'Sending OTP…' : 'Send OTP'}
                      </Text>
                      {canSubmit && !loading && (
                        <View style={s.submitArrow}>
                          <Feather name="arrow-right" size={16} color={C.white} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                <SecurityNote />
              </View>
            </Animated.View>

            {/* ── Footer ── */}
            <Animated.View
              entering={FadeInDown.duration(450).delay(380)}
              style={s.footer}
            >
              <Text style={s.footerText} allowFontScaling={false}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable
                onPress={switchMode}
                style={({ pressed }) => [s.footerLink, pressed && { opacity: 0.65 }]}
              >
                <Text style={s.footerLinkText} allowFontScaling={false}>
                  {isRegister ? 'Sign In' : 'Get Started'}
                </Text>
                <Feather name="arrow-right" size={13} color={C.red} />
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

  // ── Background glows ──────────────────────────────────────────────────────
  glowTopRight: {
    position: 'absolute', top: -50, right: -70,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: C.red, opacity: 0.06,
  },
  glowBottomLeft: {
    position: 'absolute', bottom: 40, left: -90,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.red, opacity: 0.04,
  },
  glowMidLeft: {
    position: 'absolute', top: '40%', left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.red, opacity: 0.03,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: 20, flexGrow: 1 },

  // ── Top nav ───────────────────────────────────────────────────────────────
  topNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28, paddingHorizontal: 2,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center', justifyContent: 'center',
  },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  modePillDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: C.red,
  },
  modePillText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12, fontWeight: '700', letterSpacing: 0.3,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: { marginBottom: 22, gap: 10, paddingHorizontal: 2 },

  eyebrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  eyebrowDash: {
    width: 18, height: 2, backgroundColor: C.red, borderRadius: 1,
  },
  eyebrowDashFade: {
    width: 10, height: 1,
    backgroundColor: 'rgba(255,59,48,0.35)', borderRadius: 1,
  },
  eyebrow: {
    color: C.red, fontSize: 9,
    fontWeight: '800', letterSpacing: 3.5,
  },

  titleWrap: { position: 'relative' },
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: C.white, letterSpacing: -0.6, lineHeight: 42,
  },
  titleAccent: {
    color: C.red, fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    letterSpacing: -0.6,
  },
  titleBracket: {
    position: 'absolute', left: -8, top: 6,
    width: 3, height: 28, borderRadius: 1.5,
    backgroundColor: C.red, opacity: 0.5,
  },
  subtitle: {
    fontSize: 13.5, color: 'rgba(255,255,255,0.38)',
    lineHeight: 20, letterSpacing: 0.1, maxWidth: 310,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: 'rgba(15,14,16,0.92)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40, shadowRadius: 28,
    elevation: 14,
    overflow: 'hidden',
  },
  cardTopBar: {
    height: 2, width: '60%',
  },
  cornerAccent: { position: 'absolute' },
  cornerTR: { top: 14, right: 14 },
  cornerBL: { bottom: 14, left: 14 },

  formInner: { padding: 20, gap: 16 },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitWrap: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50, shadowRadius: 18,
    elevation: 14, marginTop: 2,
  },
  submitDisabled: { shadowOpacity: 0, elevation: 0 },
  submitBtn: {
    flexDirection: 'row', paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, gap: 8,
  },
  submitLabel: { color: C.white, fontSize: 15.5, fontWeight: '700', letterSpacing: 0.3 },
  submitLabelDim: { color: 'rgba(255,255,255,0.28)' },
  submitArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 50,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 4,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 22, gap: 6, flexWrap: 'wrap',
  },
  footerText: { color: 'rgba(255,255,255,0.28)', fontSize: 13 },
  footerLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  footerLinkText: {
    color: C.red, fontSize: 13,
    fontWeight: '700', letterSpacing: 0.2,
  },
});