/**
 * app/(app)/settings.jsx
 * Settings — the central control hub of RESQID
 * All colors from useTheme().colors — zero hardcoded values
 */

import Screen from '@/components/common/Screen';
import {
    IconBell, IconEye, IconGlobe, IconInfo,
    IconMapPin, IconMoon, IconPhone, IconScan,
    IconShield, IconWarning,
} from '@/components/icon/AllIcon';
import BiometricRow from '@/components/settings/BiometricRow';
import CardStatusBlock from '@/components/settings/CardStatusBlock';
import LanguageModal from '@/components/settings/LanguageModal';
import PendingUpdatesBanner from '@/components/settings/PendingUpdatesBanner';
import ScanHistoryPreview from '@/components/settings/ScanHistoryPreview';
import ThemeSegment from '@/components/settings/ThemeSegment';
import { LANGUAGES } from '@/constants/constants';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfile } from '@/features/profile/useProfile';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { visibilityLabel } from '@/utils/helpers';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// ── Inline icons ──────────────────────────────────────────────────────────────
const ChevronRight = ({ c, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const AlertTriangle = ({ c, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
);
const LogOut = ({ c, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label, accent }) {
    return (
        <View style={sl.wrap}>
            <View style={[sl.line, { backgroundColor: accent }]} />
            <Text style={[sl.text, { color: accent }]}>{label.toUpperCase()}</Text>
        </View>
    );
}
const sl = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, marginBottom: 7 },
    line: { width: 3, height: 12, borderRadius: 2 },
    text: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
});

// ── Card container ────────────────────────────────────────────────────────────
function SettingsCard({ children, C }) {
    return (
        <View style={[card.wrap, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {children}
        </View>
    );
}
const card = StyleSheet.create({
    wrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({ C, iconEl, iconBg, iconBd, title, subtitle, onPress, toggle, toggleVal, onToggle, danger, isLast, right, noChevron }) {
    const Wrapper = (onPress && !toggle) ? TouchableOpacity : View;
    return (
        <Wrapper
            style={[r.row, !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.65}
        >
            <View style={[r.iconWrap, { backgroundColor: iconBg, borderColor: iconBd }]}>
                {iconEl}
            </View>
            <View style={r.body}>
                <Text style={[r.title, { color: danger ? C.red : C.tx }]}>{title}</Text>
                {subtitle ? <Text style={[r.sub, { color: C.tx3 }]}>{subtitle}</Text> : null}
            </View>
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: C.s5, true: C.primary + '80' }}
                    thumbColor={toggleVal ? C.primary : C.tx3}
                    ios_backgroundColor={C.s5}
                />
            ) : right ? right
                : (onPress && !noChevron) ? (
                    <View style={r.chevron}>
                        <ChevronRight c={C.tx3} size={13} />
                    </View>
                ) : null}
        </Wrapper>
    );
}
const r = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: '600' },
    sub: { fontSize: 12, lineHeight: 16 },
    chevron: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

// ── Parent card ───────────────────────────────────────────────────────────────
function ParentCard({ parentUser, C }) {
    const { t } = useTranslation();
    const initial = parentUser?.phone?.[0] ?? 'P';
    const lastFour = parentUser?.phone?.slice(-4) ?? '••••';
    const verified = parentUser?.is_phone_verified;

    return (
        <View style={[pc.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[pc.stripe, { backgroundColor: verified ? C.ok : C.amb }]} />
            <View style={[pc.avatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                <Text style={[pc.avatarText, { color: C.primary }]}>{initial.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[pc.phone, { color: C.tx }]}>{parentUser?.phone ?? '—'}</Text>
                <View style={pc.statusRow}>
                    {verified ? (
                        <>
                            <View style={[pc.dot, { backgroundColor: C.ok }]} />
                            <Text style={[pc.statusText, { color: C.ok }]}>{t('settings.verifiedAccount')}</Text>
                        </>
                    ) : (
                        <>
                            <AlertTriangle c={C.amb} size={11} />
                            <Text style={[pc.statusText, { color: C.amb }]}>{t('settings.phoneNotVerified')}</Text>
                        </>
                    )}
                </View>
            </View>
            <View style={pc.ending}>
                <Text style={[pc.endingLabel, { color: C.tx3 }]}>{t('settings.endsIn')}</Text>
                <Text style={[pc.endingNum, { color: C.tx2 }]}>{lastFour}</Text>
            </View>
        </View>
    );
}
const pc = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, paddingVertical: 16, paddingRight: 16, paddingLeft: 0, overflow: 'hidden' },
    stripe: { width: 3, alignSelf: 'stretch', marginRight: -2 },
    avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 14 },
    avatarText: { fontSize: 18, fontWeight: '900' },
    phone: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 11.5, fontWeight: '600' },
    ending: { alignItems: 'flex-end' },
    endingLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
    endingNum: { fontSize: 15, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { colors: C } = useTheme();
    const { parentUser, logout } = useAuthStore();

    const {
        student, token, card, emergencyProfile,
        recentScans, anomalies, updateRequests,
        locationConsent, updateLocationConsent,
        updateNotificationPref, notificationPrefs,
    } = useProfile();

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
    const [langModalOpen, setLangModal] = useState(false);
    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scanAlerts ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomalyAlerts ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);

    const unresolvedAnomalies = (anomalies ?? []).filter((a) => !a.resolved);

    const handleLogout = () => {
        Alert.alert(
            t('common.logout'),
            'Are you sure you want to log out?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ],
        );
    };

    const handleExport = () =>
        Alert.alert('Export Data', 'A download link will be sent to your registered phone number within a few minutes.');

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <LanguageModal visible={langModalOpen} onClose={() => setLangModal(false)} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { gap: spacing[4] }]}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={s.header}>
                    <View>
                        <Text style={[s.pageTitle, { color: C.tx }]}>{t('settings.title')}</Text>
                        <Text style={[s.pageSub, { color: C.tx3 }]}>
                            {student?.first_name ? `${student.first_name}'s emergency card` : t('settings.subtitle')}
                        </Text>
                    </View>
                    {token?.status && (
                        <View style={[
                            s.statusPill,
                            token.status === 'ACTIVE'
                                ? { backgroundColor: C.okBg, borderColor: C.okBd }
                                : { backgroundColor: C.ambBg, borderColor: C.ambBd },
                        ]}>
                            <View style={[s.statusDot, { backgroundColor: token.status === 'ACTIVE' ? C.ok : C.amb }]} />
                            <Text style={[s.statusText, { color: token.status === 'ACTIVE' ? C.ok : C.amb }]}>
                                {token.status === 'ACTIVE' ? t('settings.cardLive') : token.status}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Parent identity */}
                <Animated.View entering={FadeInDown.delay(70).duration(350)}>
                    <ParentCard parentUser={parentUser} C={C} />
                </Animated.View>

                {/* Pending updates */}
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(85).duration(350)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

                {/* Physical card */}
                <Animated.View entering={FadeInDown.delay(110).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.physicalCard')} accent={C.primary} />
                    <SettingsCard C={C}>
                        <CardStatusBlock token={token} card={card} />
                        <Row
                            C={C}
                            iconEl={<IconScan color={C.primary} />}
                            iconBg={C.primaryBg} iconBd={C.primaryBd}
                            title={t('settings.deactivateCard')}
                            subtitle={t('settings.deactivateCardSub')}
                            onPress={() => router.push('/(app)/qr')}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Scan history */}
                <Animated.View entering={FadeInDown.delay(140).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.scanActivity')} accent={C.blue} />
                    <SettingsCard C={C}>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push('/(app)/scan-history')}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Emergency profile */}
                <Animated.View entering={FadeInDown.delay(170).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.emergencyProfile')} accent={C.primary} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconEye color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t('settings.visibilityControls')}
                            subtitle={visibilityLabel(emergencyProfile?.visibility)}
                            onPress={() => router.push('/(app)/visibility')}
                        />
                        <Row
                            C={C}
                            iconEl={<IconShield color={C.primary} />}
                            iconBg={C.primaryBg} iconBd={C.primaryBd}
                            title={t('settings.emergencyInfo')}
                            subtitle={`${t('settings.emergencyInfoSub')} · ${student?.first_name ?? 'child'}'s card`}
                            onPress={() => router.push('/(app)/updates')}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Security */}
                <Animated.View entering={FadeInDown.delay(200).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.security')} accent={C.purp} />
                    <SettingsCard C={C}>
                        <BiometricRow isLast />
                    </SettingsCard>
                </Animated.View>

                {/* Notifications */}
                <Animated.View entering={FadeInDown.delay(230).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.notifications')} accent={C.ok} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconBell color={C.ok} />}
                            iconBg={C.okBg} iconBd={C.okBd}
                            title={t('settings.scanAlerts')}
                            subtitle={t('settings.scanAlertsSub')}
                            toggle toggleVal={scanAlerts}
                            onToggle={(v) => { setScanAlerts(v); updateNotificationPref?.('scanAlerts', v); }}
                        />
                        <Row
                            C={C}
                            iconEl={<IconWarning color={C.amb} />}
                            iconBg={C.ambBg} iconBd={C.ambBd}
                            title={t('settings.anomalyAlerts')}
                            subtitle={t('settings.anomalyAlertsSub')}
                            toggle toggleVal={anomalyAlerts}
                            onToggle={(v) => { setAnomalyAlerts(v); updateNotificationPref?.('anomalyAlerts', v); }}
                        />
                        <Row
                            C={C}
                            iconEl={<IconMapPin color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t('settings.locationOnScan')}
                            subtitle={t('settings.locationOnScanSub')}
                            toggle toggleVal={locationEnabled}
                            onToggle={(v) => { setLocation(v); updateLocationConsent?.(v); }}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Appearance */}
                <Animated.View entering={FadeInDown.delay(260).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.appearance')} accent={C.tx3} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconGlobe color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t('settings.language')}
                            subtitle={`${currentLang.native} · ${currentLang.label}`}
                            onPress={() => setLangModal(true)}
                        />
                        <Row
                            C={C}
                            iconEl={<IconMoon color={C.tx3} />}
                            iconBg={C.s4} iconBd={C.bd2}
                            title={t('settings.theme')}
                            subtitle={t('settings.themeSub')}
                            noChevron
                            right={<ThemeSegment />}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Account */}
                <Animated.View entering={FadeInDown.delay(290).duration(350)} style={s.group}>
                    <SectionLabel label={t('settings.account')} accent={C.tx3} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconPhone color={C.amb} />}
                            iconBg={C.ambBg} iconBd={C.ambBd}
                            title={t('settings.changePhone')}
                            subtitle={t('settings.changePhoneSub')}
                            onPress={() => router.push('/(app)/change-phone')}
                        />
                        <Row
                            C={C}
                            iconEl={<IconInfo color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t('settings.support')}
                            onPress={() => router.push('/(app)/support')}
                        />
                        <Row
                            C={C}
                            iconEl={<LogOut c={C.red} size={16} />}
                            iconBg={C.redBg} iconBd={C.redBd}
                            title={t('settings.logout')}
                            onPress={handleLogout}
                            danger
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.delay(320).duration(350)} style={s.footer}>
                    <View style={[s.footerDivider, { backgroundColor: C.bd2 }]} />
                    <Text style={[s.footerApp, { color: C.tx3 }]}>RESQID · v1.0.0</Text>
                    <Text style={[s.footerSub, { color: C.tx3 }]}>Emergency ID Card Platform</Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

const s = StyleSheet.create({
    scroll: { paddingHorizontal: spacing.screenH, paddingTop: spacing[5], paddingBottom: spacing[12] },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: spacing[1] },
    pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    pageSub: { fontSize: 12.5, marginTop: 3 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 4 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    group: { gap: 8 },
    footer: { alignItems: 'center', gap: 4, paddingTop: spacing[2] },
    footerDivider: { width: 32, height: 1, borderRadius: 1, marginBottom: 8 },
    footerApp: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    footerSub: { fontSize: 11 },
});