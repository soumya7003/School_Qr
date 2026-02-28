/**
 * @file app/(auth)/login.jsx
 * @description Authentication / Link Card Screen — SchoolQR Guardian
 *
 * Responsibilities:
 *  - Allow user to manually enter or scan their child's QR card.
 *  - Collect mobile number for OTP verification.
 *  - Handle UI state for segmented controls and input focus.
 *
 * Dependencies (install if missing):
 *   npx expo install react-native-svg react-native-reanimated react-native-safe-area-context
 *
 * babel.config.js must include:
 *   plugins: ['react-native-reanimated/plugin']
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  bg:              '#0D0F14', // Very dark background matching the UI
  surface:         '#181B22', // Input and tab backgrounds
  surfaceLight:    '#252830', // Borders and dividers
  primary:         '#E94033', // Brand Red
  primaryFaded:    'rgba(233, 64, 51, 0.12)', // For the scan area background
  primaryBorder:   'rgba(233, 64, 51, 0.4)',  // For the scan area border
  white:           '#FFFFFF',
  textMuted:       '#8A8F9A',
  textDim:         '#5A5E67',
  focusRing:       '#E94033',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = ({ size = 20, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrCodeBoxIcon = ({ size = 24, color = COLORS.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.8} />
    <Path d="M14 14H21V21H14V14Z" fill={color} />
    <Circle cx="15.5" cy="15.5" r="0.5" fill={COLORS.bg} />
  </Svg>
);

const CreditCardIcon = ({ size = 20, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M2 10H22" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const PhoneIcon = ({ size = 20, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── LinkCardScreen ────────────────────────────────────────────────────────────

export default function LinkCardScreen() {
  const insets = useSafeAreaInsets();
  
  // State
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'scan'
  const [cardNumber, setCardNumber] = useState('SQ-2024-004891');
  const [mobileNumber, setMobileNumber] = useState('');
  
  // Focus State for styling
  const [focusedInput, setFocusedInput] = useState('card'); // 'card' | 'mobile' | null

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSendOtp = useCallback(() => {
    // Navigate to OTP screen
    router.push('/(auth)/otp');
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top + 20, 40) }
          ]}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleBack} 
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeftIcon />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Titles ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)}>
            <Text style={styles.title} allowFontScaling={false}>
              Link your{'\n'}child&apos;s card
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Enter the card number on the back of the QR card, or scan it.
            </Text>
          </Animated.View>

          {/* ── Segmented Control ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                Manual Entry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
              onPress={() => setActiveTab('scan')}
            >
              <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
                Scan QR
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Scan QR Area ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)}>
            <TouchableOpacity activeOpacity={0.7} style={styles.scanArea}>
              <QrCodeBoxIcon />
              <Text style={styles.scanText}>Tap to scan card QR code</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Divider ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or enter manually</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* ── Form Inputs ── */}
          <Animated.View entering={FadeInDown.duration(400).delay(600)} style={styles.formContainer}>
            
            {/* Card Number Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CARD NUMBER</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'card' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIcon}>
                  <CreditCardIcon color={focusedInput === 'card' ? COLORS.textMuted : COLORS.textDim} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Enter card number"
                  placeholderTextColor={COLORS.textDim}
                  onFocus={() => setFocusedInput('card')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardAppearance="dark"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'mobile' && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIcon}>
                  <PhoneIcon color={focusedInput === 'mobile' ? COLORS.textMuted : COLORS.textDim} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="+91 enter mobile number"
                  placeholderTextColor={COLORS.textDim}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput('mobile')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardAppearance="dark"
                />
              </View>
            </View>

          </Animated.View>
        </ScrollView>

        {/* ── Footer Button ── */}
        <Animated.View 
          entering={FadeInDown.duration(500).delay(700)}
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.primaryButton}
            onPress={handleSendOtp}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Send OTP →</Text>
          </TouchableOpacity>
        </Animated.View>
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
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Header
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Typography
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.white,
    letterSpacing: -0.5,
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 22,
    marginBottom: 32,
    paddingRight: 20,
  },

  // Segmented Control
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
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Scan Area
  scanArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryFaded,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 28,
  },
  scanText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  dividerText: {
    color: COLORS.textDim,
    fontSize: 13,
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  // Forms
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    width: '100%',
  },
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
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },

  // Footer Button
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: COLORS.bg, // To prevent scroll underlap visibility issues
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  }
});