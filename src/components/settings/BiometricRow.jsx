/**
 * BiometricRow — Self-contained biometric toggle row.
 *
 * - Reads from useBiometricStore directly (no props needed)
 * - Shows spinner while OS biometric dialog is open
 * - Shows enabled/disabled status pill
 * - Hides itself if device has no enrolled biometrics
 * - Handles all error alerts internally
 */

import { IconFaceId, IconFingerprint } from '@/components/icon/AllIcon';
import { BIOMETRIC_COLOR } from '@/constants/constants';
import { disableBiometric, enableBiometric } from '@/services/biometricService';
import { useBiometricStore } from '@/store/biometricStore';
import { colors, radius, spacing, typography } from '@/theme';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';

export default function BiometricRow({ isLast }) {
    const { isBiometricEnabled, isDeviceSupported, biometricType } = useBiometricStore();
    const [loading, setLoading] = useState(false);

    const label = biometricType === 'face' ? 'Face ID' : 'Fingerprint';
    const Icon = biometricType === 'face' ? IconFaceId : IconFingerprint;

    const handleToggle = useCallback(async () => {
        setLoading(true);
        try {
            if (isBiometricEnabled) {
                const res = await disableBiometric();
                if (!res.ok && res.reason !== 'user_cancel') {
                    Alert.alert('Could not disable', 'Please try again.');
                }
            } else {
                const res = await enableBiometric();
                if (!res.ok) {
                    if (res.reason === 'not_supported') {
                        Alert.alert(
                            `${label} not available`,
                            `Set up ${label} in your device Settings first, then try again.`
                        );
                    } else if (res.reason !== 'user_cancel') {
                        Alert.alert('Could not enable', 'Please try again.');
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    }, [isBiometricEnabled, label]);

    // Hide entirely if device has no biometric hardware enrolled
    if (!isDeviceSupported) return null;

    return (
        <View style={[styles.row, isLast && styles.rowLast]}>
            {/* Indigo icon */}
            <View style={[styles.icon, { backgroundColor: `${BIOMETRIC_COLOR}18` }]}>
                <Icon color={BIOMETRIC_COLOR} />
            </View>

            {/* Text + status pill */}
            <View style={styles.body}>
                <Text style={styles.title}>{label} Lock</Text>
                <Text style={styles.sub}>
                    {isBiometricEnabled
                        ? 'App locks when sent to background'
                        : `Require ${label} to open app`}
                </Text>

                {/* Enabled / Disabled pill */}
                <View style={styles.pillRow}>
                    <View style={[
                        styles.pill,
                        { backgroundColor: isBiometricEnabled ? `${BIOMETRIC_COLOR}15` : colors.surface3 },
                    ]}>
                        <View style={[
                            styles.pillDot,
                            { backgroundColor: isBiometricEnabled ? BIOMETRIC_COLOR : colors.textTertiary },
                        ]} />
                        <Text style={[
                            styles.pillText,
                            { color: isBiometricEnabled ? BIOMETRIC_COLOR : colors.textTertiary },
                        ]}>
                            {isBiometricEnabled ? 'Enabled' : 'Disabled'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Spinner during OS prompt OR toggle switch */}
            {loading
                ? <ActivityIndicator size="small" color={BIOMETRIC_COLOR} />
                : (
                    <Switch
                        value={isBiometricEnabled}
                        onValueChange={handleToggle}
                        trackColor={{ false: colors.surface3, true: BIOMETRIC_COLOR }}
                        thumbColor={colors.white}
                        ios_backgroundColor={colors.surface3}
                    />
                )
            }
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },

    icon: {
        width: 34,
        height: 34,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    body: {
        flex: 1,
        gap: spacing[0.5],
    },
    title: {
        ...typography.bodyMd,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    sub: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 1,
    },

    // ── Status pill ───────────────────────────────
    pillRow: {
        flexDirection: 'row',
        marginTop: spacing[1.5],
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing[2],
        paddingVertical: 3,
        borderRadius: radius.chipFull,
    },
    pillDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    pillText: {
        ...typography.labelXs,
        fontWeight: '700',
        fontSize: 10,
    },
});