/**
 * Settings Screen — Optimized UI/UX + Biometric Toggle
 */

import Screen from '@/components/common/Screen';
import {
    IconBell,
    IconEye,
    IconGlobe,
    IconInfo,
    IconLogout,
    IconMapPin,
    IconMoon,
    IconPhone,
    IconScan,
    IconShield,
    IconWarning
} from "@/components/icon/AllIcon";
import BiometricRow from "@/components/settings/BiometricRow";
import CardStatusBlock from "@/components/settings/CardStatusBlock";
import LanguageModal from "@/components/settings/LanguageModal";
import PendingUpdatesBanner from "@/components/settings/PendingUpdatesBanner";
import { GroupLabel, SettingsRow } from '@/components/settings/Row';
import ScanHistoryPreview from "@/components/settings/ScanHistoryPreview";
import ThemeSegment from "@/components/settings/ThemeSegment";
import { LANGUAGES } from '@/constants/constants';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useColorScheme } from '@/hooks/useTheme';
import { colors, radius, spacing, typography } from '@/theme';
import { visibilityLabel } from '@/utils/helpers';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';



// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const router = useRouter();
    const { parentUser, logout } = useAuthStore();
    const {
        student, token, card, emergencyProfile,
        recentScans, anomalies, updateRequests,
        locationConsent, updateLocationConsent,
        updateNotificationPref, notificationPrefs,
    } = useProfileStore();

    const { theme, setTheme } = useColorScheme?.() ?? { theme: 'system', setTheme: () => { } };

    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scanAlerts ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomalyAlerts ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);
    const [lang, setLang] = useState('en');
    const [langModalOpen, setLangModal] = useState(false);

    const unresolvedAnomalies = (anomalies ?? []).filter(a => !a.resolved);
    const initial = parentUser?.phone?.[0] ?? 'P';
    const lastFour = parentUser?.phone?.slice(-4) ?? '••••';
    const currentLang = LANGUAGES.find(l => l.code === lang);

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out', style: 'destructive',
                    onPress: () => { logout(); router.replace('/(auth)/login'); }
                },
            ]
        );
    };

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            <LanguageModal
                visible={langModalOpen}
                current={lang}
                onSelect={setLang}
                onClose={() => setLangModal(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
                    <Text style={styles.pageTitle}>Settings</Text>
                    <Text style={styles.pageSubtitle}>Manage your child's emergency card</Text>
                </Animated.View>

                {/* ── Parent card ── */}
                <Animated.View entering={FadeInDown.delay(80).duration(400)}>
                    <View style={styles.parentCard}>
                        <View style={styles.parentAvatar}>
                            <Text style={styles.parentInitial}>{initial.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.parentPhone}>{parentUser?.phone ?? '—'}</Text>
                            <View style={styles.parentVerifyRow}>
                                {parentUser?.is_phone_verified ? (
                                    <>
                                        <View style={styles.verifyDot} />
                                        <Text style={styles.verifyText}>Phone verified</Text>
                                    </>
                                ) : (
                                    <Text style={[styles.verifyText, { color: colors.warning }]}>
                                        ⚠ Phone not verified
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Text style={styles.parentEnding}>···{lastFour}</Text>
                    </View>
                </Animated.View>

                {/* ── Pending updates banner ── */}
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

                {/* ── Physical Card ── */}
                <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.group}>
                    <GroupLabel label="Physical Card" />
                    <View style={styles.groupCard}>
                        <CardStatusBlock token={token} card={card} />
                        <SettingsRow
                            icon={<IconScan color={colors.primary} />} iconBg={colors.primaryBg}
                            title="Deactivate / Replace Card"
                            subtitle="Lost or damaged? Lock it instantly"
                            onPress={() => router.push('/(app)/qr')}
                            isLast
                        />
                    </View>
                </Animated.View>

                {/* ── Scan History ── */}
                <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.group}>
                    <GroupLabel label="Scan History" />
                    <View style={styles.groupCard}>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push('/(app)/scan-history')}
                        />
                    </View>
                </Animated.View>

                {/* ── Emergency Profile ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.group}>
                    <GroupLabel label="Emergency Profile" />
                    <View style={styles.groupCard}>
                        <SettingsRow
                            icon={<IconEye color={colors.info} />} iconBg={colors.infoBg}
                            title="Who Can See What"
                            subtitle={visibilityLabel(emergencyProfile?.visibility)}
                            onPress={() => router.push('/(app)/visibility')}
                        />
                        <SettingsRow
                            icon={<IconShield color={colors.primary} />} iconBg={colors.primaryBg}
                            title="Emergency Info"
                            subtitle={`Blood group, allergies, doctor — ${student?.first_name ?? 'child'}'s card`}
                            onPress={() => router.push('/(app)/updates')}
                            isLast
                        />
                    </View>
                </Animated.View>

                {/* ── Security — NEW GROUP ── */}
                <Animated.View entering={FadeInDown.delay(230).duration(400)} style={styles.group}>
                    <GroupLabel label="Security" />
                    <View style={styles.groupCard}>
                        {/*
                          BiometricRow is fully self-contained:
                          - reads useBiometricStore internally
                          - handles loading state + OS prompt + error alerts
                          - hides itself if device has no enrolled biometrics
                        */}
                        <BiometricRow isLast />
                    </View>
                </Animated.View>

                {/* ── Notifications ── */}
                <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.group}>
                    <GroupLabel label="Notifications" />
                    <View style={styles.groupCard}>
                        <SettingsRow
                            icon={<IconBell color={colors.success} />} iconBg={colors.successBg}
                            title="Scan Alerts" subtitle="Notify when card is scanned"
                            toggle toggleVal={scanAlerts}
                            onToggle={(v) => { setScanAlerts(v); updateNotificationPref?.('scanAlerts', v); }}
                        />
                        <SettingsRow
                            icon={<IconWarning color={colors.warning} />} iconBg={colors.warningBg}
                            title="Anomaly Alerts" subtitle="Suspicious scan activity warnings"
                            toggle toggleVal={anomalyAlerts}
                            onToggle={(v) => { setAnomalyAlerts(v); updateNotificationPref?.('anomalyAlerts', v); }}
                        />
                        <SettingsRow
                            icon={<IconMapPin color={colors.info} />} iconBg={colors.infoBg}
                            title="Location on Scan" subtitle="Capture GPS when card is scanned"
                            toggle toggleVal={locationEnabled}
                            onToggle={(v) => { setLocation(v); updateLocationConsent?.(v); }}
                            isLast
                        />
                    </View>
                </Animated.View>

                {/* ── Appearance ── */}
                <Animated.View entering={FadeInDown.delay(290).duration(400)} style={styles.group}>
                    <GroupLabel label="Appearance" />
                    <View style={styles.groupCard}>
                        <SettingsRow
                            icon={<IconGlobe color={colors.info} />} iconBg={colors.infoBg}
                            title="Language"
                            subtitle={currentLang ? `${currentLang.native} · ${currentLang.label}` : 'English'}
                            onPress={() => setLangModal(true)}
                        />
                        {/* Theme — inline segment control, no chevron */}
                        <View style={[styles.row, styles.rowLast]}>
                            <View style={[styles.rowIcon, { backgroundColor: colors.surface3 }]}>
                                <IconMoon color={colors.textTertiary} />
                            </View>
                            <View style={styles.rowBody}>
                                <Text style={styles.rowTitle}>Theme</Text>
                                <ThemeSegment value={theme} onChange={setTheme} />
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* ── Account ── */}
                <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.group}>
                    <GroupLabel label="Account" />
                    <View style={styles.groupCard}>
                        <SettingsRow
                            icon={<IconPhone color={colors.warning} />} iconBg={colors.warningBg}
                            title="Change Phone Number" subtitle="OTP verification required"
                            onPress={() => router.push('/(app)/change-phone')}
                        />
                        <SettingsRow
                            icon={<IconInfo color={colors.info} />} iconBg={colors.infoBg}
                            title="Help & Support"
                            onPress={() => router.push('/(app)/support')}
                        />
                        <SettingsRow
                            icon={<IconLogout />} iconBg={colors.primaryBg}
                            title="Log Out"
                            onPress={handleLogout}
                            danger isLast
                        />
                    </View>
                </Animated.View>

                {/* ── Footer ── */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.footer}>
                    <Text style={styles.footerText}>SafeTag · v1.0.0</Text>
                    <Text style={styles.footerSub}>Emergency ID Card Platform</Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[10],
        gap: spacing[4],
    },

    header: { gap: spacing[1] },
    pageTitle: { ...typography.h2, color: colors.textPrimary },
    pageSubtitle: { ...typography.bodySm, color: colors.textTertiary },

    // ── Parent card ───────────────────────────────
    parentCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[3],
        backgroundColor: colors.surface, borderRadius: radius.cardSm,
        borderWidth: 1, borderColor: colors.border, padding: spacing[3.5],
    },
    parentAvatar: {
        width: 44, height: 44, borderRadius: radius.avatarLg,
        backgroundColor: colors.primaryBg, borderWidth: 1.5,
        borderColor: 'rgba(232,52,42,0.25)',
        alignItems: 'center', justifyContent: 'center',
    },
    parentInitial: { ...typography.h4, color: colors.primary },
    parentPhone: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '600' },
    parentVerifyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: 3 },
    verifyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    verifyText: { ...typography.labelXs, color: colors.success },
    parentEnding: { ...typography.labelSm, color: colors.textTertiary, fontVariant: ['tabular-nums'] },

    // ── Group ─────────────────────────────────────
    group: { gap: spacing[1.5] },
    groupCard: {
        backgroundColor: colors.surface, borderRadius: radius.cardSm,
        borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },

    // ── Row ───────────────────────────────────────
    row: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[3],
        paddingHorizontal: spacing[4], paddingVertical: spacing[3.5],
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },         // removes trailing divider
    rowIcon: {
        width: 34, height: 34, borderRadius: radius.md,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowBody: { flex: 1, gap: spacing[0.5] },
    rowTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '500' },






    // ── Footer ────────────────────────────────────
    footer: { alignItems: 'center', paddingTop: spacing[2], gap: spacing[1] },
    footerText: { ...typography.labelSm, color: colors.textTertiary, fontWeight: '600' },
    footerSub: { ...typography.labelXs, color: colors.textTertiary },
});