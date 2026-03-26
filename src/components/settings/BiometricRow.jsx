// src/components/settings/BiometricRow.jsx
import { useTheme } from '@/providers/ThemeProvider';
import { useBiometricStore } from '@/store/biometricStore';
import { authenticate, isBiometricAvailable } from '@/services/biometricService';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, Text, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconFingerprint = ({ color, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2C9.243 2 7 4.243 7 7v3M12 2c2.757 0 5 2.243 5 5v3"
            stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M5 10v1a7 7 0 0014 0v-1"
            stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M12 12v5M9 14.5c0 1.657 1.343 3 3 3s3-1.343 3-3"
            stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        <Path d="M12 7a3 3 0 00-3 3v1a3 3 0 006 0v-1a3 3 0 00-3-3z"
            stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
);

const IconShieldCheck = ({ color, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
            stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4"
            stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconShieldOff = ({ color, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L4 6v6c0 2.56 1.02 5.01 2.76 7M20 12V6l-8-4M4 4l16 16"
            stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ enabled, C }) {
    const { t } = useTranslation();
    return (
        <View style={[
            badge.wrap,
            {
                backgroundColor: enabled ? (C.okBg ?? '#1a3a2a') : C.s4,
                borderColor: enabled ? (C.okBd ?? '#2a5a3a') : C.bd2,
            },
        ]}>
            {enabled
                ? <IconShieldCheck color={C.ok ?? '#22c55e'} size={11} />
                : <IconShieldOff color={C.tx3} size={11} />
            }
            <Text style={[badge.text, { color: enabled ? (C.ok ?? '#22c55e') : C.tx3 }]}>
                {enabled
                    ? t('settings.biometricOn', 'ON')
                    : t('settings.biometricOff', 'OFF')
                }
            </Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1,
    },
    text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});

// ── Main component ────────────────────────────────────────────────────────────
/**
 * BiometricRow
 *
 * KEY FIX:
 * - Toggle is NEVER disabled. The `disabled` prop has been removed entirely.
 * - Availability is checked at tap-time inside handleEnable(), not at render time.
 * - This means even if the store's isBiometricAvailable is false on first render,
 *   the user can still tap the toggle and get a proper error message.
 *
 * Props:
 *   isLast {boolean} — removes bottom border divider
 */
export default function BiometricRow({ isLast = false }) {
    const { colors: C } = useTheme();
    const { t } = useTranslation();

    const { isBiometricEnabled, setBiometricEnabled } = useBiometricStore();

    // ── Turn ON ───────────────────────────────────────────────────────────────
    const handleEnable = async () => {
        // Check availability at tap-time — not at render time
        const available = await isBiometricAvailable();
        console.log('[BiometricRow] available at tap-time:', available);

        if (!available) {
            Alert.alert(
                t('settings.biometricUnavailableTitle', 'Biometric Unavailable'),
                t(
                    'settings.biometricUnavailableMsg',
                    'No fingerprint or face ID is enrolled on this device.\n\nPlease go to:\nDevice Settings → Security → Fingerprint\nand enroll your fingerprint first.',
                ),
                [{ text: t('common.ok', 'OK') }],
            );
            return;
        }

        // Ask user to scan once to verify it works
        const result = await authenticate({
            promptMessage: t(
                'settings.biometricEnablePrompt',
                'Scan your fingerprint to enable app lock',
            ),
        });

        if (result.success) {
            setBiometricEnabled(true);
            Alert.alert(
                t('settings.biometricEnabledTitle', 'App Lock Enabled ✓'),
                t(
                    'settings.biometricEnabledMsg',
                    'Fingerprint scan will be required each time you return to the app.',
                ),
                [{ text: t('common.ok', 'OK') }],
            );
        } else {
            // result.error tells us why — 'user_cancel', 'lockout', etc.
            console.log('[BiometricRow] auth failed, error:', result.error);

            if (result.error !== 'user_cancel') {
                Alert.alert(
                    t('settings.biometricFailTitle', 'Authentication Failed'),
                    t('settings.biometricFailMsg', 'Could not verify your fingerprint. Please try again.'),
                    [{ text: t('common.ok', 'OK') }],
                );
            }
        }
    };

    // ── Turn OFF ──────────────────────────────────────────────────────────────
    const handleDisable = () => {
        Alert.alert(
            t('settings.biometricDisableTitle', 'Disable App Lock?'),
            t(
                'settings.biometricDisableMsg',
                'The app will no longer ask for your fingerprint when you return from the background.',
            ),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('settings.biometricDisableConfirm', 'Disable'),
                    style: 'destructive',
                    onPress: () => setBiometricEnabled(false),
                },
            ],
        );
    };

    const handleToggle = (newValue) => {
        if (newValue) {
            handleEnable();
        } else {
            handleDisable();
        }
    };

    // ── Subtitle ──────────────────────────────────────────────────────────────
    const subtitle = isBiometricEnabled
        ? t('settings.biometricEnabledSub', 'App locks when you switch away')
        : t('settings.biometricDisabledSub', 'Enable to lock app when switching away');

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={[
            styles.container,
            !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd },
        ]}>

            {/* Main row */}
            <View style={styles.row}>

                {/* Icon */}
                <View style={[
                    styles.iconWrap,
                    {
                        backgroundColor: isBiometricEnabled
                            ? (C.purpBg ?? C.primaryBg)
                            : C.s4,
                        borderColor: isBiometricEnabled
                            ? (C.purpBd ?? C.primaryBd)
                            : C.bd2,
                    },
                ]}>
                    <IconFingerprint
                        color={isBiometricEnabled ? (C.purp ?? C.primary) : C.tx3}
                        size={18}
                    />
                </View>

                {/* Label */}
                <View style={styles.body}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: C.tx }]}>
                            {t('settings.biometricLock', 'Biometric App Lock')}
                        </Text>
                        <StatusBadge enabled={isBiometricEnabled} C={C} />
                    </View>
                    <Text style={[styles.sub, { color: C.tx3 }]}>{subtitle}</Text>
                </View>

                {/* Switch — NO disabled prop, always tappable */}
                <Switch
                    value={isBiometricEnabled}
                    onValueChange={handleToggle}
                    // ↑ disabled prop intentionally removed
                    trackColor={{
                        false: C.s5,
                        true: (C.purp ?? C.primary) + '80',
                    }}
                    thumbColor={isBiometricEnabled ? (C.purp ?? C.primary) : C.tx3}
                    ios_backgroundColor={C.s5}
                />
            </View>

            {/* Info strip — only visible when enabled */}
            {isBiometricEnabled && (
                <View style={[
                    styles.infoStrip,
                    {
                        backgroundColor: C.purpBg ?? C.primaryBg,
                        borderTopColor: C.purpBd ?? C.primaryBd,
                    },
                ]}>
                    <IconShieldCheck color={C.purp ?? C.primary} size={12} />
                    <Text style={[styles.infoText, { color: C.purp ?? C.primary }]}>
                        {t(
                            'settings.biometricInfoStrip',
                            'Fingerprint scan required each time you return to the app',
                        )}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    body: {
        flex: 1,
        gap: 3,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    sub: {
        fontSize: 12,
        lineHeight: 16,
    },
    infoStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
    },
    infoText: {
        fontSize: 11,
        fontWeight: '500',
        flex: 1,
        lineHeight: 15,
    },
});