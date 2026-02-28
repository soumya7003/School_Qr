/**
 * Settings Screen — Parent profile, notifications, visibility, logout.
 * Matches Flow 03 (Settings Screen) from the UI/UX spec.
 */

import Screen from '@/src/components/common/Screen';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronRight = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const StarIcon = () => (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill={colors.white}>
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
);

// ── SettingsItem ──────────────────────────────────────────────────────────────
function SettingsItem({ icon, iconBg, title, value, onPress, toggle, toggleVal, onToggle, danger }) {
    return (
        <TouchableOpacity
            style={styles.item}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <Text style={[styles.itemTitle, danger && { color: colors.primary }]}>{title}</Text>
            {value && <Text style={styles.itemValue}>{value}</Text>}
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.surface3, true: colors.primary }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.surface3}
                    style={{ marginLeft: 'auto' }}
                />
            ) : (
                !danger && <View style={{ marginLeft: 'auto' }}><ChevronRight /></View>
            )}
        </TouchableOpacity>
    );
}

// ── Group ─────────────────────────────────────────────────────────────────────
function SettingsGroup({ label, children }) {
    return (
        <View style={styles.group}>
            <Text style={styles.groupLabel}>{label}</Text>
            <View style={styles.groupItems}>{children}</View>
        </View>
    );
}

// ── Svg icons ─────────────────────────────────────────────────────────────────
const CardIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={2} y={5} width={20} height={14} rx={2} stroke={colors.primary} strokeWidth={1.8} />
        <Path d="M2 10h20" stroke={colors.primary} strokeWidth={1.8} />
    </Svg>
);
const ProfileIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={colors.info} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={7} r={4} stroke={colors.info} strokeWidth={1.8} />
    </Svg>
);
const MedicalIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={colors.warning} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const BellIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={colors.success} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const ChatIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
            stroke={colors.info} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const ShieldIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={colors.primary} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const LockIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={colors.warning} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={colors.warning} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const InfoIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={colors.info} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={colors.info} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);
const LogoutIconSvg = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke={colors.primary} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const router = useRouter();
    const { parentUser, logout } = useAuthStore();
    const { student, subscription } = useProfileStore();
    const [scanAlerts, setScanAlerts] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);

    const isPremium = ['TRIALING', 'ACTIVE'].includes(subscription?.status);
    const initial = parentUser?.phone?.[3] ?? 'P';

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
                    <Text style={styles.pageTitle}>Settings</Text>
                    {isPremium && (
                        <LinearGradient
                            colors={['#F59E0B', '#EF4444']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.premiumBadge}
                        >
                            <StarIcon />
                            <Text style={styles.premiumText}>PREMIUM</Text>
                        </LinearGradient>
                    )}
                </Animated.View>

                {/* Parent mini card */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <TouchableOpacity style={styles.parentCard} activeOpacity={0.75}>
                        <View style={styles.parentAvatar}>
                            <Text style={styles.parentInitial}>{initial.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.parentName}>Priya Sharma</Text>
                            <Text style={styles.parentPhone}>{parentUser?.phone ?? '+91 98765 43210'}</Text>
                        </View>
                        <ChevronRight />
                    </TouchableOpacity>
                </Animated.View>

                {/* Card & Profile */}
                <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                    <SettingsGroup label="Card & Profile">
                        <SettingsItem
                            icon={<CardIconSvg />}
                            iconBg={colors.primaryBg}
                            title="My Card"
                            value="Active"
                            onPress={() => router.push('/(app)/qr')}
                        />
                        <SettingsItem
                            icon={<ProfileIconSvg />}
                            iconBg={colors.infoBg}
                            title="Student Profile"
                            value={`${student?.first_name ?? ''} ${student?.last_name?.[0] ?? ''}.`}
                            onPress={() => router.push('/(app)/updates')}
                        />
                        <SettingsItem
                            icon={<MedicalIconSvg />}
                            iconBg={colors.warningBg}
                            title="Emergency Profile"
                            value="Public"
                            onPress={() => router.push('/(app)/updates')}
                        />
                    </SettingsGroup>
                </Animated.View>

                {/* Notifications */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <SettingsGroup label="Notifications">
                        <SettingsItem
                            icon={<BellIconSvg />}
                            iconBg={colors.successBg}
                            title="Scan Alerts"
                            toggle
                            toggleVal={scanAlerts}
                            onToggle={setScanAlerts}
                        />
                        <SettingsItem
                            icon={<ChatIconSvg />}
                            iconBg={colors.infoBg}
                            title="Push Notifications"
                            toggle
                            toggleVal={pushNotifs}
                            onToggle={setPushNotifs}
                        />
                    </SettingsGroup>
                </Animated.View>

                {/* Security */}
                <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                    <SettingsGroup label="Security & Privacy">
                        <SettingsItem
                            icon={<ShieldIconSvg />}
                            iconBg={colors.primaryBg}
                            title="Profile Visibility"
                            value="Public"
                            onPress={() => { }}
                        />
                        <SettingsItem
                            icon={<LockIconSvg />}
                            iconBg={colors.warningBg}
                            title="Change Phone"
                            onPress={() => { }}
                        />
                    </SettingsGroup>
                </Animated.View>

                {/* Account */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <SettingsGroup label="Account">
                        <SettingsItem
                            icon={<InfoIconSvg />}
                            iconBg={colors.infoBg}
                            title="Help & Support"
                            onPress={() => { }}
                        />
                        <SettingsItem
                            icon={<LogoutIconSvg />}
                            iconBg={colors.primaryBg}
                            title="Log Out"
                            onPress={handleLogout}
                            danger
                        />
                    </SettingsGroup>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[8],
        gap: spacing[4],
    },

    // ── Header ────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pageTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        height: 30,
        borderRadius: radius.md,
        paddingHorizontal: spacing[2.5],
    },
    premiumText: {
        ...typography.overline,
        color: colors.white,
        fontSize: 10,
    },

    // ── Parent card ───────────────────────────────
    parentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3.5],
    },
    parentAvatar: {
        width: 46,
        height: 46,
        borderRadius: radius.avatarLg,
        backgroundColor: colors.surface3,
        borderWidth: 1.5,
        borderColor: `rgba(232,52,42,0.3)`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    parentInitial: {
        ...typography.h4,
        color: colors.primary,
    },
    parentName: {
        ...typography.h5,
        color: colors.textPrimary,
    },
    parentPhone: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    // ── Group ─────────────────────────────────────
    group: {
        gap: spacing[1.5],
    },
    groupLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        paddingLeft: spacing[1],
    },
    groupItems: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },

    // ── Item ──────────────────────────────────────
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemIcon: {
        width: 34,
        height: 34,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    itemTitle: {
        ...typography.bodyMd,
        color: colors.textPrimary,
        fontWeight: '500',
        flex: 1,
    },
    itemValue: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },
});