// src/components/auth/PinSetupModal.jsx
/**
 * PinSetupModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen modal that guides the user through creating a 4-digit App PIN.
 *
 * Steps:
 *   0 — Info/explanation screen  (matches the UX copy from the spec)
 *   1 — Enter new PIN
 *   2 — Confirm new PIN
 *   3 — Success
 *
 * Props:
 *   visible      {boolean}  show/hide the modal
 *   onSuccess    {fn}       called after PIN is saved successfully
 *   onCancel     {fn}       called if user cancels (pass null to hide Cancel)
 *   isChanging   {boolean}  true when user is changing an existing PIN (shows
 *                           "Change PIN" copy instead of "Set up PIN")
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { savePin } from '@/services/pinService';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PinPad from './PinPad';

const TOTAL_STEPS = 4; // info, enter, confirm, success

export default function PinSetupModal({
  visible,
  onSuccess,
  onCancel,
  isChanging = false,
}) {
  const [step, setStep] = useState(0);       // 0=info, 1=enter, 2=confirm, 3=success
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      setStep(0);
      setNewPin('');
      setConfirmPin('');
      setHasError(false);
      setErrorMsg('');
      setSaving(false);
    }
  }, [visible]);

  // Auto-advance when PIN reaches 4 digits
  useEffect(() => {
    if (step === 1 && newPin.length === 4) {
      transitionTo(2);
    }
  }, [newPin, step]);

  useEffect(() => {
    if (step === 2 && confirmPin.length === 4) {
      handleConfirm();
    }
  }, [confirmPin, step]);

  const transitionTo = (next) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      setHasError(false);
      setErrorMsg('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleConfirm = useCallback(async () => {
    if (confirmPin !== newPin) {
      setHasError(true);
      setErrorMsg('PINs do not match. Please try again.');
      // Reset confirm after short delay
      setTimeout(() => {
        setConfirmPin('');
        setHasError(false);
        setErrorMsg('');
      }, 800);
      return;
    }

    setSaving(true);
    try {
      await savePin(newPin);
      transitionTo(3);
    } catch (err) {
      setHasError(true);
      setErrorMsg('Could not save PIN. Please try again.');
      setConfirmPin('');
    } finally {
      setSaving(false);
    }
  }, [confirmPin, newPin]);

  const handleSuccess = () => {
    onSuccess?.();
  };

  const title = isChanging ? 'Change App PIN' : 'Set your App Lock PIN';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel ?? undefined}>
      <View style={styles.screen}>
        {/* ── Header ── */}
        <View style={styles.header}>
          {step === 0 && onCancel ? (
            <TouchableOpacity style={styles.headerBtn} onPress={onCancel}>
              <Ionicons name="close" size={22} color="#aaa" />
            </TouchableOpacity>
          ) : step > 0 && step < 3 ? (
            <TouchableOpacity style={styles.headerBtn} onPress={() => transitionTo(step - 1)}>
              <Ionicons name="arrow-back" size={22} color="#aaa" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* ── Step dots (steps 1-2 only) ── */}
        {step > 0 && step < 3 && (
          <View style={styles.stepDots}>
            {[1, 2].map((s) => (
              <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
            ))}
          </View>
        )}

        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* STEP 0 — Info / explanation                                      */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 0 && (
            <ScrollView
              contentContainerStyle={styles.infoScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon */}
              <View style={styles.iconCircle}>
                <Ionicons name="keypad-outline" size={48} color="#4f8ef7" />
              </View>

              <Text style={styles.infoTitle}>
                {isChanging
                  ? 'Update your App PIN'
                  : 'Your phone doesn\'t support biometrics'}
              </Text>

              <Text style={styles.infoBody}>
                {isChanging
                  ? 'You can update your 4-digit App PIN at any time. This PIN is separate from your phone\'s screen lock and is only used for this app.'
                  : 'Your phone does not support fingerprint or face unlock. To keep your account safe, you need to create a private 4-digit PIN just for this app.'}
              </Text>

              {/* How it works */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>How it works</Text>
                {[
                  { icon: 'lock-closed-outline', text: 'You will enter this PIN every time you open the app.' },
                  { icon: 'shield-checkmark-outline', text: 'Your PIN is encrypted and stored only on your device. We never see or save it.' },
                  { icon: 'phone-portrait-outline', text: 'It works like a personal lock code — only you know it.' },
                ].map((item, i) => (
                  <View key={i} style={styles.infoRow}>
                    <Ionicons name={item.icon} size={18} color="#4f8ef7" />
                    <Text style={styles.infoRowText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* FAQ */}
              <View style={styles.faqCard}>
                <View style={styles.faqItem}>
                  <Text style={styles.faqQ}>What if I forget my PIN?</Text>
                  <Text style={styles.faqA}>
                    You can reset it by logging out and logging back in with your phone number & OTP.
                  </Text>
                </View>
                <View style={[styles.faqItem, { borderTopWidth: 1, borderTopColor: '#1e1e30', paddingTop: 12 }]}>
                  <Text style={styles.faqQ}>Can I change it later?</Text>
                  <Text style={styles.faqA}>
                    Yes — go to Settings → Security → Change App PIN anytime.
                  </Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => transitionTo(1)}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBtnText}>
                  {isChanging ? 'Update PIN' : 'Continue — Create my PIN'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              {onCancel && (
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* STEP 1 — Enter new PIN                                           */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.pinStep}>
              <Ionicons name="keypad" size={36} color="#4f8ef7" style={{ marginBottom: 8 }} />
              <Text style={styles.pinStepTitle}>Create your PIN</Text>
              <Text style={styles.pinStepSub}>Choose a 4-digit PIN only you know.</Text>
              <PinPad
                pin={newPin}
                onPinChange={setNewPin}
                disabled={false}
              />
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* STEP 2 — Confirm PIN                                             */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.pinStep}>
              <Ionicons name="checkmark-circle-outline" size={36} color="#4f8ef7" style={{ marginBottom: 8 }} />
              <Text style={styles.pinStepTitle}>Confirm your PIN</Text>
              <Text style={styles.pinStepSub}>Enter the same PIN again to confirm.</Text>

              {saving ? (
                <ActivityIndicator size="large" color="#4f8ef7" style={{ marginTop: 40 }} />
              ) : (
                <PinPad
                  pin={confirmPin}
                  onPinChange={setConfirmPin}
                  hasError={hasError}
                  disabled={saving}
                />
              )}

              {!!errorMsg && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
          {/* STEP 3 — Success                                                 */}
          {/* ──────────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.successStep}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={52} color="#22c55e" />
              </View>
              <Text style={styles.successTitle}>PIN Created!</Text>
              <Text style={styles.successBody}>
                {isChanging
                  ? 'Your App PIN has been updated successfully.'
                  : 'Your App PIN is set. Every time you open RESQID after leaving, you\'ll be asked to enter it.'}
              </Text>
              <View style={styles.successTip}>
                <Ionicons name="information-circle-outline" size={16} color="#4f8ef7" />
                <Text style={styles.successTipText}>
                  To change or remove your PIN later, go to{' '}
                  <Text style={{ fontWeight: '700' }}>Settings → Security</Text>.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={handleSuccess}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBtnText}>Done</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0d14',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Step dots ──
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2a2a4a',
  },
  stepDotActive: {
    backgroundColor: '#4f8ef7',
  },

  body: {
    flex: 1,
  },

  // ── Step 0: Info ──
  infoScroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  infoBody: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 21,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#13131f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e30',
    padding: 16,
    gap: 14,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoRowText: {
    fontSize: 13.5,
    color: '#ccc',
    lineHeight: 20,
    flex: 1,
  },
  faqCard: {
    width: '100%',
    backgroundColor: '#13131f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e30',
    padding: 16,
    gap: 12,
  },
  faqItem: { gap: 4 },
  faqQ: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f8ef7',
  },
  faqA: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 19,
  },
  ctaBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4f8ef7',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },

  // ── Steps 1 & 2: PIN entry ──
  pinStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    marginTop: -40, // optical centering
  },
  pinStepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pinStepSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Step 3: Success ──
  successStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    marginTop: -40,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0f2e1a',
    borderWidth: 2,
    borderColor: '#22c55e40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  successBody: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 21,
  },
  successTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#13131f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e1e30',
    padding: 12,
    width: '100%',
  },
  successTipText: {
    fontSize: 12.5,
    color: '#aaa',
    flex: 1,
    lineHeight: 18,
  },
});