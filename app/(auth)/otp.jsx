import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const RESEND_SECONDS = 102; // 01:42

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params?.phone ?? '+91 98765 43210';

  // OTP state
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const hiddenInputRef = useRef(null);

  // Animation refs
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const boxesY = useRef(new Animated.Value(30)).current;
  const boxesOpacity = useRef(new Animated.Value(0)).current;
  const timerOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const resendOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const boxAnims = useRef(
    Array(OTP_LENGTH).fill(null).map(() => new Animated.Value(1))
  ).current;
  const btnPressAnim = useRef(new Animated.Value(1)).current;

  // ── Entrance Animations ──
  useEffect(() => {
    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.9, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(boxesOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(boxesY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.timing(timerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(btnY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.timing(resendOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Countdown Timer ──
  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Box pop animation on digit entry ──
  const animateBox = useCallback((index) => {
    Animated.sequence([
      Animated.timing(boxAnims[index], { toValue: 1.18, duration: 80, useNativeDriver: true }),
      Animated.spring(boxAnims[index], { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [boxAnims]);

  // ── Shake on error ──
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Handle OTP input via hidden TextInput ──
  const handleChangeText = (text) => {
    setError('');
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH).split('');
    const newOtp = Array(OTP_LENGTH).fill('');
    digits.forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    setActiveIndex(Math.min(digits.length, OTP_LENGTH - 1));
    // Animate last filled box
    if (digits.length > 0) animateBox(digits.length - 1);
  };

  const focusInput = () => hiddenInputRef.current?.focus();

  // ── Verify ──
  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits');
      shake();
      return;
    }
    Animated.sequence([
      Animated.timing(btnPressAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(btnPressAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
    ]).start();
    Keyboard.dismiss();
    setVerified(true);
    setTimeout(() => router.replace('/(app)/home'), 900);
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(RESEND_SECONDS);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    setActiveIndex(0);
    setError('');
    hiddenInputRef.current?.clear();
    focusInput();
  };

  const filledCount = otp.filter(Boolean).length;
  const isComplete = filledCount === OTP_LENGTH;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0B" />
      <LinearGradient colors={['#0A0A0B', '#0F0F13', '#0A0A0B']} style={StyleSheet.absoluteFill} />

      {/* Ambient top glow */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowPulse }]} />

      <SafeAreaView style={styles.safe}>

        {/* Hidden input to capture keyboard */}
        <TextInput
          ref={hiddenInputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          onChangeText={handleChangeText}
          value={otp.join('')}
          autoFocus
          caretHidden
        />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#A0A0B0" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.inner}>

          {/* ── Phone Icon ── */}
          <Animated.View
            style={[
              styles.iconSection,
              { transform: [{ scale: iconScale }, { translateY: floatAnim }], opacity: iconOpacity },
            ]}
          >
            <Animated.View style={[styles.iconGlow, { opacity: glowPulse }]} />
            <LinearGradient
              colors={['#1E1E26', '#151519']}
              style={styles.iconBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="call" size={36} color="#E8312A" />
            </LinearGradient>
          </Animated.View>

          {/* ── Title & Subtitle ── */}
          <Animated.View
            style={[styles.titleSection, { transform: [{ translateY: titleY }], opacity: titleOpacity }]}
          >
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
            <Text style={styles.phone}>{phone}</Text>
          </Animated.View>

          {/* ── OTP Boxes ── */}
          <Animated.View
            style={[
              styles.otpSection,
              { transform: [{ translateY: boxesY }, { translateX: shakeAnim }], opacity: boxesOpacity },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={focusInput} style={styles.otpRow}>
              {Array(OTP_LENGTH).fill(null).map((_, i) => {
                const isFilled = !!otp[i];
                const isActive = i === filledCount && !isComplete;
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.otpBox,
                      isFilled && styles.otpBoxFilled,
                      isActive && styles.otpBoxActive,
                      error && styles.otpBoxError,
                      { transform: [{ scale: boxAnims[i] }] },
                    ]}
                  >
                    {isFilled ? (
                      <Text style={styles.otpDigit}>{otp[i]}</Text>
                    ) : (
                      isActive && <View style={styles.cursor} />
                    )}
                  </Animated.View>
                );
              })}
            </TouchableOpacity>

            {/* Error */}
            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </Animated.View>

          {/* ── Timer ── */}
          <Animated.View style={[styles.timerRow, { opacity: timerOpacity }]}>
            <View style={[styles.timerDot, canResend && styles.timerDotGreen]} />
            <Text style={styles.timerText}>
              {canResend ? 'You can resend now' : `Resend code in ${formatTime(timer)}`}
            </Text>
          </Animated.View>

          {/* ── Verify Button ── */}
          <Animated.View
            style={[
              styles.btnWrap,
              { transform: [{ translateY: btnY }, { scale: btnPressAnim }], opacity: btnOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleVerify}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={isComplete ? ['#EF3D35', '#C8241D'] : ['#3A2020', '#2E1A1A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btnGradient}
              >
                {verified ? (
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                ) : (
                  <Text style={[styles.btnText, !isComplete && styles.btnTextDim]}>
                    Verify & Continue →
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Resend ── */}
          <Animated.View style={[styles.resendRow, { opacity: resendOpacity }]}>
            <Text style={styles.resendStatic}>Didn't receive? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend} activeOpacity={0.7}>
              <Text style={[styles.resendLink, !canResend && styles.resendLinkDim]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const BOX_SIZE = (width - 56 - 5 * 10) / 6;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  safe: {
    flex: 1,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: width,
    height: 300,
    borderRadius: width / 2,
    backgroundColor: 'transparent',
    shadowColor: '#E8312A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
  },

  // Back
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#A0A0B0',
    fontSize: 15,
    fontWeight: '400',
  },

  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 28,
  },

  // Icon
  iconSection: {
    alignItems: 'flex-start',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
    shadowColor: '#E8312A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,49,42,0.18)',
  },

  // Title
  titleSection: {
    gap: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F2F2F5',
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B6B7A',
    fontWeight: '300',
  },
  phone: {
    fontSize: 16,
    color: '#F2F2F5',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // OTP
  otpSection: {
    gap: 12,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE + 6,
    borderRadius: 12,
    backgroundColor: '#18181E',
    borderWidth: 1.5,
    borderColor: '#2A2A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#E8312A',
    backgroundColor: 'rgba(232,49,42,0.07)',
  },
  otpBoxActive: {
    borderColor: 'rgba(232,49,42,0.5)',
    backgroundColor: '#1A1820',
  },
  otpBoxError: {
    borderColor: '#FF6B6B',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F2F5',
    letterSpacing: 0,
  },
  cursor: {
    width: 2,
    height: 22,
    backgroundColor: '#E8312A',
    borderRadius: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
  },

  // Timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  timerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E8312A',
  },
  timerDotGreen: {
    backgroundColor: '#22C55E',
  },
  timerText: {
    fontSize: 13,
    color: '#8888A0',
    fontWeight: '400',
  },

  // Button
  btnWrap: {
    shadowColor: '#E8312A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  btnPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnTextDim: {
    color: 'rgba(255,255,255,0.35)',
  },

  // Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendStatic: {
    fontSize: 14,
    color: '#6B6B7A',
    fontWeight: '300',
  },
  resendLink: {
    fontSize: 14,
    color: '#E8312A',
    fontWeight: '700',
  },
  resendLinkDim: {
    color: 'rgba(232,49,42,0.4)',
  },
});