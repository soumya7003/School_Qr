// src/components/auth/SequentialLockGate.jsx
import { authenticate } from '@/services/biometricService';
import { clearPin, verifyPin } from '@/services/pinService';
import { useBiometricStore } from '@/store/biometricStore';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PinPad from './PinPad';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function SequentialLockGate() {
  const { isLocked, isBiometricEnabled, setLocked, hasPinSetup } = useBiometricStore();
  const [stage, setStage] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(LOCKOUT_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [biometricActive, setBiometricActive] = useState(false);

  // ✅ FIX 3: Determine the correct starting stage based on what's enabled
  useEffect(() => {
    if (!isLocked) return;

    if (hasPinSetup) {
      // Has PIN → start with PIN (biometric follows after if enabled)
      setStage('pin');
      setPin('');
      setErrorMsg('');
      setAttempts(0);
      setLockedOut(false);
      setVerifying(false);
      setBiometricActive(false);
    } else if (isBiometricEnabled) {
      // ✅ FIX 3: Biometric only (no PIN) → go straight to biometric stage
      setStage('biometric');
      setPin('');
      setErrorMsg('');
      setBiometricActive(false);
      // Auto-trigger after a short delay
      setTimeout(() => triggerBiometricRef.current?.(), 300);
    } else {
      // Neither enabled — should not happen, but unlock safely
      setLocked(false);
    }
  }, [isLocked, hasPinSetup, isBiometricEnabled, setLocked]);

  // Lockout countdown
  useEffect(() => {
    if (!lockedOut) return;
    setLockoutSecs(LOCKOUT_SECONDS);
    const interval = setInterval(() => {
      setLockoutSecs((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setLockedOut(false);
          setAttempts(0);
          setPin('');
          setErrorMsg('');
          return LOCKOUT_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedOut]);

  // Auto-verify PIN when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && stage === 'pin' && !verifying && !lockedOut) {
      handleVerifyPin();
    }
  }, [pin, stage, verifying, lockedOut]);

  const handleVerifyPin = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const correct = await verifyPin(pin);
      if (correct) {
        if (isBiometricEnabled) {
          setStage('biometric');
          setPin('');
          setErrorMsg('');
          setAttempts(0);
          setTimeout(() => triggerBiometric(), 300);
        } else {
          setLocked(false);
          setStage(null);
        }
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedOut(true);
          setErrorMsg(`Too many attempts. Try again in ${LOCKOUT_SECONDS}s.`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setErrorMsg(remaining === 1
            ? 'Incorrect PIN — 1 attempt left before lockout.'
            : `Incorrect PIN — ${remaining} attempts left.`);
        }
        setPin('');
        setTimeout(() => setErrorMsg(''), 800);
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setPin('');
      setTimeout(() => setErrorMsg(''), 800);
    } finally {
      setVerifying(false);
    }
  }, [pin, verifying, attempts, isBiometricEnabled, setLocked]);

  const triggerBiometric = useCallback(async () => {
    if (biometricActive) return;
    setBiometricActive(true);
    try {
      const result = await authenticate({
        promptMessage: 'Confirm your identity with biometrics',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setLocked(false);
        setStage(null);
      } else {
        // ✅ FIX 3: If no PIN exists, stay on biometric stage (don't fall back to PIN)
        if (hasPinSetup) {
          setStage('pin');
          setErrorMsg('Biometric failed. Enter your PIN again.');
        } else {
          setStage('biometric');
          setErrorMsg('Biometric failed. Tap to try again.');
        }
        setPin('');
        setTimeout(() => setErrorMsg(''), 1500);
      }
    } catch {
      if (hasPinSetup) {
        setStage('pin');
        setErrorMsg('Biometric error. Enter your PIN.');
      } else {
        setStage('biometric');
        setErrorMsg('Biometric error. Tap to try again.');
      }
      setPin('');
      setTimeout(() => setErrorMsg(''), 1500);
    } finally {
      setBiometricActive(false);
    }
  }, [biometricActive, setLocked, hasPinSetup]);

  // ✅ Keep a stable ref for the initial auto-trigger in useEffect
  const triggerBiometricRef = useCallback(() => triggerBiometric(), [triggerBiometric]);

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot your PIN?',
      'To reset your PIN, you need to log out and log back in with your phone number and OTP.\n\nThis will keep all your saved data on the server — only the PIN lock will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out & Reset',
          style: 'destructive',
          onPress: async () => {
            await clearPin();
            const { useAuthStore } = await import('@/features/auth/auth.store');
            useAuthStore.getState().logout();
          },
        },
      ]
    );
  };

  if (!isLocked) return null;

  // ── PIN stage ──────────────────────────────────────────────────────────────
  if (stage === 'pin') {
    return (
      <View style={styles.overlay}>
        <View style={styles.brandArea}>
          <View style={styles.iconCircle}><Ionicons name="keypad" size={34} color="#fff" /></View>
          <Text style={styles.appName}>RESQID</Text>
          <Text style={styles.subtitle}>Enter your App PIN to continue</Text>
        </View>
        <View style={styles.pinArea}>
          {lockedOut ? (
            <View style={styles.lockoutBox}>
              <Ionicons name="time-outline" size={32} color="#ff6b6b" />
              <Text style={styles.lockoutTitle}>Too many attempts</Text>
              <Text style={styles.lockoutTimer}>Try again in {lockoutSecs}s</Text>
            </View>
          ) : (
            <>
              <PinPad pin={pin} onPinChange={setPin} hasError={!!errorMsg} disabled={verifying} />
              {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
            </>
          )}
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleForgotPin} style={styles.forgotBtn}>
            <Ionicons name="help-circle-outline" size={15} color="#555" />
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#555" />
            <Text style={styles.securityText}>Protected by App PIN</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Biometric stage ────────────────────────────────────────────────────────
  if (stage === 'biometric') {
    return (
      <View style={styles.overlay}>
        <View style={styles.brandArea}>
          <View style={styles.iconCircle}><Ionicons name="finger-print" size={34} color="#fff" /></View>
          <Text style={styles.appName}>RESQID</Text>
          <Text style={styles.subtitle}>Confirm with biometrics</Text>
        </View>
        <View style={styles.scanArea}>
          {biometricActive ? (
            <>
              <ActivityIndicator size="large" color="#4f8ef7" />
              <Text style={styles.scanningText}>Scanning biometric…</Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.fingerprintButton, !!errorMsg && styles.fingerprintButtonError]}
                onPress={triggerBiometric}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={errorMsg ? 'finger-print-outline' : 'finger-print'}
                  size={52}
                  color={errorMsg ? '#ff6b6b' : '#4f8ef7'}
                />
              </TouchableOpacity>
              <Text style={styles.tapText}>
                {errorMsg ? errorMsg : 'Tap to scan your biometric'}
              </Text>
            </>
          )}
          {/* Only show "Use PIN" fallback if PIN is actually set up */}
          {hasPinSetup && !biometricActive && (
            <TouchableOpacity onPress={() => setStage('pin')} style={styles.backToPin}>
              <Text style={styles.backToPinText}>Use PIN instead</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0d0d14', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: 32, zIndex: 9999, elevation: 9999 },
  brandArea: { alignItems: 'center', gap: 12 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a1a2e', borderWidth: 1.5, borderColor: '#2a2a4a', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  pinArea: { alignItems: 'center', gap: 20, width: '100%' },
  errorText: { fontSize: 13, color: '#ff6b6b', textAlign: 'center', marginTop: 4 },
  lockoutBox: { alignItems: 'center', gap: 10, backgroundColor: '#1a1015', borderRadius: 16, borderWidth: 1, borderColor: '#ff6b6b30', padding: 24, width: '100%' },
  lockoutTitle: { fontSize: 16, fontWeight: '700', color: '#ff6b6b' },
  lockoutTimer: { fontSize: 28, fontWeight: '800', color: '#ff6b6b', fontVariant: ['tabular-nums'] },
  footer: { alignItems: 'center', gap: 10 },
  forgotBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 16 },
  forgotText: { fontSize: 14, color: '#555', fontWeight: '600' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  securityText: { fontSize: 12, color: '#555' },
  scanArea: { alignItems: 'center', gap: 20 },
  scanningText: { fontSize: 15, color: '#4f8ef7' },
  fingerprintButton: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#4f8ef730', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f8ef7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  fingerprintButtonError: { borderColor: '#ff6b6b30', shadowColor: '#ff6b6b' },
  tapText: { fontSize: 15, color: '#aaa', textAlign: 'center', letterSpacing: 0.2 },
  backToPin: { marginTop: 20, padding: 10 },
  backToPinText: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },
});