/**
 * Settings Screen — Professional dark UI
 * Aesthetic: "Command Center" — same dark design language as emergency.jsx / updates.jsx
 * All functionality preserved, zero childish elements.
 */

import Screen from '@/components/common/Screen';
import {
    IconBell,
    IconEye,
    IconGlobe,
    IconInfo,
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
import ScanHistoryPreview from "@/components/settings/ScanHistoryPreview";
import ThemeSegment from "@/components/settings/ThemeSegment";
import { LANGUAGES } from '@/constants/constants';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useColorScheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';
import { visibilityLabel } from '@/utils/helpers';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

// ─── Design tokens (matches updates.jsx / emergency.jsx) ─────────────────────
const T = {
    bg: "#07070A",
    s1: "#0C0C10",
    s2: "#111116",
    s3: "#17171E",
    s4: "#1E1E27",
    s5: "#25252F",
    bd: "rgba(255,255,255,0.07)",
    bd2: "rgba(255,255,255,0.12)",
    tx: "#F0F0F5",
    tx2: "rgba(240,240,245,0.62)",
    tx3: "rgba(240,240,245,0.32)",
    red: "#E8342A",
    redBg: "rgba(232,52,42,0.08)",
    redBd: "rgba(232,52,42,0.22)",
    ok: "#12A150",
    okBg: "rgba(18,161,80,0.08)",
    okBd: "rgba(18,161,80,0.22)",
    amb: "#D97706",
    ambBg: "rgba(217,119,6,0.08)",
    ambBd: "rgba(217,119,6,0.22)",
    blue: "#3B82F6",
    blueBg: "rgba(59,130,246,0.08)",
    blueBd: "rgba(59,130,246,0.22)",
    purp: "#8B5CF6",
    purpBg: "rgba(139,92,246,0.08)",
    purpBd: "rgba(139,92,246,0.22)",
};

// ─── Inline SVG icons (for rows that need custom ones) ───────────────────────
const Ic = {
    ChevronRight: ({ c = T.tx3, s = 14 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Shield: ({ c = T.ok, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2L4 6v7c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6L12 2z" stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    ),
    Check: ({ c = T.ok, s = 12 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    AlertTriangle: ({ c = T.amb, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M12 9v4M12 17h.01" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    ),
    LogOut: ({ c = T.red, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
};

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ label, accent = T.tx3 }) {
    return (
        <View style={sl.wrap}>
            <View style={[sl.line, { backgroundColor: accent }]} />
            <Text style={[sl.text, { color: accent }]}>{label.toUpperCase()}</Text>
        </View>
    );
}
const sl = StyleSheet.create({
    wrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 6 },
    line: { width: 3, height: 12, borderRadius: 2 },
    text: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
});

// ─── Settings Card (container for rows) ──────────────────────────────────────
function SettingsCard({ children }) {
    return <View style={card.wrap}>{children}</View>;
}
const card = StyleSheet.create({
    wrap: {
        backgroundColor: T.s2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.bd,
        overflow: "hidden",
    },
});

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({
    iconEl,
    iconBg = T.s4,
    iconBd = T.bd2,
    title,
    subtitle,
    onPress,
    toggle,
    toggleVal,
    onToggle,
    danger,
    isLast,
    right,         // custom right element
    noChevron,
}) {
    const isInteractive = !!onPress || !!toggle;
    const Wrapper = isInteractive && !toggle ? TouchableOpacity : View;

    return (
        <Wrapper
            style={[r.row, !isLast && r.rowBorder]}
            onPress={onPress}
            activeOpacity={0.65}
        >
            {/* Icon */}
            <View style={[r.iconWrap, { backgroundColor: iconBg, borderColor: iconBd }]}>
                {iconEl}
            </View>

            {/* Text */}
            <View style={r.body}>
                <Text style={[r.title, danger && r.titleDanger]}>{title}</Text>
                {subtitle && <Text style={r.sub}>{subtitle}</Text>}
            </View>

            {/* Right */}
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: T.s5, true: `${T.ok}80` }}
                    thumbColor={toggleVal ? T.ok : T.tx3}
                    ios_backgroundColor={T.s5}
                />
            ) : right ? (
                right
            ) : onPress && !noChevron ? (
                <View style={r.chevronWrap}>
                    <Ic.ChevronRight c={T.tx3} s={13} />
                </View>
            ) : null}
        </Wrapper>
    );
}

const r = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: T.bd,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: "600", color: T.tx },
    titleDanger: { color: T.red },
    sub: { fontSize: 12, color: T.tx3, lineHeight: 16 },
    chevronWrap: {
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
});

// ─── Parent Identity Card ─────────────────────────────────────────────────────
function ParentCard({ parentUser }) {
    const initial = parentUser?.phone?.[0] ?? "P";
    const lastFour = parentUser?.phone?.slice(-4) ?? "••••";
    const verified = parentUser?.is_phone_verified;

    return (
        <View style={pc.card}>
            {/* Left accent stripe */}
            <View style={[pc.stripe, { backgroundColor: verified ? T.ok : T.amb }]} />

            <View style={pc.avatar}>
                <Text style={pc.avatarText}>{initial.toUpperCase()}</Text>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={pc.phone}>{parentUser?.phone ?? "—"}</Text>
                <View style={pc.statusRow}>
                    {verified ? (
                        <>
                            <View style={pc.dot} />
                            <Text style={pc.statusText}>Verified account</Text>
                        </>
                    ) : (
                        <>
                            <Ic.AlertTriangle c={T.amb} s={11} />
                            <Text style={[pc.statusText, { color: T.amb }]}>Phone not verified</Text>
                        </>
                    )}
                </View>
            </View>

            <View style={pc.endingWrap}>
                <Text style={pc.endingLabel}>ENDS IN</Text>
                <Text style={pc.ending}>{lastFour}</Text>
            </View>
        </View>
    );
}

const pc = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: T.s2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.bd,
        paddingVertical: 16,
        paddingRight: 16,
        paddingLeft: 0,
        overflow: "hidden",
    },
    stripe: { width: 3, alignSelf: "stretch", borderRadius: 0, marginRight: -2 },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: T.redBg,
        borderWidth: 1.5,
        borderColor: T.redBd,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginLeft: 14,
    },
    avatarText: { fontSize: 18, fontWeight: "900", color: T.red },
    phone: { fontSize: 15, fontWeight: "700", color: T.tx, letterSpacing: 0.2 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.ok },
    statusText: { fontSize: 11.5, color: T.ok, fontWeight: "600" },
    endingWrap: { alignItems: "flex-end" },
    endingLabel: { fontSize: 9, fontWeight: "800", color: T.tx3, letterSpacing: 1 },
    ending: { fontSize: 15, fontWeight: "800", color: T.tx2, letterSpacing: 1, marginTop: 2 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SettingsScreen() {
    const router = useRouter();
    const { parentUser, logout } = useAuthStore();
    const {
        student, token, card, emergencyProfile,
        recentScans, anomalies, updateRequests,
        locationConsent, updateLocationConsent,
        updateNotificationPref, notificationPrefs,
    } = useProfileStore();

    const { theme, setTheme } = useColorScheme?.() ?? { theme: "system", setTheme: () => { } };

    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scanAlerts ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomalyAlerts ?? true);
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);
    const [lang, setLang] = useState("en");
    const [langModalOpen, setLangModal] = useState(false);

    const unresolvedAnomalies = (anomalies ?? []).filter(a => !a.resolved);
    const currentLang = LANGUAGES.find(l => l.code === lang);

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out", style: "destructive",
                    onPress: async () => { await logout(); router.replace("/(auth)/login"); },
                },
            ]
        );
    };

    return (
        <Screen bg={T.bg} edges={["top", "left", "right"]}>
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
                {/* ── Page header ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Settings</Text>
                        <Text style={styles.pageSub}>
                            {student?.first_name
                                ? `${student.first_name}'s emergency card`
                                : "Manage your emergency card"}
                        </Text>
                    </View>
                    {/* Card status pill */}
                    {token?.status && (
                        <View style={[
                            styles.statusPill,
                            token.status === "ACTIVE"
                                ? styles.statusPillActive
                                : styles.statusPillInactive,
                        ]}>
                            <View style={[
                                styles.statusPillDot,
                                { backgroundColor: token.status === "ACTIVE" ? T.ok : T.amb },
                            ]} />
                            <Text style={[
                                styles.statusPillText,
                                { color: token.status === "ACTIVE" ? T.ok : T.amb },
                            ]}>
                                {token.status === "ACTIVE" ? "Card Live" : token.status}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* ── Parent identity ── */}
                <Animated.View entering={FadeInDown.delay(70).duration(350)}>
                    <ParentCard parentUser={parentUser} />
                </Animated.View>

                {/* ── Pending updates banner ── */}
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(90).duration(350)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

                {/* ── Physical Card ── */}
                <Animated.View entering={FadeInDown.delay(110).duration(350)} style={styles.group}>
                    <SectionLabel label="Physical Card" accent={T.blue} />
                    <SettingsCard>
                        <CardStatusBlock token={token} card={card} />
                        <Row
                            iconEl={<IconScan color={T.red} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Deactivate / Replace Card"
                            subtitle="Lost or damaged? Lock it instantly"
                            onPress={() => router.push("/(app)/qr")}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Scan History ── */}
                <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.group}>
                    <SectionLabel label="Scan Activity" accent={T.blue} />
                    <SettingsCard>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push("/(app)/scan-history")}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Emergency Profile ── */}
                <Animated.View entering={FadeInDown.delay(170).duration(350)} style={styles.group}>
                    <SectionLabel label="Emergency Profile" accent={T.red} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconEye color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Visibility Controls"
                            subtitle={visibilityLabel(emergencyProfile?.visibility)}
                            onPress={() => router.push("/(app)/visibility")}
                        />
                        <Row
                            iconEl={<IconShield color={T.red} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Emergency Info"
                            subtitle={`Blood group, allergies, contacts · ${student?.first_name ?? "child"}'s card`}
                            onPress={() => router.push("/(app)/updates")}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Security ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.group}>
                    <SectionLabel label="Security" accent={T.purp} />
                    <SettingsCard>
                        <BiometricRow isLast />
                    </SettingsCard>
                </Animated.View>

                {/* ── Notifications ── */}
                <Animated.View entering={FadeInDown.delay(230).duration(350)} style={styles.group}>
                    <SectionLabel label="Notifications" accent={T.ok} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconBell color={T.ok} />}
                            iconBg={T.okBg} iconBd={T.okBd}
                            title="Scan Alerts"
                            subtitle="Notify when card is scanned"
                            toggle toggleVal={scanAlerts}
                            onToggle={(v) => { setScanAlerts(v); updateNotificationPref?.("scanAlerts", v); }}
                        />
                        <Row
                            iconEl={<IconWarning color={T.amb} />}
                            iconBg={T.ambBg} iconBd={T.ambBd}
                            title="Anomaly Alerts"
                            subtitle="Suspicious scan activity warnings"
                            toggle toggleVal={anomalyAlerts}
                            onToggle={(v) => { setAnomalyAlerts(v); updateNotificationPref?.("anomalyAlerts", v); }}
                        />
                        <Row
                            iconEl={<IconMapPin color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Location on Scan"
                            subtitle="Capture GPS coordinates when card is scanned"
                            toggle toggleVal={locationEnabled}
                            onToggle={(v) => { setLocation(v); updateLocationConsent?.(v); }}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Appearance ── */}
                <Animated.View entering={FadeInDown.delay(260).duration(350)} style={styles.group}>
                    <SectionLabel label="Appearance" accent={T.tx3} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconGlobe color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Language"
                            subtitle={currentLang ? `${currentLang.native} · ${currentLang.label}` : "English"}
                            onPress={() => setLangModal(true)}
                        />
                        {/* Theme inline — no chevron, custom right */}
                        <Row
                            iconEl={<IconMoon color={T.tx3} />}
                            iconBg={T.s4} iconBd={T.bd2}
                            title="Theme"
                            subtitle="System, Light, or Dark"
                            noChevron
                            right={<ThemeSegment value={theme} onChange={setTheme} />}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Account ── */}
                <Animated.View entering={FadeInDown.delay(290).duration(350)} style={styles.group}>
                    <SectionLabel label="Account" accent={T.tx3} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconPhone color={T.amb} />}
                            iconBg={T.ambBg} iconBd={T.ambBd}
                            title="Change Phone Number"
                            subtitle="OTP verification required"
                            onPress={() => Alert.alert("Coming Soon", "Phone number change will be available in a future update.")}
                        />
                        <Row
                            iconEl={<IconInfo color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Help & Support"
                            onPress={() => router.push("/(app)/support")}
                        />
                        <Row
                            iconEl={<Ic.LogOut c={T.red} s={16} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Log Out"
                            onPress={handleLogout}
                            danger
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Footer ── */}
                <Animated.View entering={FadeInDown.delay(320).duration(350)} style={styles.footer}>
                    <View style={styles.footerDivider} />
                    <Text style={styles.footerApp}>RESQID · v1.0.0</Text>
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
        paddingTop: spacing[5],
        paddingBottom: spacing[12],
        gap: spacing[4],
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingBottom: spacing[1],
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: T.tx,
        letterSpacing: -0.5,
    },
    pageSub: {
        fontSize: 12.5,
        color: T.tx3,
        marginTop: 3,
    },
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 4,
    },
    statusPillActive: { backgroundColor: T.okBg, borderColor: T.okBd },
    statusPillInactive: { backgroundColor: T.ambBg, borderColor: T.ambBd },
    statusPillDot: { width: 5, height: 5, borderRadius: 3 },
    statusPillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },

    // Groups
    group: { gap: 8 },

    // Footer
    footer: { alignItems: "center", gap: 4, paddingTop: spacing[2] },
    footerDivider: {
        width: 32,
        height: 1,
        backgroundColor: T.bd2,
        borderRadius: 1,
        marginBottom: 8,
    },
    footerApp: { fontSize: 11, fontWeight: "800", color: T.tx3, letterSpacing: 1.2 },
    footerSub: { fontSize: 11, color: T.tx3 },
});