/**
 * app/(app)/settings.jsx
 * Settings — Multi-child support with Notion-style avatars
 * Production ready with mock data support
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
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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
        <View style={[avatar.container, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.bg }]}>
            <Text style={[avatar.text, { fontSize: size * 0.4, color: colors.text, fontWeight: '600' }]}>
                {initial}
            </Text>
        </View>
    );
}

const avatar = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    text: { fontWeight: '600' },
});

// ── Child Card Component ───────────────────────────────────────────────────────
function ChildCard({ student, isActive, onPress, colorIndex, C }) {
    const name = student.first_name || student.last_name || 'Child';
    const hasActiveCard = student.token?.status === 'ACTIVE';

    return (
        <TouchableOpacity
            style={[
                childCard.container,
                {
                    backgroundColor: isActive ? C.primaryBg : C.s2,
                    borderColor: isActive ? C.primaryBd : C.bd,
                    borderWidth: isActive ? 1.5 : 1,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <NotionAvatar name={name} size={48} colorIndex={colorIndex} />
            <Text style={[childCard.name, { color: isActive ? C.primary : C.tx }]} numberOfLines={1}>
                {name}
            </Text>
            {student.class && (
                <Text style={[childCard.class, { color: C.tx3 }]} numberOfLines={1}>
                    {student.class}{student.section ? ` • ${student.section}` : ''}
                </Text>
            )}
            {hasActiveCard && (
                <View style={[childCard.badge, { backgroundColor: C.okBg }]}>
                    <View style={[childCard.dot, { backgroundColor: C.ok }]} />
                    <Text style={[childCard.badgeText, { color: C.ok }]}>Active</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const childCard = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        minWidth: 100,
        gap: 6,
    },
    name: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
    class: { fontSize: 11, textAlign: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    badgeText: { fontSize: 9, fontWeight: '600' },
});

// ── Add Child Button ──────────────────────────────────────────────────────────
function AddChildButton({ onPress, canAdd, C }) {
    return (
        <TouchableOpacity
            style={[addChild.container, { borderColor: C.bd, backgroundColor: C.s2, borderStyle: 'dashed' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[addChild.iconWrap, { backgroundColor: C.s3 }]}>
                <Text style={[addChild.icon, { color: C.tx3 }]}>+</Text>
            </View>
            <Text style={[addChild.text, { color: C.tx3 }]}>
                {canAdd ? 'Add Child' : 'Upgrade'}
            </Text>
        </TouchableOpacity>
    );
}

const addChild = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        minWidth: 100,
        gap: 6,
    },
    iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    icon: { fontSize: 24, fontWeight: '300' },
    text: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, accent }) {
    return (
        <View style={section.container}>
            <View style={[section.line, { backgroundColor: accent }]} />
            <Text style={[section.title, { color: accent }]}>{title.toUpperCase()}</Text>
        </View>
    );
}

const section = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    line: { width: 3, height: 14, borderRadius: 2 },
    title: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});

// ── Settings Card ─────────────────────────────────────────────────────────────
function SettingsCard({ children, C }) {
    return (
        <View style={[card.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {children}
        </View>
    );
}

const card = StyleSheet.create({
    container: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});

// ── Settings Row ──────────────────────────────────────────────────────────────
function SettingsRow({ C, icon, iconBg, iconBorder, title, subtitle, onPress, isLast, rightElement, danger }) {
    const Wrapper = onPress ? TouchableOpacity : View;

    return (
        <Wrapper
            style={[row.container, !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[row.iconWrap, { backgroundColor: iconBg, borderColor: iconBorder }]}>
                {icon}
            </View>
            <View style={row.content}>
                <Text style={[row.title, { color: danger ? C.red : C.tx }]}>{title}</Text>
                {subtitle && <Text style={[row.subtitle, { color: C.tx3 }]}>{subtitle}</Text>}
            </View>
            {rightElement ? rightElement : (onPress && <IconChevronRight color={C.tx3} size={14} />)}
        </Wrapper>
    );
}

const row = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    iconWrap: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
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
            end={{ x: 1, y: 0 }}
            style={[parent.container, { borderColor: C.bd }]}
        >
            <View style={[parent.stripe, { backgroundColor: verified ? C.ok : C.amb }]} />
            <View style={parent.content}>
                <NotionAvatar name={name} size={56} colorIndex={0} />
                <View style={parent.info}>
                    <Text style={[parent.name, { color: C.tx }]}>{name}</Text>
                    <View style={parent.phoneRow}>
                        <Text style={[parent.phone, { color: C.tx2 }]}>{phoneNumber}</Text>
                        {verified ? (
                            <View style={[parent.verifiedBadge, { backgroundColor: C.okBg }]}>
                                <Text style={[parent.verifiedText, { color: C.ok }]}>Verified</Text>
                            </View>
                        ) : (
                            <View style={[parent.verifiedBadge, { backgroundColor: C.ambBg }]}>
                                <Text style={[parent.verifiedText, { color: C.amb }]}>Unverified</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const parent = StyleSheet.create({
    container: { flexDirection: 'row', borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
    stripe: { width: 4 },
    content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    info: { flex: 1, gap: 4 },
    name: { fontSize: 18, fontWeight: '700' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    phone: { fontSize: 13 },
    verifiedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    verifiedText: { fontSize: 10, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    console.log('[SettingsScreen] students count:', students?.length);
    console.log('[SettingsScreen] activeStudentId:', activeStudentId);
    console.log('[SettingsScreen] parentUser:', parentUser);
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { colors: C } = useTheme();
    const { parentUser, logout } = useAuthStore();

    const {
        students,
        activeStudentId,
        setActiveStudent,
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

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
    const [langModalOpen, setLangModal] = useState(false);
    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scan_notify_enabled ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomaly_notify_enabled ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);

    const unresolvedAnomalies = (anomalies ?? []).filter((a) => !a.resolved);
    const MAX_FREE_CHILDREN = 3;
    const canAddMore = students.length < MAX_FREE_CHILDREN;

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ],
        );
    };

    const handleAddChild = () => {
        if (!canAddMore) {
            Alert.alert(
                'Premium Feature',
                `You have ${MAX_FREE_CHILDREN} children already. Upgrade to Premium to add more.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', onPress: () => router.push('/(app)/plans') },
                ]
            );
        } else {
            router.push('/(app)/add-child');
        }
    };

    const activeStudent = student;
    const activeToken = token;
    const activeCard = card;
    const activeEmergency = emergencyProfile;

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <LanguageModal visible={langModalOpen} onClose={() => setLangModal(false)} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)}>
                    <Text style={[styles.pageTitle, { color: C.tx }]}>Settings</Text>
                    <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>
                        Manage your account and children
                    </Text>
                </Animated.View>

                {/* Parent Header */}
                <Animated.View entering={FadeInDown.delay(80).duration(350)}>
                    <ParentHeader parentUser={parentUser} C={C} />
                </Animated.View>

                {/* Child Switcher */}
                {students.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.switcherSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.switcherScroll}
                        >
                            {students.map((s, idx) => (
                                <ChildCard
                                    key={s.id}
                                    student={s}
                                    isActive={s.id === activeStudentId}
                                    onPress={() => setActiveStudent(s.id)}
                                    colorIndex={idx}
                                    C={C}
                                />
                            ))}
                            <AddChildButton onPress={handleAddChild} canAdd={canAddMore} C={C} />
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Pending Updates Banner */}
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(140).duration(350)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

                {/* Active Child Indicator */}
                {activeStudent && (
                    <Animated.View entering={FadeInDown.delay(160).duration(350)}>
                        <View style={styles.activeIndicator}>
                            <Text style={[styles.activeText, { color: C.tx2 }]}>
                                Active: {activeStudent.first_name || 'Child'}
                            </Text>
                            <View style={[styles.activeLine, { backgroundColor: C.bd }]} />
                        </View>
                    </Animated.View>
                )}

                {/* Physical Card Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(350)}>
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

                {/* Scan Activity Section */}
                <Animated.View entering={FadeInDown.delay(240).duration(350)}>
                    <SectionHeader title="Scan Activity" accent={C.blue} />
                    <SettingsCard C={C}>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push('/(app)/scan-history')}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* Emergency Profile Section */}
                <Animated.View entering={FadeInDown.delay(280).duration(350)}>
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

                {/* Security Section */}
                <Animated.View entering={FadeInDown.delay(320).duration(350)}>
                    <SectionHeader title="Security" accent={C.purp} />
                    <SettingsCard C={C}>
                        <BiometricRow isLast />
                    </SettingsCard>
                </Animated.View>

                {/* Notifications Section */}
                <Animated.View entering={FadeInDown.delay(360).duration(350)}>
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

                {/* Appearance Section */}
                <Animated.View entering={FadeInDown.delay(400).duration(350)}>
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

                {/* Account Section */}
                <Animated.View entering={FadeInDown.delay(440).duration(350)}>
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
                <Animated.View entering={FadeInDown.delay(480).duration(350)} style={styles.footer}>
                    <View style={[styles.footerDivider, { backgroundColor: C.bd2 }]} />
                    <Text style={[styles.footerText, { color: C.tx3 }]}>RESQID · v1.0.0</Text>
                    <Text style={[styles.footerSubtext, { color: C.tx3 }]}>Emergency ID Card Platform</Text>
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[5],
        paddingBottom: spacing[12],
        gap: 24,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 13,
    },
    switcherSection: {
        marginVertical: 4,
    },
    switcherScroll: {
        gap: 12,
        paddingHorizontal: 4,
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    activeText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    activeLine: {
        flex: 1,
        height: 1,
    },
    footer: {
        alignItems: 'center',
        gap: 6,
        paddingTop: 16,
        paddingBottom: 32,
    },
    footerDivider: {
        width: 40,
        height: 1,
        borderRadius: 1,
        marginBottom: 8,
    },
    footerText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    footerSubtext: {
        fontSize: 10,
    },
});