// src/components/settings/BiometricRow.jsx
import { useTheme } from '@/providers/ThemeProvider';
import { useBiometricStore } from '@/store/biometricStore';
import { authenticate, isBiometricAvailable as checkBiometricAvailable } from '@/services/biometricService';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * BiometricRow
 *
 * Settings row that lets the user enable/disable biometric app lock.
 *
 * Flow (exactly like PhonePe/GPay):
 *  1. User taps the toggle to turn it ON.
 *  2. We immediately call biometricService.authenticate() — the system
 *     fingerprint sheet pops up.
 *  3. Only if the scan succeeds do we call setBiometricEnabled(true).
 *  4. If the scan fails or the user cancels → toggle stays OFF, we show an alert.
 *
 * Turning OFF requires no scan — just one tap to disable.
 */
export default function BiometricRow() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const {
    isBiometricEnabled,
    isBiometricAvailable,
    setBiometricEnabled,
    setBiometricAvailable,
  } = useBiometricStore();

  const [checking, setChecking] = useState(false);

  // ── Check hardware availability once on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      const available = await checkBiometricAvailable();
      setBiometricAvailable(available);
    })();
  }, []);

  // ── Toggle handler ───────────────────────────────────────────────────────
  const handleToggle = async (newValue) => {
    // Turning OFF → no scan required
    if (!newValue) {
      setBiometricEnabled(false);
      return;
    }

    // Turning ON → require a successful scan first
    setChecking(true);

    const result = await authenticate({
      promptMessage: 'Verify your biometric to enable app lock',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    setChecking(false);

    if (result.success) {
      setBiometricEnabled(true);
    } else {
      // Scan failed or cancelled — keep toggle OFF
      if (result.error !== 'cancelled' && result.error !== 'user_cancel') {
        Alert.alert(
          'Biometric failed',
          'Could not verify your biometric. Please try again.',
          [{ text: 'OK' }],
        );
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const isDisabled = !isBiometricAvailable || checking;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {/* Left: icon + label */}
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft ?? '#1a2a4a' }]}>
          <Ionicons
            name="finger-print"
            size={20}
            color={isDisabled ? colors.textMuted : colors.primary}
          />
        </View>

        <View style={styles.labelGroup}>
          <Text style={[styles.label, { color: isDisabled ? colors.textMuted : colors.text }]}>
            {t('settings.biometricLock', 'Biometric Lock')}
          </Text>
          <Text style={[styles.subLabel, { color: colors.textMuted }]}>
            {!isBiometricAvailable
              ? t('settings.biometricUnavailable', 'Not available on this device')
              : isBiometricEnabled
              ? t('settings.biometricOn', 'App locks when you leave')
              : t('settings.biometricOff', 'Tap to enable fingerprint lock')}
          </Text>
        </View>
      </View>

      {/* Right: spinner while authenticating, then switch */}
      <View style={styles.right}>
        {checking ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleToggle}
            disabled={isDisabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isBiometricEnabled ? '#fff' : colors.textMuted}
            ios_backgroundColor={colors.border}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  right: {
    marginLeft: 12,
    minWidth: 52,
    alignItems: 'flex-end',
  },
});