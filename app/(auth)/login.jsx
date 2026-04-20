/**
 * @file app/(auth)/login.jsx
 * @description Auth screen — RESQID (PROFESSIONAL)
 * 
 * FIXES:
 *   [FIX-1] Removed blinking corner animations
 *   [FIX-2] Improved error display with inline validation
 *   [FIX-3] Better loading states
 *   [FIX-4] Cleaner UI without distracting animations
 */

import { Login_C as C, ERROR_MESSAGES } from '@/constants/constants';
import { authApi } from '@/features/auth/auth.api';
import { registrationApi } from '@/features/profile/profile.api';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

// ─── Haptic Feedback (cross-platform) ───────────────────────────────────────
const hapticLight = () => {
  if (Platform.OS === 'ios') {
    try { require('react-native').Vibration.vibrate(10); } catch { }
  } else if (Platform.OS === 'android') {
    try { require('react-native').Vibration.vibrate(15); } catch { }
  }
};

const getErrorMessage = (error) => {
  const status = error?.status;
  const code = error?.code;

  if (status === 429) return 'Too many attempts. Please wait 5 minutes.';
  if (code === 'CARD_ALREADY_REGISTERED') return 'This card is already linked to another account. Sign in instead.';
  if (code === 'INVALID_CARD_NUMBER') return 'Card number not found. Check the number on your physical card.';
  if (code === 'PHONE_ALREADY_REGISTERED') return 'This phone number is already registered. Please sign in.';
  if (code === 'USER_NOT_FOUND') return 'Account not found. Please register using your RESQID card.';
  if (status === 400) return 'Invalid input. Please check your details.';
  if (status === 500) return 'Server error. Please try again.';

  return ERROR_MESSAGES[error?.status] ?? ERROR_MESSAGES[error?.code] ?? ERROR_MESSAGES.DEFAULT;
};

// ─── Step Indicator (Clean, no animation) ───────────────────────────────────
const StepIndicator = ({ step, total, label }) => (
  <View style={stepS.wrap}>
    <View style={stepS.dots}>
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
    </View>
    <Text style={stepS.label} allowFontScaling={false}>
      {label}
    </Text>
  </View>
);

const stepS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#FF3B30' },
  dotCurrent: { width: 16, borderRadius: 4, backgroundColor: '#FF3B30' },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.5, fontWeight: '500' },
});

// ─── Static Corner Accent (No animation) ────────────────────────────────────
const CornerAccent = ({ position }) => {
  const isTR = position === 'topRight';
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      style={[s.cornerAccent, isTR ? s.cornerTR : s.cornerBL]}
    >
      {isTR ? (
        <>
          <Path d="M36 0 L36 16" stroke="rgba(255,59,48,0.3)" strokeWidth="1.2" />
          <Path d="M36 0 L20 0" stroke="rgba(255,59,48,0.3)" strokeWidth="1.2" />
          <Circle cx="36" cy="0" r="2" fill="rgba(255,59,48,0.4)" />
        </>
      ) : (
        <>
          <Path d="M0 36 L0 20" stroke="rgba(255,59,48,0.25)" strokeWidth="1.2" />
          <Path d="M0 36 L16 36" stroke="rgba(255,59,48,0.25)" strokeWidth="1.2" />
          <Circle cx="0" cy="36" r="2" fill="rgba(255,59,48,0.3)" />
        </>
      )}
    </Svg>
  );
};

// ─── Clean Input Field ──────────────────────────────────────────────────────
function AppInput({
  label, value, onChangeText, placeholder,
  keyboardType, icon, prefix, maxLength, hasError,
  autoCapitalize, monospace,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inpS.wrapper}>
      {label && (
        <Text style={[inpS.label, focused && inpS.labelFocused]} allowFontScaling={false}>
          {label}
        </Text>
      )}

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
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType={keyboardType || 'default'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor="#FF3B30"
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          maxLength={maxLength}
          allowFontScaling={false}
        />
      </View>

      {hasError && (
        <Text style={inpS.errorText} allowFontScaling={false}>
          {hasError}
        </Text>
      )}
    </View>
  );
}

const inpS = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  labelFocused: { color: '#FF3B30' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowFocused: { borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.05)' },
  rowError: { borderColor: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.05)' },
  iconWrap: { marginRight: 12 },
  prefix: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600', marginRight: 8 },
  prefixDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
  field: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  fieldMono: { fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }), letterSpacing: 1, fontSize: 15 },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4, paddingLeft: 4 },
});

// ─── Professional Error Message ─────────────────────────────────────────────
function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <View style={errS.container}>
      <View style={errS.iconWrap}>
        <Feather name="alert-circle" size={16} color="#FF3B30" />
      </View>
      <Text style={errS.text} allowFontScaling={false}>
        {message}
      </Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
        </Pressable>
      )}
    </View>
  );
}

const errS = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, color: '#FF3B30', fontSize: 13, lineHeight: 18 },
});

// ─── Security Note ──────────────────────────────────────────────────────────
function SecurityNote() {
  return (
    <View style={secS.container}>
      <Feather name="shield" size={12} color="rgba(46,204,113,0.6)" />
      <Text style={secS.text} allowFontScaling={false}>
        End-to-end encrypted · Never shared
      </Text>
      <Feather name="check-circle" size={12} color="rgba(46,204,113,0.6)" />
      <Text style={secS.text} allowFontScaling={false}>
        DPDP Act Compliant
      </Text>
    </View>
  );
}

const secS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  text: { color: 'rgba(46,204,113,0.5)', fontSize: 10, fontWeight: '500' },
});

// ─── Card Number Tip ────────────────────────────────────────────────────────
function CardNumberTip() {
  return (
    <View style={tipS.container}>
      <View style={tipS.stripe} />
      <View style={tipS.content}>
        <Feather name="info" size={12} color="rgba(255,255,255,0.4)" />
        <Text style={tipS.text} allowFontScaling={false}>
          Printed on the front of your physical card as{' '}
          <Text style={tipS.code}>RQ-XXXX-XXXXXXXX</Text>
        </Text>
      </View>
    </View>
  );
}

const tipS = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' },
  stripe: { width: 3, backgroundColor: '#FF3B30', opacity: 0.5 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  text: { color: 'rgba(255,255,255,0.4)', fontSize: 11, flex: 1 },
  code: { color: '#FF3B30', fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }), fontSize: 10, fontWeight: '600' },
});

// ─── Loading Overlay ────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <View style={loadS.overlay}>
      <View style={loadS.container}>
        <ActivityIndicator size="small" color="#FF3B30" />
        <Text style={loadS.text}>Sending OTP...</Text>
      </View>
    </View>
  );
}

const loadS = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  container: { backgroundColor: '#1A1A1F', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});

// ─── Main LoginScreen ───────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mode = 'register' } = useLocalSearchParams();
  const isRegister = mode === 'register';

  const [mobile, setMobile] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [dims, setDims] = useState({ w: 390, h: 844 });

  const mobileValid = mobile.length === 10;
  const cardValid = cardNumber.length === 16;
  const canSubmit = isRegister ? mobileValid && cardValid : mobileValid;

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, []);

  const switchMode = useCallback(() => {
    setApiError(null);
    setFieldError(null);
    setMobile('');
    setCardNumber('');
    router.replace({
      pathname: '/(auth)/login',
      params: { mode: isRegister ? 'login' : 'register' },
    });
  }, [isRegister]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    Keyboard.dismiss();
    setApiError(null);
    setFieldError(null);
    setLoading(true);
    hapticLight();

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
            nonce: response.nonce,
            maskedPhone: response.masked_phone,
            cardNumber: cardNumber.trim().toUpperCase(),
          },
        });
      } else {
        await authApi.sendOtp(phone);
        router.push({ pathname: '/(auth)/otp', params: { phone, mode: 'login' } });
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setApiError(errorMsg);

      // Set field-specific errors
      if (errorMsg.includes('card')) setFieldError('card');
      else if (errorMsg.includes('phone') || errorMsg.includes('mobile')) setFieldError('mobile');
      else setFieldError(null);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, mobile, cardNumber, isRegister]);

  return (
    <View
      style={s.root}
      onLayout={(e) => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {loading && <LoadingOverlay />}

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
                paddingTop: insets.top + 20,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top nav */}
            <View style={s.topNav}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Feather name="chevron-left" size={20} color={C.white} />
              </Pressable>

              <StepIndicator step={1} total={2} label="Step 1 of 2" />

              <Pressable
                onPress={switchMode}
                style={({ pressed }) => [s.modePill, pressed && { opacity: 0.7 }]}
              >
                <View style={s.modePillDot} />
                <Text style={s.modePillText}>
                  {isRegister ? 'Sign In' : 'Register'}
                </Text>
              </Pressable>
            </View>

            {/* Header */}
            <View style={s.header}>
              <View style={s.eyebrowRow}>
                <View style={s.eyebrowDash} />
                <Text style={s.eyebrow}>
                  {isRegister ? 'NEW ACCOUNT' : 'SIGN IN'}
                </Text>
                <View style={s.eyebrowDashFade} />
              </View>

              <View style={s.titleWrap}>
                <Text style={s.title}>
                  {isRegister ? 'Link your\n' : 'Welcome\n'}
                  <Text style={s.titleAccent}>
                    {isRegister ? "child's card" : 'back'}
                  </Text>
                </Text>
                <View style={s.titleBracket} />
              </View>

              <Text style={s.subtitle}>
                {isRegister
                  ? 'Register your RESQID card and mobile number to activate emergency identification.'
                  : 'Enter your registered mobile number to receive a verification code.'}
              </Text>
            </View>

            {/* Form Card */}
            <View style={s.formCard}>
              <LinearGradient
                colors={['rgba(255,59,48,0.5)', 'rgba(255,59,48,0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.cardTopBar}
              />

              <CornerAccent position="topRight" />
              <CornerAccent position="bottomLeft" />

              <View style={s.formInner}>
                {isRegister && (
                  <>
                    <AppInput
                      label="Card Number"
                      value={cardNumber}
                      onChangeText={(t) => {
                        setCardNumber(t.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 16));
                        setApiError(null);
                        setFieldError(null);
                      }}
                      placeholder="RQ-0042-XXXXXXXX"
                      icon={<Feather name="credit-card" size={18} color={cardNumber ? '#FF3B30' : 'rgba(255,255,255,0.3)'} />}
                      maxLength={16}
                      hasError={fieldError === 'card' ? apiError : null}
                      autoCapitalize="characters"
                      monospace
                    />
                    <CardNumberTip />
                  </>
                )}

                <AppInput
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={(t) => {
                    setMobile(t.replace(/\D/g, '').slice(0, 10));
                    setApiError(null);
                    setFieldError(null);
                  }}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  icon={<Feather name="phone" size={18} color={mobile ? '#FF3B30' : 'rgba(255,255,255,0.3)'} />}
                  prefix="+91"
                  maxLength={10}
                  hasError={fieldError === 'mobile' ? apiError : null}
                />

                {apiError && !fieldError && (
                  <ErrorMessage message={apiError} onDismiss={() => setApiError(null)} />
                )}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit || loading}
                  style={({ pressed }) => [
                    s.submitWrap,
                    !canSubmit && s.submitDisabled,
                    pressed && canSubmit && { opacity: 0.9 },
                  ]}
                >
                  <LinearGradient
                    colors={canSubmit ? ['#FF3B30', '#DC2B25'] : ['#2A2A2F', '#222227']}
                    style={s.submitBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[s.submitLabel, !canSubmit && s.submitLabelDim]}>
                      {loading ? 'Sending...' : 'Send OTP'}
                    </Text>
                    {canSubmit && !loading && (
                      <View style={s.submitArrow}>
                        <Feather name="arrow-right" size={16} color={C.white} />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>

                <SecurityNote />
              </View>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={s.footerText}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={switchMode} style={({ pressed }) => [s.footerLink, pressed && { opacity: 0.7 }]}>
                <Text style={s.footerLinkText}>
                  {isRegister ? 'Sign In' : 'Get Started'}
                </Text>
                <Feather name="arrow-right" size={12} color="#FF3B30" />
              </Pressable>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Background Grid ─────────────────────────────────────────────────────────
const BackgroundGrid = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFillObject}
    pointerEvents="none"
  >
    {Array.from({ length: 14 }).map((_, i) => (
      <Path
        key={`d-${i}`}
        d={`M${-80 + i * 75} 0 L${i * 75 + 140} ${height}`}
        stroke="rgba(255,255,255,0.01)"
        strokeWidth="1"
      />
    ))}
    {Array.from({ length: 9 }).map((_, i) => (
      <Path
        key={`h-${i}`}
        d={`M0 ${90 + i * 90} L${width} ${90 + i * 90}`}
        stroke="rgba(255,255,255,0.008)"
        strokeWidth="1"
      />
    ))}
    <Path
      d={`M${width - 28} 18 L${width - 18} 18 L${width - 18} 28`}
      stroke="rgba(255,59,48,0.25)"
      strokeWidth="1.2"
      fill="none"
    />
    <Path
      d={`M18 ${height - 28} L18 ${height - 18} L28 ${height - 18}`}
      stroke="rgba(255,59,48,0.2)"
      strokeWidth="1.2"
      fill="none"
    />
    {Array.from({ length: 5 }).map((_, row) =>
      Array.from({ length: 5 }).map((_, col) => (
        <Circle
          key={`tl-${row}-${col}`}
          cx={22 + col * 10}
          cy={110 + row * 10}
          r="0.8"
          fill="rgba(255,255,255,0.06)"
        />
      ))
    )}
    {Array.from({ length: 4 }).map((_, row) =>
      Array.from({ length: 4 }).map((_, col) => (
        <Circle
          key={`br-${row}-${col}`}
          cx={width - 22 + col * 10}
          cy={height - 80 + row * 10}
          r="0.7"
          fill="rgba(255,255,255,0.05)"
        />
      ))
    )}
    <Path
      d={`M6 ${height * 0.22} L6 ${height * 0.52}`}
      stroke="rgba(255,59,48,0.08)"
      strokeWidth="1"
    />
    <Path
      d={`M${width - 6} ${height * 0.3} L${width - 6} ${height * 0.6}`}
      stroke="rgba(255,59,48,0.06)"
      strokeWidth="1"
    />
  </Svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },

  glowTopRight: {
    position: 'absolute', top: -50, right: -70,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#FF3B30', opacity: 0.05,
  },
  glowBottomLeft: {
    position: 'absolute', bottom: 40, left: -90,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#FF3B30', opacity: 0.04,
  },
  glowMidLeft: {
    position: 'absolute', top: '40%', left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#FF3B30', opacity: 0.03,
  },

  scroll: { paddingHorizontal: 20, flexGrow: 1 },

  topNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  modePillText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  header: { marginBottom: 24, gap: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowDash: { width: 20, height: 2, backgroundColor: '#FF3B30', borderRadius: 1 },
  eyebrowDashFade: { width: 12, height: 1, backgroundColor: 'rgba(255,59,48,0.3)', borderRadius: 1 },
  eyebrow: { color: '#FF3B30', fontSize: 10, fontWeight: '800', letterSpacing: 3 },

  titleWrap: { position: 'relative' },
  title: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8, lineHeight: 44 },
  titleAccent: { color: '#FF3B30' },
  titleBracket: { position: 'absolute', left: -8, top: 6, width: 3, height: 30, backgroundColor: '#FF3B30', opacity: 0.5, borderRadius: 2 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 20, maxWidth: 300 },

  formCard: {
    backgroundColor: 'rgba(18, 18, 22, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardTopBar: { height: 2, width: '50%' },
  cornerAccent: { position: 'absolute' },
  cornerTR: { top: 12, right: 12 },
  cornerBL: { bottom: 12, left: 12 },
  formInner: { padding: 20, gap: 20 },

  submitWrap: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitDisabled: { opacity: 0.6 },
  submitBtn: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  submitLabelDim: { color: 'rgba(255,255,255,0.4)' },
  submitArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerLinkText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
});