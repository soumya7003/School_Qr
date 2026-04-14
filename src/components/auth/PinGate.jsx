
// src/components/auth/PinGate.jsx
/**
 * PinGate
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen overlay shown when the app is locked and the lock method is PIN.
 *
 * Matches the same overlay pattern as BiometricGate — pure overlay, no children,
 * placed as a sibling after <Stack> in _layout.jsx.
 *
 * Returns null unless:
 *   isPinEnabled = true
 *   isLocked     = true
 *
 * "Forgot PIN?" → shows confirmation alert → calls logout (clears PIN too).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useAuthStore } from '@/features/auth/auth.store';
import { clearPin, verifyPin } from '@/services/pinService';
import { useBiometricStore } from '@/store/biometricStore';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PinPad from './PinPad';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function PinGate() {
  const { isLocked, isPinEnabled, setLocked } = useBiometricStore();
  const logout = useAuthStore((s) => s.logout);

  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(LOCKOUT_SECONDS);

  // Reset state every time gate appears
  useEffect(() => {
    if (isLocked && isPinEnabled) {
      setPin('');
      setHasError(false);
      setErrorMsg('');
      setVerifying(false);
    }
  }, [isLocked, isPinEnabled]);

  // Lockout countdown timer
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

  // Auto-verify when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4 && !verifying && !lockedOut) {
      handleVerify();
    }
  }, [pin, verifying, lockedOut]);

  const handleVerify = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);

    try {
      const correct = await verifyPin(pin);
      if (correct) {
        setLocked(false);
        setAttempts(0);
        setPin('');
        setErrorMsg('');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setHasError(true);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedOut(true);
          setErrorMsg(`Too many attempts. Try again in ${LOCKOUT_SECONDS}s.`);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setErrorMsg(
            remaining === 1
              ? 'Incorrect PIN — 1 attempt left before lockout.'
              : `Incorrect PIN — ${remaining} attempts left.`
          );
        }

        // Reset after showing error
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 600);
      }
    } catch {
      setHasError(true);
      setErrorMsg('Something went wrong. Please try again.');
      setTimeout(() => { setPin(''); setHasError(false); }, 600);
    } finally {
      setVerifying(false);
    }
  }, [pin, verifying, attempts, setLocked]);

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
            await logout();
          },
        },
      ]
    );
  };

  // ── Guard ──
  if (!isPinEnabled || !isLocked) return null;

  // ── Overlay ──
  return (
    <View style={styles.overlay}>
      {/* Brand */}
      <View style={styles.brandArea}>
        <View style={styles.iconCircle}>
          <Ionicons name="keypad" size={34} color="#fff" />
        </View>
        <Text style={styles.appName}>RESQID</Text>
        <Text style={styles.subtitle}>Enter your App PIN to continue</Text>
      </View>

      {/* PIN entry area */}
      <View style={styles.pinArea}>
        {lockedOut ? (
          <View style={styles.lockoutBox}>
            <Ionicons name="time-outline" size={32} color="#ff6b6b" />
            <Text style={styles.lockoutTitle}>Too many attempts</Text>
            <Text style={styles.lockoutTimer}>Try again in {lockoutSecs}s</Text>
          </View>
        ) : (
          <>
            <PinPad
              pin={pin}
              onPinChange={setPin}
              hasError={hasError}
              disabled={verifying || lockedOut}
            />
            {!!errorMsg && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}
          </>
        )}
      </View>

      {/* Footer */}
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d0d14',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
    zIndex: 9999,
    elevation: 9999,
  },

  // ── Brand ──
  brandArea: { alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── PIN area ──
  pinArea: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Lockout ──
  lockoutBox: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1015',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff6b6b30',
    padding: 24,
    width: '100%',
  },
  lockoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  lockoutTimer: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6b6b',
    fontVariant: ['tabular-nums'],
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityText: {
    fontSize: 12,
    color: '#555',
    letterSpacing: 0.2,
  },
});