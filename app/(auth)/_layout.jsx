import { Stack } from 'expo-router';

<<<<<<< HEAD
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

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0D0D0F',
  bgDeep: '#120909',
  surface: '#161619',
  surfaceHover: '#1C1C1F',
  red: '#FF3B30',
  redDark: '#C8211A',
  redSubtle: 'rgba(255,59,48,0.12)',
  redBorder: 'rgba(255,59,48,0.35)',
  white: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.42)',
  textDim: 'rgba(255,255,255,0.22)',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.10)',
  inputBorderFocus: 'rgba(255,59,48,0.55)',
  inputBg: 'rgba(255,255,255,0.05)',
  tabInactive: 'rgba(255,255,255,0.07)',
  tabInactiveTxt: 'rgba(255,255,255,0.45)',
  divider: 'rgba(255,255,255,0.09)',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = ({ color = COLORS.white, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12l7-7M5 12l7 7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CardIcon = ({ color = COLORS.textMuted }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.8" />
  </Svg>
);

const PhoneIcon = ({ color = COLORS.textMuted }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.08 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrIcon = ({ color = COLORS.red, size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Path d="M14 14h2v2h-2zM18 14h3M18 18v3M14 18h2v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

// ─── Animated Tab ──────────────────────────────────────────────────────────────

const SegmentedTab = ({ activeTab, onTabChange }) => {
  return (
    <View style={tabStyles.container}>
      {['Manual Entry', 'Scan QR'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.75}
          >
            {isActive ? (
              <LinearGradient
                colors={[COLORS.red, COLORS.redDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tabStyles.tabGradient}
              >
                <Text style={tabStyles.tabLabelActive}>{tab}</Text>
              </LinearGradient>
            ) : (
              <Text style={tabStyles.tabLabelInactive}>{tab}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabInactive,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  tab: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
  },
  tabActive: {
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tabGradient: {
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelInactive: {
    color: COLORS.tabInactiveTxt,
    fontSize: 14.5,
    fontWeight: '600',
    paddingVertical: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

// ─── AnimatedInput ─────────────────────────────────────────────────────────────

const AnimatedInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  icon,
  prefix,
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const borderOpacity = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: focused ? COLORS.inputBorderFocus : COLORS.inputBorder,
  }));

  return (
    <View style={[inputStyles.wrapper, style]}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.container, borderStyle]}>
        {icon && <View style={inputStyles.iconWrap}>{icon}</View>}
        {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}
        {prefix && <View style={inputStyles.prefixDivider} />}
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDim}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={COLORS.red}
          cursorColor={COLORS.red}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Animated.View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 13,
    borderWidth: 1.2,
    paddingHorizontal: 15,
    height: 54,
  },
  iconWrap: {
    marginRight: 11,
  },
  prefix: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 4,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.inputBorder,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

// ─── ScanQRBox ─────────────────────────────────────────────────────────────────

const ScanQRBox = ({ onPress }) => (
  <TouchableOpacity
    style={scanStyles.box}
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel="Tap to scan QR code"
  >
    <View style={scanStyles.content}>
      <QrIcon size={28} />
      <Text style={scanStyles.label}>Tap to scan card QR code</Text>
    </View>
  </TouchableOpacity>
);

const scanStyles = StyleSheet.create({
  box: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.redBorder,
    borderStyle: 'dashed',
    backgroundColor: COLORS.redSubtle,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

// ─── Divider ───────────────────────────────────────────────────────────────────

const OrDivider = () => (
  <View style={dividerStyles.row}>
    <View style={dividerStyles.line} />
    <Text style={dividerStyles.text}>or enter manually</Text>
    <View style={dividerStyles.line} />
  </View>
);

const dividerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  text: {
    color: COLORS.textDim,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
});

// ─── LoginScreen ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { mode = 'register' } = useLocalSearchParams();

  const isRegister = mode === 'register';

  const [activeTab, setActiveTab] = useState('Manual Entry');
  const [cardNumber, setCardNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (loading) return;

    buttonScale.value = withSequence(
      withTiming(0.96, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1.00, { duration: 120, easing: Easing.out(Easing.back(2)) })
    );

    setLoading(true);
    // TODO: connect to auth.api.js
    setTimeout(() => {
      setLoading(false);
      router.push('/(auth)/otp');
    }, 1200);
  }, [loading]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const canSubmit = isRegister
    ? cardNumber.trim().length > 0 && mobileNumber.trim().length === 10
    : mobileNumber.trim().length === 10;

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={[COLORS.bg, COLORS.bgDeep, COLORS.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Ambient glow */}
      <View style={styles.glowWrap} pointerEvents="none">
        <View style={styles.glowOuter} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 28) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* Back button */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.backRow}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ArrowLeftIcon size={18} />
                <Text style={styles.backLabel}>Back</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(80)}
              style={styles.header}
            >
              <Text style={styles.title} allowFontScaling={false}>
                {isRegister ? 'Link your\nchild\'s card' : 'Welcome\nback'}
              </Text>
              <Text style={styles.subtitle} allowFontScaling={false}>
                {isRegister
                  ? 'Enter the card number on the back of the QR card, or scan it.'
                  : 'Enter your registered mobile number to continue.'}
              </Text>
            </Animated.View>

            {/* Form card */}
            <Animated.View
              entering={FadeInDown.duration(520).delay(200)}
              style={styles.formCard}
            >
              {/* Segmented tabs — only for register */}
              {isRegister && (
                <SegmentedTab activeTab={activeTab} onTabChange={setActiveTab} />
              )}

              {/* Scan QR Box — visible when Scan QR tab active */}
              {isRegister && (
                <View style={styles.scanSection}>
                  <ScanQRBox onPress={() => { }} />
                  <OrDivider />
                </View>
              )}

              {/* Card Number — only for register */}
              {isRegister && (
                <AnimatedInput
                  label="Card Number"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="SQ-2024-000000"
                  keyboardType="default"
                  icon={<CardIcon color={cardNumber ? COLORS.red : COLORS.textMuted} />}
                />
              )}

              {/* Mobile Number */}
              <AnimatedInput
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={(t) => setMobileNumber(t.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="enter mobile number"
                keyboardType="phone-pad"
                icon={<PhoneIcon color={mobileNumber ? COLORS.red : COLORS.textMuted} />}
                prefix="+91"
                style={isRegister ? { marginTop: 4 } : undefined}
              />

              {/* Submit button */}
              <Animated.View style={[styles.buttonWrap, buttonAnimStyle]}>
                <TouchableOpacity
                  activeOpacity={canSubmit ? 0.82 : 0.5}
                  onPress={canSubmit ? handleSubmit : undefined}
                  accessibilityRole="button"
                  accessibilityLabel="Send OTP"
                  style={[styles.submitWrapper, !canSubmit && { opacity: 0.5 }]}
                >
                  <LinearGradient
                    colors={canSubmit ? [COLORS.red, COLORS.redDark] : ['#444', '#333']}
                    style={styles.submitButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.submitLabel}>
                      {loading ? 'Sending…' : 'Send OTP →'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Footer link */}
            <Animated.View
              entering={FadeInDown.duration(480).delay(380)}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
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
                <Text style={styles.footerLink}>
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

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  glowWrap: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
  },
  glowOuter: {
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: COLORS.red,
    opacity: 0.045,
  },
  scroll: {
    paddingHorizontal: 22,
    flexGrow: 1,
  },

  // Back
  backRow: {
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backLabel: {
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.15,
  },

  // Header
  header: {
    marginBottom: 28,
    gap: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.white,
    letterSpacing: -0.6,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 14.5,
    color: COLORS.textMuted,
    lineHeight: 22,
    letterSpacing: 0.1,
    maxWidth: 320,
  },

  // Form card
  formCard: {
    gap: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  // Scan section
  scanSection: {
    gap: 18,
  },

  // Submit
  buttonWrap: {
    marginTop: 6,
  },
  submitWrapper: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  submitButton: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  submitLabel: {
    color: COLORS.white,
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 4,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
=======
export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    );
}
>>>>>>> 7c470c7de28093f0d421369b27e5a56c98e15ee1
