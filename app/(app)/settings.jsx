/**
 * app/(app)/settings.jsx
 * Settings — Production-grade redesign with persistent multi-child support
 */

import Screen from '@/components/common/Screen';
import {
    IconBell,
    IconChevronRight,
    IconEye,
    IconGlobe,
    IconInfo,
    IconMapPin,
    IconMoon,
    IconPhone,
    IconScan,
    IconShield,
    IconUser,
    IconWarning,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

// ── Notion-style Avatar Colors ────────────────────────────────────────────────
const AVATAR_PALETTE = [
    { bg: '#EEF2FF', text: '#4F46E5' },
    { bg: '#E6F7EC', text: '#059669' },
    { bg: '#FFF1F0', text: '#DC2626' },
    { bg: '#FEF3C7', text: '#D97706' },
    { bg: '#F3E8FF', text: '#9333EA' },
    { bg: '#FFE4E6', text: '#E11D48' },
    { bg: '#E0F2FE', text: '#0284C7' },
    { bg: '#FCE7F3', text: '#DB2777' },
];

// ── Notion-style Avatar ────────────────────────────────────────────────────────
function NotionAvatar({ name, size = 48, colorIndex = 0 }) {
    const initial = name?.charAt(0)?.toUpperCase() ?? '?';
    const colors = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];
    return (
        <View style={[
            avatarStyles.container,
            { width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.bg }
        ]}>
            <Text style={[avatarStyles.text, { fontSize: size * 0.4, color: colors.text }]}>
                {initial}
            </Text>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    text: { fontWeight: '700' },
});

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, accent }) {
    return (
        <View style={sectionStyles.container}>
            <View style={[sectionStyles.pill, { backgroundColor: accent + '18' }]}>
                <View style={[sectionStyles.dot, { backgroundColor: accent }]} />
                <Text style={[sectionStyles.title, { color: accent }]}>{title.toUpperCase()}</Text>
            </View>
        </View>
    );
}

const sectionStyles = StyleSheet.create({
    container: { marginBottom: 10, marginTop: 4 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    dot: { width: 5, height: 5, borderRadius: 3 },
    title: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
});

// ── Settings Card ─────────────────────────────────────────────────────────────
function SettingsCard({ children, C }) {
    return (
        <View style={[cardStyles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {children}
        </View>
    );
}

const cardStyles = StyleSheet.create({
    container: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});

// ── Settings Row ──────────────────────────────────────────────────────────────
function SettingsRow({ C, icon, iconBg, iconBorder, title, subtitle, onPress, isLast, rightElement, danger }) {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
        <Wrapper
            style={[
                rowStyles.container,
                !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[rowStyles.iconWrap, { backgroundColor: iconBg, borderColor: iconBorder }]}>
                {icon}
            </View>
            <View style={rowStyles.content}>
                <Text style={[rowStyles.title, { color: danger ? C.red : C.tx }]}>{title}</Text>
                {subtitle && <Text style={[rowStyles.subtitle, { color: C.tx3 }]}>{subtitle}</Text>}
            </View>
            {rightElement
                ? rightElement
                : onPress && <IconChevronRight color={C.tx3} size={14} />}
        </Wrapper>
    );
}

const rowStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '600' },
    subtitle: { fontSize: 12 },
});

// ── Parent Profile Header ─────────────────────────────────────────────────────
function ParentHeader({ parentUser, C }) {
    const verified = parentUser?.is_phone_verified;
    const phoneNumber = parentUser?.phone ?? '+91 •••• ••••';
    const name = parentUser?.name || 'Parent';

    return (
        <LinearGradient
            colors={[C.s2, C.s3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[parentStyles.container, { borderColor: C.bd }]}
        >
            <View style={[parentStyles.stripe, { backgroundColor: verified ? C.ok : C.amb }]} />
            <View style={parentStyles.inner}>
                <View style={parentStyles.topRow}>
                    <NotionAvatar name={name} size={56} colorIndex={0} />
                    <View style={parentStyles.info}>
                        <Text style={[parentStyles.name, { color: C.tx }]}>{name}</Text>
                        <Text style={[parentStyles.phone, { color: C.tx2 }]}>{phoneNumber}</Text>
                    </View>
                    <View style={[
                        parentStyles.verifiedBadge,
                        { backgroundColor: verified ? C.okBg : C.ambBg }
                    ]}>
                        <View style={[parentStyles.verifiedDot, { backgroundColor: verified ? C.ok : C.amb }]} />
                        <Text style={[parentStyles.verifiedText, { color: verified ? C.ok : C.amb }]}>
                            {verified ? 'Verified' : 'Unverified'}
                        </Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const parentStyles = StyleSheet.create({
    container: { flexDirection: 'row', borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    stripe: { width: 4 },
    inner: { flex: 1, padding: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    info: { flex: 1, gap: 3 },
    name: { fontSize: 17, fontWeight: '700' },
    phone: { fontSize: 13 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    verifiedDot: { width: 6, height: 6, borderRadius: 3 },
    verifiedText: { fontSize: 11, fontWeight: '700' },
});

// ── Children Manager (with backend sync) ─────────────────────────────────────
function ChildrenManager({ students, activeStudentId, switchActiveStudent, onAddChild, canAddMore, C, switchingChild }) {
    return (
        <View style={[childMgr.wrapper, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={childMgr.header}>
                <View style={childMgr.headerLeft}>
                    <Text style={[childMgr.headerTitle, { color: C.tx }]}>My Children</Text>
                    <View style={[childMgr.countBadge, { backgroundColor: C.primaryBg }]}>
                        <Text style={[childMgr.countText, { color: C.primary }]}>{students.length}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[childMgr.addBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
                    onPress={onAddChild}
                    activeOpacity={0.75}
                >
                    <Text style={[childMgr.addBtnPlus, { color: C.primary }]}>+</Text>
                    <Text style={[childMgr.addBtnText, { color: C.primary }]}>
                        {canAddMore ? 'Add Child' : 'Upgrade'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[childMgr.divider, { backgroundColor: C.bd }]} />

            {students.length === 0 ? (
                <View style={childMgr.emptyState}>
                    <View style={[childMgr.emptyIcon, { backgroundColor: C.s3 }]}>
                        <Text style={childMgr.emptyEmoji}>👶</Text>
                    </View>
                    <Text style={[childMgr.emptyTitle, { color: C.tx }]}>No children added yet</Text>
                    <Text style={[childMgr.emptySubtitle, { color: C.tx3 }]}>
                        Add your first child to get started with RESQID
                    </Text>
                    <TouchableOpacity
                        style={[childMgr.emptyAddBtn, { backgroundColor: C.primary }]}
                        onPress={onAddChild}
                        activeOpacity={0.8}
                    >
                        <Text style={childMgr.emptyAddBtnText}>+ Add Child</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={childMgr.childrenList}>
                    {students.map((s, idx) => {
                        const isActive = s.id === activeStudentId;
                        const name = s.first_name || s.last_name || 'Child';
                        const hasActiveCard = s.token?.status === 'ACTIVE';
                        return (
                            <Animated.View key={s.id} entering={FadeInRight.delay(idx * 60).duration(300)}>
                                <TouchableOpacity
                                    style={[
                                        childMgr.childRow,
                                        isActive && { backgroundColor: C.primaryBg },
                                    ]}
                                    onPress={async () => {
                                        if (!isActive && !switchingChild) {
                                            await switchActiveStudent(s.id);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                    disabled={switchingChild}
                                >
                                    <View style={[childMgr.activeIndicator, { backgroundColor: isActive ? C.primary : 'transparent' }]} />
                                    <NotionAvatar name={name} size={42} colorIndex={idx} />
                                    <View style={childMgr.childInfo}>
                                        <Text style={[childMgr.childName, { color: isActive ? C.primary : C.tx }]}>{name}</Text>
                                        {s.class ? (
                                            <Text style={[childMgr.childClass, { color: C.tx3 }]}>
                                                Class {s.class}{s.section ? ` · ${s.section}` : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View style={childMgr.childRight}>
                                        {hasActiveCard && (
                                            <View style={[childMgr.cardBadge, { backgroundColor: C.okBg }]}>
                                                <View style={[childMgr.cardDot, { backgroundColor: C.ok }]} />
                                                <Text style={[childMgr.cardBadgeText, { color: C.ok }]}>Active</Text>
                                            </View>
                                        )}
                                        {isActive && (
                                            <View style={[childMgr.activePill, { backgroundColor: C.primary }]}>
                                                <Text style={childMgr.activePillText}>Viewing</Text>
                                            </View>
                                        )}
                                        {switchingChild && !isActive && <ActivityIndicator size="small" color={C.primary} />}
                                    </View>
                                </TouchableOpacity>
                                {idx < students.length - 1 && <View style={[childMgr.rowDivider, { backgroundColor: C.bd }]} />}
                            </Animated.View>
                        );
                    })}
                </View>
            )}

            {!canAddMore && (
                <View style={[childMgr.planFooter, { backgroundColor: C.ambBg, borderTopColor: C.bd }]}>
                    <Text style={[childMgr.planText, { color: C.amb }]}>✦ Upgrade to Premium to add more children</Text>
                </View>
            )}
        </View>
    );
}

const childMgr = StyleSheet.create({
    wrapper: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    countText: { fontSize: 12, fontWeight: '800' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    addBtnText: { fontSize: 13, fontWeight: '700' },
    divider: { height: 1, marginHorizontal: 0 },
    childrenList: { paddingVertical: 4 },
    childRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderRadius: 0 },
    activeIndicator: { width: 3, height: 36, borderRadius: 2, marginRight: 2 },
    childInfo: { flex: 1, gap: 2 },
    childName: { fontSize: 15, fontWeight: '600' },
    childClass: { fontSize: 12 },
    childRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    cardDot: { width: 5, height: 5, borderRadius: 3 },
    cardBadgeText: { fontSize: 10, fontWeight: '700' },
    activePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    activePillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    rowDivider: { height: 1, marginLeft: 73 },
    emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 10 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyEmoji: { fontSize: 28 },
    emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    emptyAddBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
    emptyAddBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    planFooter: { paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, alignItems: 'center' },
    planText: { fontSize: 12, fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { colors: C } = useTheme();
    const { parentUser, logout } = useAuthStore();

    // ✅ CORRECT - Hook called inside component
    const {
        students,
        activeStudentId,
        setActiveStudent,
        switchActiveStudent,
        student,
        token,
        card,
        emergencyProfile,
        recentScans,
        anomalies,
        updateRequests,
        locationConsent,
        updateLocationConsent,
        updateNotificationPref,
        notificationPrefs,
    } = useProfile();

    const [switchingChild, setSwitchingChild] = useState(false);

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
    const [langModalOpen, setLangModal] = useState(false);
    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scan_notify_enabled ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomaly_notify_enabled ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);

    const unresolvedAnomalies = (anomalies ?? []).filter((a) => !a.resolved);
    const MAX_FREE_CHILDREN = 3;
    const canAddMore = (students?.length ?? 0) < MAX_FREE_CHILDREN;

    const activeStudent = student;
    const activeToken = token;
    const activeCard = card;
    const activeEmergency = emergencyProfile;

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive', onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                }
            },
        ]);
    };

    const handleAddChild = () => {
        if (!canAddMore) {
            Alert.alert('Upgrade to Premium', `Free plan supports up to ${MAX_FREE_CHILDREN} children. Upgrade to add more.`, [
                { text: 'Not Now', style: 'cancel' },
                { text: 'View Plans', onPress: () => router.push('/(app)/plans') },
            ]);
        } else {
            router.push('/(app)/add-child');
        }
    };

    // Wrapper for switchActiveStudent with loading state
    const handleSwitchStudent = async (studentId) => {
        if (switchingChild) return;
        setSwitchingChild(true);
        try {
            await switchActiveStudent(studentId);
        } finally {
            setSwitchingChild(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <LanguageModal visible={langModalOpen} onClose={() => setLangModal(false)} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Page Header */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.pageHeader}>
                    <View>
                        <Text style={[styles.pageTitle, { color: C.tx }]}>Settings</Text>
                        <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>Manage your account & children</Text>
                    </View>
                </Animated.View>

                {/* Parent Profile */}
                <Animated.View entering={FadeInDown.delay(80).duration(350)}>
                    <ParentHeader parentUser={parentUser} C={C} />
                </Animated.View>

                {/* Pending Updates */}
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(100).duration(350)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

                {/* Children Manager */}
                <Animated.View entering={FadeInDown.delay(120).duration(350)}>
                    <SectionHeader title="Children" accent={C.primary} />
                    <ChildrenManager
                        students={students ?? []}
                        activeStudentId={activeStudentId}
                        switchActiveStudent={handleSwitchStudent}
                        onAddChild={handleAddChild}
                        canAddMore={canAddMore}
                        C={C}
                        switchingChild={switchingChild}
                    />
                </Animated.View>

                {/* Physical Card */}
                <Animated.View entering={FadeInDown.delay(180).duration(350)}>
                    <SectionHeader title="Physical Card" accent={C.primary} />
                    <SettingsCard C={C}>
                        <CardStatusBlock token={activeToken} card={activeCard} />
                        <SettingsRow
                            C={C}
                            icon={<IconScan color={C.primary} size={20} />}
                            iconBg={C.primaryBg}
                            iconBorder={C.primaryBd}
                            title="View QR Code"
                            subtitle="Scan to access emergency info"
                            onPress={() => router.push('/(app)/qr')}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Scan Activity */}
                <Animated.View entering={FadeInDown.delay(220).duration(350)}>
                    <SectionHeader title="Scan Activity" accent={C.blue} />
                    <SettingsCard C={C}>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push('/(app)/scan-history')}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Emergency Profile */}
                <Animated.View entering={FadeInDown.delay(260).duration(350)}>
                    <SectionHeader title="Emergency Profile" accent={C.primary} />
                    <SettingsCard C={C}>
                        <SettingsRow
                            C={C}
                            icon={<IconEye color={C.blue} size={20} />}
                            iconBg={C.blueBg}
                            iconBorder={C.blueBd}
                            title="Visibility Controls"
                            subtitle={visibilityLabel(activeEmergency?.visibility)}
                            onPress={() => router.push('/(app)/visibility')}
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconShield color={C.primary} size={20} />}
                            iconBg={C.primaryBg}
                            iconBorder={C.primaryBd}
                            title="Emergency Info"
                            subtitle="Blood group, allergies, contacts"
                            onPress={() => router.push('/(app)/updates')}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Security */}
                <Animated.View entering={FadeInDown.delay(300).duration(350)}>
                    <SectionHeader title="Security" accent={C.purp} />
                    <SettingsCard C={C}>
                        <BiometricRow isLast />
                    </SettingsCard>
                </Animated.View>

                {/* Notifications */}
                <Animated.View entering={FadeInDown.delay(340).duration(350)}>
                    <SectionHeader title="Notifications" accent={C.ok} />
                    <SettingsCard C={C}>
                        <SettingsRow
                            C={C}
                            icon={<IconBell color={C.ok} size={20} />}
                            iconBg={C.okBg}
                            iconBorder={C.okBd}
                            title="Scan Alerts"
                            subtitle="Get notified when card is scanned"
                            rightElement={
                                <Switch
                                    value={scanAlerts}
                                    onValueChange={(v) => {
                                        setScanAlerts(v);
                                        updateNotificationPref?.('scan_notify_enabled', v);
                                    }}
                                    trackColor={{ false: C.s5, true: C.primary + '80' }}
                                    thumbColor={scanAlerts ? C.primary : C.tx3}
                                />
                            }
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconWarning color={C.amb} size={20} />}
                            iconBg={C.ambBg}
                            iconBorder={C.ambBd}
                            title="Anomaly Alerts"
                            subtitle="Suspicious activity notifications"
                            rightElement={
                                <Switch
                                    value={anomalyAlerts}
                                    onValueChange={(v) => {
                                        setAnomalyAlerts(v);
                                        updateNotificationPref?.('anomaly_notify_enabled', v);
                                    }}
                                    trackColor={{ false: C.s5, true: C.primary + '80' }}
                                    thumbColor={anomalyAlerts ? C.primary : C.tx3}
                                />
                            }
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconMapPin color={C.blue} size={20} />}
                            iconBg={C.blueBg}
                            iconBorder={C.blueBd}
                            title="Location on Scan"
                            subtitle="Share scan location anonymously"
                            rightElement={
                                <Switch
                                    value={locationEnabled}
                                    onValueChange={(v) => {
                                        setLocation(v);
                                        updateLocationConsent?.(v);
                                    }}
                                    trackColor={{ false: C.s5, true: C.primary + '80' }}
                                    thumbColor={locationEnabled ? C.primary : C.tx3}
                                />
                            }
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Appearance */}
                <Animated.View entering={FadeInDown.delay(380).duration(350)}>
                    <SectionHeader title="Appearance" accent={C.tx3} />
                    <SettingsCard C={C}>
                        <SettingsRow
                            C={C}
                            icon={<IconGlobe color={C.blue} size={20} />}
                            iconBg={C.blueBg}
                            iconBorder={C.blueBd}
                            title="Language"
                            subtitle={`${currentLang.native} · ${currentLang.label}`}
                            onPress={() => setLangModal(true)}
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconMoon color={C.tx3} size={20} />}
                            iconBg={C.s4}
                            iconBorder={C.bd2}
                            title="Theme"
                            subtitle="Light / Dark / System"
                            rightElement={<ThemeSegment />}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Account */}
                <Animated.View entering={FadeInDown.delay(420).duration(350)}>
                    <SectionHeader title="Account" accent={C.tx3} />
                    <SettingsCard C={C}>
                        <SettingsRow
                            C={C}
                            icon={<IconPhone color={C.amb} size={20} />}
                            iconBg={C.ambBg}
                            iconBorder={C.ambBd}
                            title="Change Phone Number"
                            subtitle="Update your registered mobile"
                            onPress={() => router.push('/(app)/change-phone')}
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconUser color={C.blue} size={20} />}
                            iconBg={C.blueBg}
                            iconBorder={C.blueBd}
                            title="Help & Support"
                            onPress={() => router.push('/(app)/support')}
                        />
                        <SettingsRow
                            C={C}
                            icon={<IconInfo color={C.red} size={20} />}
                            iconBg={C.redBg}
                            iconBorder={C.redBd}
                            title="Log Out"
                            onPress={handleLogout}
                            danger
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.delay(460).duration(350)} style={styles.footer}>
                    <View style={[styles.footerDivider, { backgroundColor: C.bd2 }]} />
                    <Text style={[styles.footerText, { color: C.tx3 }]}>RESQID · v1.0.0</Text>
                    <Text style={[styles.footerSubtext, { color: C.tx3 }]}>Emergency ID Card Platform</Text>
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingHorizontal: spacing.screenH, paddingTop: spacing[5], paddingBottom: spacing[12], gap: 20 },
    pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
    pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
    pageSubtitle: { fontSize: 13 },
    footer: { alignItems: 'center', gap: 6, paddingTop: 16, paddingBottom: 32 },
    footerDivider: { width: 40, height: 1, borderRadius: 1, marginBottom: 8 },
    footerText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    footerSubtext: { fontSize: 10 },
});