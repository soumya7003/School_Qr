// src/components/auth/PinPad.jsx
/**
 * PinPad
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable 4-digit PIN entry component.
 *
 * Props:
 *   pin          {string}   current PIN string (e.g. "123")
 *   onPinChange  {fn}       called with updated PIN string on every key press
 *   maxLength    {number}   defaults to 4
 *   disabled     {boolean}  grays out and ignores input (e.g. while verifying)
 *   hasError     {boolean}  briefly turns dots red (shake animation)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

export default function PinPad({
  pin = '',
  onPinChange,
  maxLength = 4,
  disabled = false,
  hasError = false,
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake + red flash when hasError flips to true
  useEffect(() => {
    if (!hasError) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [hasError]);

  const handleKey = (key) => {
    if (disabled) return;
    if (key === 'del') {
      onPinChange(pin.slice(0, -1));
    } else if (key === '') {
      // empty slot — no-op
    } else if (pin.length < maxLength) {
      onPinChange(pin + key);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── PIN dots ── */}
      <Animated.View
        style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              hasError && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      {/* ── Keypad grid ── */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.keyPlaceholder} />;
              }
              return (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, disabled && styles.keyDisabled]}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.5}
                  disabled={disabled}
                >
                  {key === 'del' ? (
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={disabled ? '#444' : '#aaa'}
                    />
                  ) : (
                    <Text style={[styles.keyText, disabled && styles.keyTextDisabled]}>
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 32,
  },

  // ── Dots ──
  dots: {
    flexDirection: 'row',
    gap: 18,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#4f8ef7',
    borderColor: '#4f8ef7',
  },
  dotError: {
    borderColor: '#ff6b6b',
    backgroundColor: '#ff6b6b',
  },

  // ── Keys ──
  keypad: {
    gap: 12,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPlaceholder: {
    width: 72,
    height: 72,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  keyTextDisabled: {
    color: '#555',
  },
});