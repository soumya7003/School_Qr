/**
 * Settings Screen — Parent dashboard for emergency ID card management.
 * Updated: added Language selector + Theme toggle (Light / Dark / System)
 *
 * Schema fields:
 *   Token: status, expires_at, activated_at
 *   Card: card_number
 *   EmergencyProfile: visibility (PUBLIC | MINIMAL | HIDDEN)
 *   ScanLog: result, ip_city, ip_region, scan_purpose, created_at
 *   ScanAnomaly: reason, resolved
 *   ParentUser: phone, is_phone_verified
 *   LocationConsent: enabled
 *   StudentUpdateRequest: status
 */

import Screen from '@/src/components/common/Screen';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { useColorScheme } from '@/src/hooks/useTheme'; // your theme hook
import { colors, radius, spacing, typography } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronRight = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconScan = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Rect x={9} y={9} width={6} height={6} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const IconShield = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconEye = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const IconBell = ({ color = colors.success }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconMapPin = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const IconPhone = ({ color = colors.warning }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconGlobe = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconMoon = ({ color = colors.textTertiary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconLogout = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconClock = ({ color = colors.textTertiary }) => (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconWarning = ({ color = colors.warning }) => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconInfo = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5"
            stroke={colors.primary} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenStatusMeta(status) {
    switch (status) {
        case 'ACTIVE': return { label: 'Active', color: colors.success, bg: colors.successBg };
        case 'INACTIVE': return { label: 'Inactive', color: colors.textTertiary, bg: colors.surface3 };
        case 'ISSUED': return { label: 'Issued', color: colors.warning, bg: colors.warningBg };
        case 'REVOKED': return { label: 'Revoked', color: colors.primary, bg: colors.primaryBg };
        case 'EXPIRED': return { label: 'Expired', color: colors.primary, bg: colors.primaryBg };
        case 'UNASSIGNED': return { label: 'Unassigned', color: colors.textTertiary, bg: colors.surface3 };
        default: return { label: status ?? '—', color: colors.textTertiary, bg: colors.surface3 };
    }
}

function visibilityLabel(v) {
    if (v === 'PUBLIC') return 'Full Info Visible';
    if (v === 'MINIMAL') return 'Name & Contacts Only';
    if (v === 'HIDDEN') return 'Hidden';
    return '—';
}

function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

// ─── Language data ────────────────────────────────────────────────────────────

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

// ─── Theme options ────────────────────────────────────────────────────────────

const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
];

// ─── Language picker modal ────────────────────────────────────────────────────

function LanguageModal({ visible, current, onSelect, onClose }) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalSheet}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Select Language</Text>
                    {LANGUAGES.map(lang => (
                        <TouchableOpacity
                            key={lang.code}
                            style={styles.langRow}
                            onPress={() => { onSelect(lang.code); onClose(); }}
                            activeOpacity={0.7}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.langNative}>{lang.native}</Text>
                                <Text style={styles.langLabel}>{lang.label}</Text>
                            </View>
                            {current === lang.code && <CheckIcon />}
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Theme picker (inline 3-segment) ─────────────────────────────────────────

function ThemeSegment({ value, onChange }) {
    return (
        <View style={styles.themeSegment}>
            {THEME_OPTIONS.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    style={[
                        styles.themeOption,
                        value === opt.value && styles.themeOptionActive,
                    ]}
                    onPress={() => onChange(opt.value)}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.themeOptionText,
                        value === opt.value && styles.themeOptionTextActive,
                    ]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupLabel({ label }) {
    return <Text style={styles.groupLabel}>{label}</Text>;
}

function Row({ icon, iconBg, title, subtitle, value, onPress, toggle, toggleVal, onToggle, danger, badge, children }) {
    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
            <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, danger && { color: colors.primary }]}>{title}</Text>
                {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
                {children}
            </View>
            {badge ? (
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
            ) : null}
            {value ? <Text style={styles.rowValue}>{value}</Text> : null}
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.surface3, true: colors.primary }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.surface3}
                />
            ) : !danger && !children ? (
                <ChevronRight />
            ) : null}
        </TouchableOpacity>
    );
}

function Group({ label, delay = 0, children }) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.group}>
            <GroupLabel label={label} />
            <View style={styles.groupCard}>{children}</View>
        </Animated.View>
    );
}

// ─── Card status block ────────────────────────────────────────────────────────

function CardStatusBlock({ token, card }) {
    if (!token && !card) return null;
    const meta = tokenStatusMeta(token?.status);
    const isExpiringSoon = token?.expires_at &&
        (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;

    return (
        <View style={styles.cardBlock}>
            <View style={styles.cardBlockRow}>
                <Text style={styles.cardBlockLabel}>Card No.</Text>
                <Text style={styles.cardBlockVal}>{card?.card_number ?? '—'}</Text>
            </View>
            <View style={styles.cardBlockDivider} />
            <View style={styles.cardBlockRow}>
                <Text style={styles.cardBlockLabel}>Status</Text>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
            </View>
            <View style={styles.cardBlockRow}>
                <Text style={styles.cardBlockLabel}>Valid Until</Text>
                <Text style={[styles.cardBlockVal, isExpiringSoon && { color: colors.warning }]}>
                    {fmtDate(token?.expires_at)}{isExpiringSoon ? '  ⚠️' : ''}
                </Text>
            </View>
            {token?.activated_at && (
                <View style={styles.cardBlockRow}>
                    <Text style={styles.cardBlockLabel}>Activated</Text>
                    <Text style={styles.cardBlockVal}>{fmtDate(token.activated_at)}</Text>
                </View>
            )}
        </View>
    );
}

// ─── Scan history preview ─────────────────────────────────────────────────────

function ScanHistoryPreview({ scans = [], anomalyCount = 0, onViewAll }) {
    const resultDot = (result) => {
        if (result === 'SUCCESS') return colors.success;
        if (result === 'INVALID' || result === 'ERROR') return colors.primary;
        return colors.warning;
    };
    const purposeLabel = (p) => {
        if (p === 'EMERGENCY') return '🆘 Emergency';
        if (p === 'REGISTRATION') return '🔗 Registration';
        return '👁 Scan';
    };

    return (
        <View style={styles.scanPreviewWrap}>
            {anomalyCount > 0 && (
                <View style={styles.anomalyBanner}>
                    <IconWarning />
                    <Text style={styles.anomalyText}>
                        {anomalyCount} suspicious scan{anomalyCount > 1 ? 's' : ''} detected
                    </Text>
                    <TouchableOpacity onPress={onViewAll}>
                        <Text style={styles.anomalyLink}>Review →</Text>
                    </TouchableOpacity>
                </View>
            )}
            {scans.length === 0 ? (
                <View style={styles.scanEmpty}>
                    <Text style={styles.scanEmptyText}>No scans yet — card hasn't been used</Text>
                </View>
            ) : (
                scans.slice(0, 3).map((s, i) => (
                    <View key={s.id ?? i} style={[styles.scanRow, i < 2 && styles.scanRowBorder]}>
                        <View style={[styles.scanDot, { backgroundColor: resultDot(s.result) }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.scanPurpose}>{purposeLabel(s.scan_purpose)}</Text>
                            <View style={styles.scanMeta}>
                                <IconClock />
                                <Text style={styles.scanTime}>{fmtDateTime(s.created_at)}</Text>
                                {(s.ip_city || s.ip_region) ? (
                                    <Text style={styles.scanLocation}>
                                        · {[s.ip_city, s.ip_region].filter(Boolean).join(', ')}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <Text style={[styles.scanResult, { color: resultDot(s.result) }]}>
                            {s.result}
                        </Text>
                    </View>
                ))
            )}
            <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View Full Scan History →</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Pending updates banner ───────────────────────────────────────────────────

function PendingUpdatesBanner({ requests = [] }) {
    const pending = requests.filter(r => r.status === 'PENDING');
    const rejected = requests.filter(r => r.status === 'REJECTED');
    if (!pending.length && !rejected.length) return null;
    return (
        <View style={styles.updatesBanner}>
            {pending.length > 0 && (
                <View style={styles.updatesBannerRow}>
                    <IconClock color={colors.warning} />
                    <Text style={styles.updatesBannerText}>
                        {pending.length} profile update{pending.length > 1 ? 's' : ''} pending school approval
                    </Text>
                </View>
            )}
            {rejected.length > 0 && (
                <View style={styles.updatesBannerRow}>
                    <IconWarning color={colors.primary} />
                    <Text style={[styles.updatesBannerText, { color: colors.primary }]}>
                        {rejected.length} update{rejected.length > 1 ? 's' : ''} rejected — tap to review
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const router = useRouter();
    const { parentUser, logout } = useAuthStore();
    const {
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
    } = useProfileStore();

    const { theme, setTheme } = useColorScheme?.() ?? { theme: 'system', setTheme: () => { } };

    // Toggles
    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scanAlerts ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomalyAlerts ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);

    // Language
    const [lang, setLang] = useState('en');
    const [langModalOpen, setLangModal] = useState(false);

    const unresolvedAnomalies = (anomalies ?? []).filter(a => !a.resolved);
    const initial = parentUser?.phone?.[0] ?? 'P';
    const lastFour = parentUser?.phone?.slice(-4) ?? '••••';

    const currentLang = LANGUAGES.find(l => l.code === lang);

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            <LanguageModal
                visible={langModalOpen}
                current={lang}
                onSelect={setLang}
                onClose={() => setLangModal(false)}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
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

                {/* ── GROUP: Physical Card ── */}
                <Group label="Physical Card" delay={120}>
                    <CardStatusBlock token={token} card={card} />
                    <Row
                        icon={<IconScan color={colors.primary} />}
                        iconBg={colors.primaryBg}
                        title="Deactivate / Replace Card"
                        subtitle="Lost or damaged? Lock it instantly"
                        onPress={() => router.push('/(app)/qr')}
                    />
                </Group>

                {/* ── GROUP: Scan History ── */}
                <Group label="Scan History" delay={160}>
                    <ScanHistoryPreview
                        scans={recentScans ?? []}
                        anomalyCount={unresolvedAnomalies.length}
                        onViewAll={() => router.push('/(app)/scan-history')}
                    />
                </Group>

                {/* ── GROUP: Emergency Profile ── */}
                <Group label="Emergency Profile" delay={200}>
                    <Row
                        icon={<IconEye color={colors.info} />}
                        iconBg={colors.infoBg}
                        title="Who Can See What"
                        subtitle={visibilityLabel(emergencyProfile?.visibility)}
                        onPress={() => router.push('/(app)/visibility')}
                    />
                    <Row
                        icon={<IconShield color={colors.primary} />}
                        iconBg={colors.primaryBg}
                        title="Emergency Info"
                        subtitle={`Blood group, allergies, doctor — ${student?.first_name ?? 'child'}'s card`}
                        onPress={() => router.push('/(app)/updates')}
                    />
                </Group>

                {/* ── GROUP: Notifications ── */}
                <Group label="Notifications" delay={240}>
                    <Row
                        icon={<IconBell color={colors.success} />}
                        iconBg={colors.successBg}
                        title="Scan Alerts"
                        subtitle="Notify when card is scanned"
                        toggle
                        toggleVal={scanAlerts}
                        onToggle={(v) => { setScanAlerts(v); updateNotificationPref?.('scanAlerts', v); }}
                    />
                    <Row
                        icon={<IconWarning color={colors.warning} />}
                        iconBg={colors.warningBg}
                        title="Anomaly Alerts"
                        subtitle="Suspicious scan activity warnings"
                        toggle
                        toggleVal={anomalyAlerts}
                        onToggle={(v) => { setAnomalyAlerts(v); updateNotificationPref?.('anomalyAlerts', v); }}
                    />
                    <Row
                        icon={<IconMapPin color={colors.info} />}
                        iconBg={colors.infoBg}
                        title="Location on Scan"
                        subtitle="Capture GPS when card is scanned"
                        toggle
                        toggleVal={locationEnabled}
                        onToggle={(v) => { setLocation(v); updateLocationConsent?.(v); }}
                    />
                </Group>

                {/* ── GROUP: Appearance ── */}
                <Group label="Appearance" delay={270}>
                    {/* Language */}
                    <Row
                        icon={<IconGlobe color={colors.info} />}
                        iconBg={colors.infoBg}
                        title="Language"
                        subtitle={currentLang ? `${currentLang.native} · ${currentLang.label}` : 'English'}
                        onPress={() => setLangModal(true)}
                    />
                    {/* Theme — inline segment, no chevron */}
                    <View style={styles.themeRow}>
                        <View style={[styles.rowIcon, { backgroundColor: colors.surface3 }]}>
                            <IconMoon color={colors.textTertiary} />
                        </View>
                        <View style={styles.rowBody}>
                            <Text style={styles.rowTitle}>Theme</Text>
                            <ThemeSegment value={theme} onChange={setTheme} />
                        </View>
                    </View>
                </Group>

                {/* ── GROUP: Account ── */}
                <Group label="Account" delay={300}>
                    <Row
                        icon={<IconPhone color={colors.warning} />}
                        iconBg={colors.warningBg}
                        title="Change Phone Number"
                        subtitle="OTP verification required"
                        onPress={() => router.push('/(app)/change-phone')}
                    />
                    <Row
                        icon={<IconInfo color={colors.info} />}
                        iconBg={colors.infoBg}
                        title="Help & Support"
                        onPress={() => router.push('/(app)/support')}
                    />
                    <Row
                        icon={<IconLogout />}
                        iconBg={colors.primaryBg}
                        title="Log Out"
                        onPress={handleLogout}
                        danger
                    />
                </Group>

                {/* ── Footer ── */}
                <Animated.View entering={FadeInDown.delay(330).duration(400)} style={styles.footer}>
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
        width: 44,
        height: 44,
        borderRadius: radius.avatarLg,
        backgroundColor: colors.primaryBg,
        borderWidth: 1.5,
        borderColor: `rgba(232,52,42,0.25)`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    parentInitial: { ...typography.h4, color: colors.primary },
    parentPhone: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '600' },
    parentVerifyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: 3 },
    verifyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    verifyText: { ...typography.labelXs, color: colors.success },
    parentEnding: { ...typography.labelSm, color: colors.textTertiary, fontVariant: ['tabular-nums'] },

    // ── Pending updates banner ────────────────────
    updatesBanner: {
        backgroundColor: colors.warningBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(245,158,11,0.25)`,
        padding: spacing[3],
        gap: spacing[2],
    },
    updatesBannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    updatesBannerText: { ...typography.labelSm, color: colors.warning, flex: 1 },

    // ── Group ─────────────────────────────────────
    group: { gap: spacing[1.5] },
    groupLabel: { ...typography.overline, color: colors.textTertiary, paddingLeft: spacing[1] },
    groupCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },

    // ── Row ───────────────────────────────────────
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowBody: { flex: 1, gap: spacing[0.5] },
    rowTitle: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '500' },
    rowSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 1 },
    rowValue: { ...typography.labelSm, color: colors.textTertiary },

    // ── Badge ─────────────────────────────────────
    badge: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.chipFull },
    badgeText: { ...typography.labelXs, fontWeight: '700', fontSize: 10 },

    // ── Card block ────────────────────────────────
    cardBlock: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    cardBlockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardBlockLabel: { ...typography.labelXs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
    cardBlockVal: { ...typography.labelMd, color: colors.textPrimary, fontWeight: '600' },
    cardBlockDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing[0.5] },

    // ── Scan preview ──────────────────────────────
    scanPreviewWrap: { gap: 0 },
    anomalyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.warningBg,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    anomalyText: { ...typography.labelSm, color: colors.warning, flex: 1 },
    anomalyLink: { ...typography.labelSm, color: colors.warning, fontWeight: '700' },
    scanEmpty: { paddingHorizontal: spacing[4], paddingVertical: spacing[5], alignItems: 'center' },
    scanEmptyText: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center' },
    scanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    scanRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    scanDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    scanPurpose: { ...typography.labelSm, color: colors.textPrimary, fontWeight: '500' },
    scanMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: 2 },
    scanTime: { ...typography.labelXs, color: colors.textTertiary },
    scanLocation: { ...typography.labelXs, color: colors.textTertiary },
    scanResult: { ...typography.labelXs, fontWeight: '700', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
    viewAllBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.border },
    viewAllText: { ...typography.labelSm, color: colors.primary, fontWeight: '600' },

    // ── Theme row (no chevron) ─────────────────────
    themeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    themeSegment: {
        flexDirection: 'row',
        backgroundColor: colors.surface3,
        borderRadius: radius.md,
        padding: 3,
        marginTop: spacing[2],
        alignSelf: 'flex-start',
        gap: 2,
    },
    themeOption: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: radius.sm,
    },
    themeOptionActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    themeOptionText: { ...typography.labelSm, color: colors.textTertiary, fontWeight: '500' },
    themeOptionTextActive: { color: colors.textPrimary, fontWeight: '700' },

    // ── Language modal ────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.cardLg,
        borderTopRightRadius: radius.cardLg,
        padding: spacing[5],
        paddingBottom: spacing[8],
        gap: spacing[1],
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing[4],
    },
    modalTitle: {
        ...typography.h4,
        color: colors.textPrimary,
        marginBottom: spacing[3],
    },
    langRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    langNative: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '600' },
    langLabel: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2 },

    // ── Footer ────────────────────────────────────
    footer: { alignItems: 'center', paddingTop: spacing[2], gap: spacing[1] },
    footerText: { ...typography.labelSm, color: colors.textTertiary, fontWeight: '600' },
    footerSub: { ...typography.labelXs, color: colors.textTertiary },
});