/**
 * Home Screen — Dashboard with student card, scan activity, quick actions.
 * Matches Flow 02 & 03 from the UI/UX spec.
 */

import Badge from '@/src/components/common/Badge';
import Screen from '@/src/components/common/Screen';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { useScanStore } from '@/src/features/scans/scan.store';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────

const BellIcon = ({ dot }) => (
    <View>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke={colors.textSecondary} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        {dot && <View style={styles.notifDot} />}
    </View>
);

const StarIcon = () => (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill={colors.white}>
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
);

const QrIcon = ({ color }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color ?? colors.primary} strokeWidth={2} />
        <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color ?? colors.primary} strokeWidth={2} />
        <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color ?? colors.primary} strokeWidth={2} />
        <Path d="M14 14h2v2h-2zM18 14h3M20 16v3M14 18h2v3M18 20h3"
            stroke={color ?? colors.primary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const CheckIcon = ({ color }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M22 11.08V12a10 10 0 11-5.93-9.14"
            stroke={color ?? colors.success} strokeWidth={2} strokeLinecap="round" />
        <Polyline points="22 4 12 14.01 9 11.01"
            stroke={color ?? colors.success} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PhoneIcon = ({ color }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 16 19.79 19.79 0 011.61 7.36 2 2 0 013.6 5.18h3a2 2 0 012 1.72"
            stroke={color ?? colors.info} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

const EditIcon = ({ color }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            stroke={color ?? colors.warning} strokeWidth={2} strokeLinecap="round" />
        <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={color ?? colors.warning} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

const InfoIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={colors.primary} strokeWidth={2} />
        <Path d="M12 8v4M12 16h.01" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

const ScanSmallIcon = ({ color }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M3 4a1 1 0 011-1h4v4H4a1 1 0 01-1-1V4zM16 3h4a1 1 0 011 1v3a1 1 0 01-1 1h-4V3z"
            stroke={color ?? colors.success} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

function QuickCard({ icon, title, subtitle, onPress }) {
    return (
        <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.75}>
            <View style={styles.quickIcon}>{icon}</View>
            <Text style={styles.quickTitle}>{title}</Text>
            <Text style={styles.quickSub}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

function ScanItem({ item }) {
    const time = new Date(item.created_at);
    const isToday = time.toDateString() === new Date().toDateString();
    const timeStr = isToday
        ? time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Yesterday';

    const isEmergency = item.scan_purpose === 'EMERGENCY';
    const iconColor = isEmergency ? colors.primary : colors.success;
    const iconBg = isEmergency ? colors.primaryBg : colors.successBg;

    return (
        <View style={styles.scanItem}>
            <View style={[styles.scanIcon, { backgroundColor: iconBg }]}>
                <ScanSmallIcon color={iconColor} />
            </View>
            <View style={styles.scanInfo}>
                <Text style={styles.scanTitle}>{item._label}</Text>
                <Text style={styles.scanSub}>{item._sublabel}</Text>
            </View>
            <Text style={styles.scanTime}>{timeStr}</Text>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const router = useRouter();
    const {
        student, emergencyProfile, token,
        subscription, isProfileComplete, isCardActive, toggleCardStatus,
    } = useProfileStore();
    const { recentScans, todayCount } = useScanStore();

    const fullName = `${student?.first_name ?? ''} ${student?.last_name ?? ''}`.trim();
    const initials = (student?.first_name?.[0] ?? '') + (student?.last_name?.[0] ?? '');
    const classLabel = student?.class
        ? `Class ${student.class}${student.section ? `-${student.section}` : ''}`
        : '';
    const schoolShort = student?.school?.name ?? '';
    const isPremium = ['TRIALING', 'ACTIVE'].includes(subscription?.status);
    const profileDone = isProfileComplete();
    const cardActive = isCardActive();
    const scans = recentScans(3);
    const scanCount = todayCount();

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* ── Top nav ── */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.nav}>
                    <View>
                        <Text style={styles.navGreet}>
                            {cardActive ? 'Good morning 👋' : 'Welcome back 👋'}
                        </Text>
                        <Text style={styles.navName}>Priya Sharma</Text>
                    </View>
                    <View style={styles.navRight}>
                        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
                            <BellIcon dot />
                        </TouchableOpacity>
                        {isPremium && (
                            <LinearGradient
                                colors={['#F59E0B', '#EF4444']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.premiumBadge}
                            >
                                <StarIcon />
                                <Text style={styles.premiumText}>PRO</Text>
                            </LinearGradient>
                        )}
                    </View>
                </Animated.View>

                {/* ── Complete profile banner (only shown if incomplete) ── */}
                {!profileDone && (
                    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.completeBanner}>
                        <InfoIcon />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerTitle}>Complete your profile</Text>
                            <Text style={styles.bannerBody}>
                                Add emergency contacts, blood group, and medical info to activate your card fully.
                            </Text>
                            <TouchableOpacity
                                style={styles.bannerBtn}
                                onPress={() => router.push('/(app)/updates')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.bannerBtnText}>Complete Profile →</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* ── Student hero card ── */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)}>
                    <View style={styles.studentCard}>
                        <LinearGradient
                            colors={[colors.primary, colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardAccent}
                        />
                        <View style={styles.cardInner}>
                            {/* Avatar */}
                            <View style={styles.avatarWrap}>
                                <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
                            </View>

                            {/* Info */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.studentName}>{fullName}</Text>
                                <Text style={styles.studentMeta}>{classLabel} · {schoolShort}</Text>
                                <View style={styles.statusRow}>
                                    <Badge status={token?.status ?? 'INACTIVE'} size="sm" />
                                    {emergencyProfile?.blood_group && (
                                        <Text style={styles.bloodLabel}>
                                            {emergencyProfile.blood_group} blood
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Toggle row */}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>
                                {cardActive ? 'Card Active · Tap to deactivate' : 'Card Inactive · Tap to activate'}
                            </Text>
                            <Switch
                                value={cardActive}
                                onValueChange={toggleCardStatus}
                                trackColor={{ false: colors.surface3, true: colors.primary }}
                                thumbColor={colors.white}
                                ios_backgroundColor={colors.surface3}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* ── Quick Actions ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
                    </View>
                    <View style={styles.quickGrid}>
                        <QuickCard
                            icon={<QrIcon />}
                            title="Show QR"
                            subtitle="Display card for scanning"
                            onPress={() => router.push('/(app)/qr')}
                        />
                        <QuickCard
                            icon={<CheckIcon />}
                            title="Scan History"
                            subtitle={`${scanCount} scan${scanCount !== 1 ? 's' : ''} today`}
                            onPress={() => { }}
                        />
                        <QuickCard
                            icon={<PhoneIcon />}
                            title="Emergency"
                            subtitle="2 contacts saved"
                            onPress={() => router.push('/(app)/updates')}
                        />
                        <QuickCard
                            icon={<EditIcon />}
                            title="Edit Profile"
                            subtitle="Update details"
                            onPress={() => router.push('/(app)/updates')}
                        />
                    </View>
                </Animated.View>

                {/* ── Recent Scans ── */}
                <Animated.View entering={FadeInDown.delay(250).duration(500)}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Recent Scans</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>View all</Text></TouchableOpacity>
                    </View>
                    {scans.length === 0 ? (
                        <View style={styles.emptyScans}>
                            <Text style={styles.emptyText}>No scans yet. Your activity will appear here.</Text>
                        </View>
                    ) : (
                        <View style={styles.scanList}>
                            {scans.map((item) => <ScanItem key={item.id} item={item} />)}
                        </View>
                    )}
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

const QUICK_ICON_COLORS = {
    qr: { bg: colors.primaryBg, color: colors.primary },
    check: { bg: colors.successBg, color: colors.success },
    phone: { bg: colors.infoBg, color: colors.info },
    edit: { bg: colors.warningBg, color: colors.warning },
};

const styles = StyleSheet.create({
    scroll: {
        paddingTop: spacing[3],
        paddingHorizontal: spacing.screenH,
        paddingBottom: spacing[6],
        gap: spacing[4],
    },

    // ── Nav ───────────────────────────────────────
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing[2],
    },
    navGreet: {
        ...typography.labelSm,
        color: colors.textTertiary,
        marginBottom: 2,
    },
    navName: {
        ...typography.h4,
        color: colors.textPrimary,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2.5],
    },
    notifBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 0, right: 0,
        width: 7, height: 7,
        backgroundColor: colors.primary,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.screenBg,
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

    // ── Complete banner ───────────────────────────
    completeBanner: {
        flexDirection: 'row',
        gap: spacing[3],
        alignItems: 'flex-start',
        backgroundColor: colors.primaryBgSoft,
        borderWidth: 1.5,
        borderColor: `rgba(232,52,42,0.25)`,
        borderRadius: radius.card,
        padding: spacing[4],
    },
    bannerTitle: {
        ...typography.h5,
        color: colors.textPrimary,
        marginBottom: spacing[1],
    },
    bannerBody: {
        ...typography.bodySm,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    bannerBtn: {
        marginTop: spacing[2.5],
        alignSelf: 'flex-start',
        backgroundColor: colors.primary,
        borderRadius: radius.btnSm,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5] + 1,
    },
    bannerBtnText: {
        ...typography.btnSm,
        color: colors.white,
    },

    // ── Student card ──────────────────────────────
    studentCard: {
        backgroundColor: colors.surface2,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.md,
    },
    cardAccent: {
        height: 4,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
    },
    avatarWrap: {
        width: 64,
        height: 64,
        borderRadius: radius.avatarLg,
        backgroundColor: colors.surface3,
        borderWidth: 2,
        borderColor: `rgba(232,52,42,0.3)`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarInitials: {
        ...typography.h3,
        color: colors.primary,
    },
    studentName: {
        ...typography.h4,
        color: colors.textPrimary,
        marginBottom: 3,
    },
    studentMeta: {
        ...typography.bodyXs,
        color: colors.textSecondary,
        marginBottom: 5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    bloodLabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    toggleLabel: {
        ...typography.bodySm,
        color: colors.textSecondary,
        flex: 1,
        marginRight: spacing[3],
    },

    // ── Quick actions ─────────────────────────────
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        ...typography.h5,
        color: colors.textPrimary,
    },
    seeAll: {
        ...typography.labelMd,
        color: colors.primary,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2.5],
        marginTop: spacing[2],
    },
    quickCard: {
        width: '47.5%',
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3.5],
        gap: spacing[2],
    },
    quickIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.primaryBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    quickSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },

    // ── Scan list ─────────────────────────────────
    scanList: {
        gap: spacing[2],
        marginTop: spacing[2],
    },
    scanItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        padding: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
    },
    scanIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    scanInfo: { flex: 1 },
    scanTitle: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    scanSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    scanTime: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
    emptyScans: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[5],
        alignItems: 'center',
        marginTop: spacing[2],
    },
    emptyText: {
        ...typography.bodySm,
        color: colors.textTertiary,
        textAlign: 'center',
    },
});