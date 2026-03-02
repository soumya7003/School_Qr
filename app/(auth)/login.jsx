/**
 * Login Screen — Card number + phone entry.
 * Matches Flow 01 from the UI/UX spec.
 */

import Button from '@/src/components/common/Button';
import Divider from '@/src/components/common/Divider';
import Input from '@/src/components/common/Input';
import Screen from '@/src/components/common/Screen';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textSecondary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CardIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Rect x={2} y={5} width={20} height={14} rx={2}
            stroke={colors.textTertiary} strokeWidth={1.8} />
        <Path d="M2 10h20" stroke={colors.textTertiary} strokeWidth={1.8} />
    </Svg>
);

const PhoneIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 16 19.79 19.79 0 011.61 7.36 2 2 0 013.6 5.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 12a16 16 0 006.06 6.06l.97-.97a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.03z"
            stroke={colors.textTertiary} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const QrIcon = () => (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7} height={7} rx={1}
            stroke={colors.primary} strokeWidth={1.8} />
        <Rect x={14} y={3} width={7} height={7} rx={1}
            stroke={colors.primary} strokeWidth={1.8} />
        <Rect x={3} y={14} width={7} height={7} rx={1}
            stroke={colors.primary} strokeWidth={1.8} />
        <Path d="M14 14h2v2h-2zM18 14h3M20 16v3M14 18h2v3M18 20h3"
            stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const ShieldIcon = () => (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={colors.primary} strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4"
            stroke={colors.primary} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'scan'
    const [cardNumber, setCardNumber] = useState('');
    const [phone, setPhone] = useState('');

    const handleSendOtp = () => {
        router.push('/(auth)/otp');
    };

    return (
        <Screen bg={colors.screenBg}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero illustration */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroWrap}>
                        <LinearGradient
                            colors={[colors.primaryBg, 'transparent']}
                            style={styles.heroBg}
                        />
                        <View style={styles.shieldWrap}>
                            <ShieldIcon />
                        </View>
                        <Text style={styles.appName}>
                            School<Text style={{ color: colors.primary }}>QR</Text>
                        </Text>
                    </Animated.View>

                    {/* Form card */}
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>

                        <Text style={styles.title}>Link your{'\n'}child's card</Text>
                        <Text style={styles.subtitle}>
                            Enter the card number on the back of the QR card, or scan it directly.
                        </Text>

                        {/* Method tabs */}
                        <View style={styles.tabs}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
                                onPress={() => setActiveTab('manual')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                                    Manual Entry
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
                                onPress={() => setActiveTab('scan')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, activeTab === 'scan' && styles.tabTextActive]}>
                                    Scan QR
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Scan option */}
                        <TouchableOpacity style={styles.scanBox} activeOpacity={0.7}>
                            <QrIcon />
                            <Text style={styles.scanText}>Tap to scan card QR code</Text>
                        </TouchableOpacity>

                        <Divider label="or enter manually" style={{ marginVertical: spacing[1] }} />

                        {/* Card number */}
                        <Input
                            label="CARD NUMBER"
                            placeholder="SQ-2024-XXXXXX"
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            iconLeft={<CardIcon />}
                            keyboardType="default"
                            autoCapitalize="characters"
                            maxLength={15}
                        />

                        {/* Phone */}
                        <Input
                            label="MOBILE NUMBER"
                            placeholder="+91 enter mobile number"
                            value={phone}
                            onChangeText={setPhone}
                            iconLeft={<PhoneIcon />}
                            keyboardType="phone-pad"
                            maxLength={13}
                        />

                        <Button
                            label="Send OTP →"
                            onPress={handleSendOtp}
                            style={{ marginTop: spacing[2] }}
                        />

                        {/* Trust indicator */}
                        <View style={styles.trustRow}>
                            <View style={styles.trustDot} />
                            <Text style={styles.trustText}>Trusted by 2,400+ parents across India</Text>
                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        paddingBottom: spacing[8],
    },

    // ── Hero ──────────────────────────────────────
    heroWrap: {
        alignItems: 'center',
        paddingTop: spacing[10],
        paddingBottom: spacing[6],
        position: 'relative',
    },
    heroBg: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 200,
    },
    shieldWrap: {
        width: 100,
        height: 100,
        backgroundColor: colors.surface2,
        borderRadius: radius['4xl'],
        borderWidth: 1.5,
        borderColor: `rgba(232,52,42,0.25)`,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.primaryMd,
        marginBottom: spacing[3],
    },
    appName: {
        ...typography.h2,
        color: colors.textPrimary,
    },

    // ── Form ──────────────────────────────────────
    formCard: {
        marginHorizontal: spacing.screenH,
        backgroundColor: colors.surface,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[5],
        gap: spacing[4],
        ...shadows.md,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        marginTop: -spacing[2],
    },

    // ── Tabs ─────────────────────────────────────
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface2,
        borderRadius: radius.lg,
        padding: spacing[1],
        gap: spacing[1],
    },
    tab: {
        flex: 1,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.labelMd,
        color: colors.textTertiary,
    },
    tabTextActive: {
        color: colors.white,
    },

    // ── Scan box ──────────────────────────────────
    scanBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        height: 72,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: `rgba(232,52,42,0.3)`,
        borderRadius: radius.card,
        backgroundColor: colors.primaryBgSoft,
    },
    scanText: {
        ...typography.labelLg,
        color: colors.primary,
    },

    // ── Trust ─────────────────────────────────────
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        marginTop: -spacing[1],
    },
    trustDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },
    trustText: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },
});