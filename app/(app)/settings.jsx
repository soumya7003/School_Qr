/**
<<<<<<< HEAD
 * SettingsScreen.jsx — RESQID Parent PWA
 * Fully redesigned — Command Center aesthetic
 *
 * FIXES FROM AUDIT:
 *  1. Avatar → neutral blue (identity, not danger red)
 *  2. Lock Card → bottom-sheet modal with "type LOCK" guard (not nav push)
 *  3. Scan Activity → proper empty state when no scans yet
 *  4. Row density tiers: critical / standard / compact
 *  5. Section hierarchy: primary vs secondary label tiers
 *  6. Log Out + Delete → dedicated Danger Zone card
 *  7. CardHealthBlock REMOVED — PVC QR cards have no electronics
 *
 * NEW SECTIONS:
 *  A. PhysicalCardBlock  — card number, school, issued/expiry dates, scan count, expiry warning
 *  B. Trusted Contacts   — quick-view emergency contacts shown to first responders
 *  C. Activity Digest    — weekly summary toggle + day-of-week picker
 *  D. Danger Zone        — consolidated destructive actions
 *  E. Export Data banner — promoted to top, not buried
=======
 * app/(app)/settings.jsx
 * Settings Screen — theme-aware, i18n-wired, SaaS-ready.
 *
 * Colors come from ThemeContext (never hardcoded).
 * Language re-renders reactively via I18nextProvider + useTranslation().
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
 */

import Screen from "@/components/common/Screen";
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
    IconWarning,
<<<<<<< HEAD
} from '@/components/icon/AllIcon';
import BiometricRow from '@/components/settings/BiometricRow';
import LanguageModal from '@/components/settings/LanguageModal';
import PendingUpdatesBanner from '@/components/settings/PendingUpdatesBanner';
import ScanHistoryPreview from '@/components/settings/ScanHistoryPreview';
import ThemeSegment from '@/components/settings/ThemeSegment';
import { LANGUAGES } from '@/constants/constants';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useColorScheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';
import { visibilityLabel } from '@/utils/helpers';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
=======
} from "@/components/icon/AllIcon";
import BiometricRow from "@/components/settings/BiometricRow";
import CardStatusBlock from "@/components/settings/CardStatusBlock";
import LanguageModal from "@/components/settings/LanguageModal";
import PendingUpdatesBanner from "@/components/settings/PendingUpdatesBanner";
import ScanHistoryPreview from "@/components/settings/ScanHistoryPreview";
import ThemeSegment from "@/components/settings/ThemeSegment";
import { LANGUAGES } from "@/constants/constants";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { useThemeContext } from "@/providers/ThemeProvider";
import { spacing } from "@/theme";
import { visibilityLabel } from "@/utils/helpers";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
<<<<<<< HEAD
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bg: '#07070A',
    s1: '#0C0C10',
    s2: '#111116',
    s3: '#17171E',
    s4: '#1E1E27',
    s5: '#25252F',

    bd: 'rgba(255,255,255,0.07)',
    bd2: 'rgba(255,255,255,0.12)',
    bd3: 'rgba(255,255,255,0.18)',

    tx: '#F0F0F5',
    tx2: 'rgba(240,240,245,0.62)',
    tx3: 'rgba(240,240,245,0.32)',
    tx4: 'rgba(240,240,245,0.16)',

    red: '#E8342A',
    redBg: 'rgba(232,52,42,0.08)',
    redBd: 'rgba(232,52,42,0.22)',

    ok: '#12A150',
    okBg: 'rgba(18,161,80,0.08)',
    okBd: 'rgba(18,161,80,0.22)',

    amb: '#D97706',
    ambBg: 'rgba(217,119,6,0.08)',
    ambBd: 'rgba(217,119,6,0.22)',

    blue: '#3B82F6',
    blueBg: 'rgba(59,130,246,0.08)',
    blueBd: 'rgba(59,130,246,0.22)',

    purp: '#8B5CF6',
    purpBg: 'rgba(139,92,246,0.08)',
    purpBd: 'rgba(139,92,246,0.22)',

    teal: '#14B8A6',
    tealBg: 'rgba(20,184,166,0.08)',
    tealBd: 'rgba(20,184,166,0.22)',

    // Identity avatar — blue, NOT danger red
    avt: '#60A5FA',
    avtBg: 'rgba(96,165,250,0.12)',
    avtBd: 'rgba(96,165,250,0.30)',
};

// ─── Inline SVG icons ──────────────────────────────────────────────────────────
const Ic = {
    ChevronRight: ({ c = T.tx3, s = 14 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Lock: ({ c = T.red, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Rect x="5" y="11" width="14" height="10" rx="2" stroke={c} strokeWidth={1.7} />
            <Path d="M8 11V7a4 4 0 018 0v4" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    ),
    LogOut: ({ c = T.red, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Trash: ({ c = T.red, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Download: ({ c = T.blue, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v10M7 14l5 5 5-5M4 19h16" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
    Users: ({ c = T.teal, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
            <Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.7} />
            <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    ),
    Calendar: ({ c = T.purp, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth={1.7} />
            <Path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    ),
    AlertTriangle: ({ c = T.amb, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M12 9v4M12 17h.01" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    ),
    Plus: ({ c = T.teal, s = 14 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    ),
    Replace: ({ c = T.blue, s = 16 }) => (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
            <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    ),
};

// ─── Section Label — primary / secondary tiers ─────────────────────────────────
function SectionLabel({ label, accent = T.tx3, tier = 'secondary' }) {
    const isPrimary = tier === 'primary';
=======
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const ChevronRight = ({ c, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const AlertTriangle = ({ c, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
);
const LogOut = ({ c, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ label, accent }) {
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
    return (
        <View style={sl.wrap}>
            <View style={[sl.line, { backgroundColor: accent, height: isPrimary ? 14 : 10 }]} />
            <Text style={[sl.text, { color: accent, fontSize: isPrimary ? 11 : 10, letterSpacing: isPrimary ? 1.4 : 1.2 }]}>
                {label.toUpperCase()}
            </Text>
        </View>
    );
}
const sl = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2, marginBottom: 7 },
    line: { width: 3, borderRadius: 2 },
    text: { fontWeight: '800' },
});

<<<<<<< HEAD
// ─── Settings Card ─────────────────────────────────────────────────────────────
function SettingsCard({ children, borderColor = T.bd }) {
    return <View style={[scard.wrap, { borderColor }]}>{children}</View>;
}
const scard = StyleSheet.create({
    wrap: { backgroundColor: T.s2, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});

// ─── Danger Zone Card ──────────────────────────────────────────────────────────
function DangerZoneCard({ children }) {
    return <View style={dz.wrap}>{children}</View>;
}
const dz = StyleSheet.create({
    wrap: { backgroundColor: T.redBg, borderRadius: 16, borderWidth: 1, borderColor: T.redBd, overflow: 'hidden' },
});

// ─── Row — three density tiers ─────────────────────────────────────────────────
function Row({ iconEl, iconBg = T.s4, iconBd = T.bd2, title, subtitle, onPress, toggle, toggleVal, onToggle, danger, isLast, right, noChevron, size = 'standard', badge }) {
    const vPad = size === 'critical' ? 16 : size === 'compact' ? 9 : 13;
    const icSize = size === 'compact' ? 32 : 36;
    const Wrapper = onPress && !toggle ? TouchableOpacity : View;

    return (
        <Wrapper
            style={[rw.row, { paddingVertical: vPad }, !isLast && rw.border]}
            onPress={onPress}
            activeOpacity={0.65}
        >
            <View style={[rw.icon, { backgroundColor: iconBg, borderColor: iconBd, width: icSize, height: icSize }]}>
                {iconEl}
            </View>
            <View style={rw.body}>
                <View style={rw.titleRow}>
                    <Text style={[rw.title, danger && rw.titleDanger, size === 'critical' && rw.titleCritical]}>
                        {title}
                    </Text>
                    {badge && (
                        <View style={[rw.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                            <Text style={[rw.badgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                    )}
                </View>
                {subtitle ? <Text style={rw.sub}>{subtitle}</Text> : null}
=======
// ─── Card container ───────────────────────────────────────────────────────────
function SettingsCard({ children, C }) {
    return (
        <View style={[card.wrap, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {children}
        </View>
    );
}
const card = StyleSheet.create({
    wrap: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
});

// ─── Settings row ─────────────────────────────────────────────────────────────
function Row({
    C,
    iconEl, iconBg, iconBd,
    title, subtitle,
    onPress, toggle, toggleVal, onToggle,
    danger, isLast, right, noChevron,
}) {
    const Wrapper = (onPress && !toggle) ? TouchableOpacity : View;
    return (
        <Wrapper
            style={[
                r.row,
                !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd },
            ]}
            onPress={onPress}
            activeOpacity={0.65}
        >
            <View style={[r.iconWrap, { backgroundColor: iconBg, borderColor: iconBd }]}>
                {iconEl}
            </View>
            <View style={r.body}>
                <Text style={[r.title, { color: danger ? C.red : C.tx }]}>{title}</Text>
                {subtitle ? <Text style={[r.sub, { color: C.tx3 }]}>{subtitle}</Text> : null}
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
            </View>
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: C.s5, true: `${C.ok}80` }}
                    thumbColor={toggleVal ? C.ok : C.tx3}
                    ios_backgroundColor={C.s5}
                />
<<<<<<< HEAD
            ) : right ? (
                right
            ) : onPress && !noChevron ? (
                <View style={rw.chevron}>
                    <Ic.ChevronRight c={danger ? `${T.red}80` : T.tx3} s={13} />
=======
            ) : right ? right
            : (onPress && !noChevron) ? (
                <View style={r.chevron}>
                    <ChevronRight c={C.tx3} s={13} />
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                </View>
            ) : null}
        </Wrapper>
    );
}
<<<<<<< HEAD
const rw = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
    border: { borderBottomWidth: 1, borderBottomColor: T.bd },
    icon: { borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    body: { flex: 1, gap: 3 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 14, fontWeight: '600', color: T.tx },
    titleCritical: { fontSize: 14.5, fontWeight: '700' },
    titleDanger: { color: T.red },
    sub: { fontSize: 12, color: T.tx3, lineHeight: 16 },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
    chevron: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});

// ─── Card Divider ─────────────────────────────────────────────────────────────
function CardDivider({ label }) {
    return (
        <View style={cd.wrap}>
            <View style={cd.line} />
            {label ? <Text style={cd.label}>{label}</Text> : null}
            <View style={cd.line} />
        </View>
    );
}
const cd = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingVertical: 2, gap: 10 },
    line: { flex: 1, height: 0.5, backgroundColor: T.bd },
    label: { fontSize: 9, fontWeight: '700', color: T.tx4, letterSpacing: 0.8 },
});

// ─── Parent Identity Card — BLUE avatar ───────────────────────────────────────
function ParentCard({ parentUser }) {
    const initial = (parentUser?.phone?.replace(/\D/g, '')?.[0] ?? 'P').toUpperCase();
    const lastFour = parentUser?.phone?.slice(-4) ?? '••••';
    const verified = parentUser?.is_phone_verified;

    return (
        <View style={pc.card}>
            <View style={[pc.stripe, { backgroundColor: verified ? T.ok : T.amb }]} />
            <View style={pc.avatar}>
                <Text style={pc.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={pc.phone}>{parentUser?.phone ?? '—'}</Text>
                <View style={pc.statusRow}>
                    {verified ? (
                        <><View style={pc.dot} /><Text style={pc.statusText}>Verified account</Text></>
                    ) : (
                        <><Ic.AlertTriangle c={T.amb} s={11} /><Text style={[pc.statusText, { color: T.amb }]}>Phone not verified</Text></>
=======
const r = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: "600" },
    sub: { fontSize: 12, lineHeight: 16 },
    chevron: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
});

// ─── Parent identity card ─────────────────────────────────────────────────────
function ParentCard({ parentUser, C }) {
    const { t } = useTranslation();
    const initial = parentUser?.phone?.[0] ?? "P";
    const lastFour = parentUser?.phone?.slice(-4) ?? "••••";
    const verified = parentUser?.is_phone_verified;

    return (
        <View style={[pc.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[pc.stripe, { backgroundColor: verified ? C.ok : C.amb }]} />
            <View style={[pc.avatar, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                <Text style={[pc.avatarText, { color: C.red }]}>{initial.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[pc.phone, { color: C.tx }]}>{parentUser?.phone ?? "—"}</Text>
                <View style={pc.statusRow}>
                    {verified ? (
                        <>
                            <View style={[pc.dot, { backgroundColor: C.ok }]} />
                            <Text style={[pc.statusText, { color: C.ok }]}>
                                {t("settings.verifiedAccount")}
                            </Text>
                        </>
                    ) : (
                        <>
                            <AlertTriangle c={C.amb} s={11} />
                            <Text style={[pc.statusText, { color: C.amb }]}>
                                {t("settings.phoneNotVerified")}
                            </Text>
                        </>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                    )}
                </View>
            </View>
            <View style={pc.ending}>
<<<<<<< HEAD
                <Text style={pc.endingLabel}>ENDS IN</Text>
                <Text style={pc.endingVal}>{lastFour}</Text>
=======
                <Text style={[pc.endingLabel, { color: C.tx3 }]}>{t("settings.endsIn")}</Text>
                <Text style={[pc.endingNum, { color: C.tx2 }]}>{lastFour}</Text>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
            </View>
        </View>
    );
}
const pc = StyleSheet.create({
    card: {
<<<<<<< HEAD
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: T.s2, borderRadius: 16, borderWidth: 1, borderColor: T.bd,
        paddingVertical: 16, paddingRight: 16, paddingLeft: 0, overflow: 'hidden',
    },
    stripe: { width: 3, alignSelf: 'stretch' },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: T.avtBg, borderWidth: 1.5, borderColor: T.avtBd,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 14,
    },
    avatarText: { fontSize: 18, fontWeight: '900', color: T.avt },
    phone: { fontSize: 15, fontWeight: '700', color: T.tx, letterSpacing: 0.2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.ok },
    statusText: { fontSize: 11.5, color: T.ok, fontWeight: '600' },
    ending: { alignItems: 'flex-end' },
    endingLabel: { fontSize: 9, fontWeight: '800', color: T.tx3, letterSpacing: 1 },
    endingVal: { fontSize: 15, fontWeight: '800', color: T.tx2, letterSpacing: 1, marginTop: 2 },
});

// ─── Physical Card Block ───────────────────────────────────────────────────────
// Shows real PVC card data: card number, school, issued date, expiry, total scans.
// No signal/battery/NFC — this is a plain printed QR card.
function PhysicalCardBlock({ token, card, onLost, onReplace }) {
    const cardNumber = card?.card_number ?? '—';
    const schoolName = card?.school?.name ?? '—';
    const issuedOn = card?.issued_at
        ? new Date(card.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';
    const expiresAt = card?.expires_at ? new Date(card.expires_at) : null;
    const expiryStr = expiresAt
        ? expiresAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : '—';

    const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now()) / 86400000) : null;
    const isExpiringSoon = daysLeft !== null && daysLeft <= 60 && daysLeft > 0;
    const isExpired = daysLeft !== null && daysLeft <= 0;
    const expiryColor = isExpired ? T.red : isExpiringSoon ? T.amb : T.tx;

    const totalScans = token?.total_scans ?? 0;

    return (
        <View>
            {/* Card visual — number, school, status */}
            <View style={phc.strip}>
                <View style={phc.stripAccent} />
                <View style={phc.qrBox}>
                    <Svg width={36} height={36} viewBox="0 0 36 36">
                        <Rect x="2" y="2" width="14" height="14" rx="2" fill="none" stroke={T.tx2} strokeWidth="2" />
                        <Rect x="5" y="5" width="8" height="8" rx="1" fill={T.tx2} />
                        <Rect x="20" y="2" width="14" height="14" rx="2" fill="none" stroke={T.tx2} strokeWidth="2" />
                        <Rect x="23" y="5" width="8" height="8" rx="1" fill={T.tx2} />
                        <Rect x="2" y="20" width="14" height="14" rx="2" fill="none" stroke={T.tx2} strokeWidth="2" />
                        <Rect x="5" y="23" width="8" height="8" rx="1" fill={T.tx2} />
                        <Rect x="20" y="20" width="4" height="4" rx="1" fill={T.tx2} />
                        <Rect x="26" y="20" width="4" height="4" rx="1" fill={T.tx2} />
                        <Rect x="20" y="26" width="4" height="4" rx="1" fill={T.tx2} />
                        <Rect x="30" y="26" width="4" height="4" rx="1" fill={T.tx2} />
                        <Rect x="26" y="30" width="4" height="4" rx="1" fill={T.tx2} />
                    </Svg>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={phc.cardNum}>{cardNumber}</Text>
                    <Text style={phc.school} numberOfLines={1}>{schoolName}</Text>
                    <View style={phc.statusRow}>
                        <View style={[phc.statusDot, { backgroundColor: token?.status === 'ACTIVE' ? T.ok : T.amb }]} />
                        <Text style={[phc.statusText, { color: token?.status === 'ACTIVE' ? T.ok : T.amb }]}>
                            {token?.status === 'ACTIVE' ? 'Active' : (token?.status ?? 'Unknown')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 2×2 metadata grid */}
            <View style={phc.grid}>
                <View style={phc.cell}>
                    <Text style={phc.cellLabel}>ISSUED ON</Text>
                    <Text style={phc.cellValue}>{issuedOn}</Text>
                </View>
                <View style={[phc.cell, phc.cellRight]}>
                    <Text style={phc.cellLabel}>VALID UNTIL</Text>
                    <Text style={[phc.cellValue, { color: expiryColor }]}>{expiryStr}</Text>
                </View>
                <View style={[phc.cell, phc.cellTop]}>
                    <Text style={phc.cellLabel}>CARD TYPE</Text>
                    <Text style={phc.cellValue}>PVC · QR Print</Text>
                </View>
                <View style={[phc.cell, phc.cellRight, phc.cellTop]}>
                    <Text style={phc.cellLabel}>TOTAL SCANS</Text>
                    <Text style={[phc.cellValue, { color: totalScans > 0 ? T.ok : T.tx3 }]}>
                        {totalScans} scan{totalScans !== 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            {/* Expiry warning — only shown when relevant */}
            {(isExpiringSoon || isExpired) && (
                <View style={[phc.warning, {
                    backgroundColor: isExpired ? T.redBg : T.ambBg,
                    borderTopColor: isExpired ? T.redBd : T.ambBd,
                }]}>
                    <Ic.AlertTriangle c={isExpired ? T.red : T.amb} s={13} />
                    <Text style={[phc.warningText, { color: isExpired ? T.red : T.amb }]}>
                        {isExpired
                            ? 'Card has expired. Contact your school to get a replacement.'
                            : `Card expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Contact your school to renew.`}
                    </Text>
                </View>
            )}

            {/* Action rows */}
            <Row
                iconEl={<Ic.Replace c={T.blue} s={16} />}
                iconBg={T.blueBg} iconBd={T.blueBd}
                title="Request Replacement Card"
                subtitle="School will issue a new printed card"
                onPress={onReplace}
                size="standard"
            />
            <Row
                iconEl={<Ic.Lock c={T.red} s={16} />}
                iconBg={T.redBg} iconBd={T.redBd}
                title="Report Card Lost"
                subtitle="Deactivates this QR code immediately"
                onPress={onLost}
                danger
                size="standard"
                isLast
            />
        </View>
    );
}
const phc = StyleSheet.create({
    strip: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: T.s3, margin: 12,
        borderRadius: 10, borderWidth: 1, borderColor: T.bd2,
        paddingVertical: 14, paddingRight: 14, paddingLeft: 0, overflow: 'hidden',
    },
    stripAccent: { width: 3, alignSelf: 'stretch', backgroundColor: T.blue },
    qrBox: {
        width: 52, height: 52, backgroundColor: T.s4,
        borderRadius: 8, borderWidth: 1, borderColor: T.bd2,
        alignItems: 'center', justifyContent: 'center', marginLeft: 10, flexShrink: 0,
    },
    cardNum: { fontSize: 13.5, fontWeight: '800', color: T.tx, letterSpacing: 0.5 },
    school: { fontSize: 11, color: T.tx3, marginTop: 3 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 10.5, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: T.bd },
    cell: { width: '50%', padding: 12 },
    cellRight: { borderLeftWidth: 1, borderLeftColor: T.bd },
    cellTop: { borderTopWidth: 1, borderTopColor: T.bd },
    cellLabel: { fontSize: 9, fontWeight: '700', color: T.tx3, letterSpacing: 0.8, marginBottom: 4 },
    cellValue: { fontSize: 12.5, fontWeight: '600', color: T.tx },
    warning: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
    },
    warningText: { flex: 1, fontSize: 11.5, lineHeight: 17, fontWeight: '500' },
});

// ─── Lock Card Modal ───────────────────────────────────────────────────────────
function LockCardModal({ visible, onClose, onConfirm }) {
    const [input, setInput] = useState('');
    const ready = input.trim().toUpperCase() === 'LOCK';

    const handleConfirm = () => {
        if (!ready) return;
        onConfirm();
        setInput('');
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={lm.backdrop} onPress={onClose} />
            <View style={lm.sheet}>
                <View style={lm.handle} />
                <View style={lm.iconWrap}>
                    <Ic.Lock c={T.red} s={26} />
                </View>
                <Text style={lm.title}>Report card lost?</Text>
                <Text style={lm.body}>
                    This will immediately deactivate the QR code on your child's physical card. Anyone who scans it will see a locked card message.{'\n\n'}
                    To get a new card, contact your school admin. A replacement card will be issued with a new QR code.
                </Text>
                <View style={lm.inputWrap}>
                    <Text style={lm.inputLabel}>TYPE LOCK TO CONFIRM</Text>
                    <TextInput
                        style={[lm.input, ready && lm.inputReady]}
                        value={input}
                        onChangeText={setInput}
                        autoCapitalize="characters"
                        placeholder="LOCK"
                        placeholderTextColor={T.tx4}
                    />
                </View>
                <View style={lm.actions}>
                    <TouchableOpacity style={lm.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                        <Text style={lm.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[lm.confirmBtn, !ready && lm.confirmBtnOff]}
                        onPress={handleConfirm}
                        activeOpacity={ready ? 0.75 : 1}
                    >
                        <Text style={[lm.confirmText, !ready && lm.confirmTextOff]}>Lock Card</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
const lm = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
        backgroundColor: T.s2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderColor: T.bd2,
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, alignItems: 'center',
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.bd2, marginBottom: 24 },
    iconWrap: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: T.redBg, borderWidth: 1, borderColor: T.redBd,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 19, fontWeight: '800', color: T.tx, marginBottom: 10 },
    body: { fontSize: 13.5, color: T.tx2, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
    inputWrap: { width: '100%', gap: 8, marginBottom: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', color: T.tx3, letterSpacing: 1 },
    input: {
        height: 48, borderRadius: 10, borderWidth: 1, borderColor: T.bd2,
        backgroundColor: T.s3, color: T.tx, fontSize: 16, fontWeight: '700',
        letterSpacing: 2, textAlign: 'center',
    },
    inputReady: { borderColor: T.red, backgroundColor: T.redBg, color: T.red },
    actions: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelBtn: {
        flex: 1, height: 48, borderRadius: 12,
        backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd2,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '600', color: T.tx2 },
    confirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: T.red, alignItems: 'center', justifyContent: 'center' },
    confirmBtnOff: { backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd2 },
    confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    confirmTextOff: { color: T.tx4 },
});

// ─── Trusted Contacts preview ──────────────────────────────────────────────────
function TrustedContactsPreview({ contacts = [], onManage }) {
    const shown = contacts.slice(0, 3);
    const colors = [T.blue, T.teal, T.purp];
    return (
        <TouchableOpacity style={tcon.wrap} onPress={onManage} activeOpacity={0.7}>
            <View style={tcon.left}>
                {shown.length > 0 ? (
                    <View style={tcon.row}>
                        {shown.map((c, i) => (
                            <View key={i} style={[tcon.avatar, {
                                backgroundColor: `${colors[i]}20`,
                                borderColor: `${colors[i]}50`,
                                marginLeft: i > 0 ? -8 : 0,
                                zIndex: 3 - i,
                            }]}>
                                <Text style={[tcon.avatarText, { color: colors[i] }]}>
                                    {(c.name?.[0] ?? '?').toUpperCase()}
                                </Text>
                            </View>
                        ))}
                        {contacts.length > 3 && (
                            <View style={[tcon.avatar, { backgroundColor: T.s4, borderColor: T.bd2, marginLeft: -8 }]}>
                                <Text style={[tcon.avatarText, { color: T.tx3 }]}>+{contacts.length - 3}</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={tcon.empty}>
                        <Ic.Plus c={T.teal} s={16} />
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={tcon.title}>
                        {shown.length > 0 ? `${contacts.length} trusted contact${contacts.length !== 1 ? 's' : ''}` : 'Add trusted contacts'}
                    </Text>
                    <Text style={tcon.sub}>
                        {shown.length > 0 ? 'Shown to first responders on scan' : 'Emergency contacts on your card'}
                    </Text>
                </View>
            </View>
            <Ic.ChevronRight c={T.tx3} s={13} />
        </TouchableOpacity>
    );
}
const tcon = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 11, fontWeight: '900' },
    empty: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: T.tealBg, borderWidth: 1, borderColor: T.tealBd,
        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 14, fontWeight: '600', color: T.tx },
    sub: { fontSize: 12, color: T.tx3, marginTop: 2 },
});

// ─── Scan empty state ──────────────────────────────────────────────────────────
function ScanEmptyState() {
    return (
        <View style={ses.wrap}>
            <View style={ses.icon}>
                <IconScan color={T.tx4} size={20} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={ses.title}>No scans yet</Text>
                <Text style={ses.sub}>You'll be notified the moment your card is first scanned.</Text>
            </View>
        </View>
    );
}
const ses = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
    icon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    title: { fontSize: 13.5, fontWeight: '600', color: T.tx2 },
    sub: { fontSize: 12, color: T.tx3, lineHeight: 17, marginTop: 2 },
});

// ─── Activity Digest day picker ────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function DigestDayPicker({ value, onChange }) {
    return (
        <View style={ddp.row}>
            {DAYS.map((d) => (
                <TouchableOpacity
                    key={d}
                    style={[ddp.btn, value === d && ddp.btnActive]}
                    onPress={() => onChange(d)}
                    activeOpacity={0.7}
                >
                    <Text style={[ddp.text, value === d && ddp.textActive]}>{d[0]}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
const ddp = StyleSheet.create({
    row: { flexDirection: 'row', gap: 5, paddingHorizontal: 16, paddingBottom: 14 },
    btn: { flex: 1, height: 30, borderRadius: 7, backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd, alignItems: 'center', justifyContent: 'center' },
    btnActive: { backgroundColor: T.purpBg, borderColor: T.purp },
    text: { fontSize: 11, fontWeight: '700', color: T.tx3 },
    textActive: { color: T.purp },
});

// ─── Export Data Banner ────────────────────────────────────────────────────────
function ExportDataBanner({ onPress }) {
    return (
        <TouchableOpacity style={edb.wrap} onPress={onPress} activeOpacity={0.7}>
            <View style={edb.iconWrap}>
                <Ic.Download c={T.blue} s={16} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={edb.title}>Export your data</Text>
                <Text style={edb.sub}>Download scan logs, profile changes & audit trail</Text>
            </View>
            <Ic.ChevronRight c={T.blue} s={13} />
        </TouchableOpacity>
    );
}
const edb = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: T.blueBg, borderRadius: 12, borderWidth: 1, borderColor: T.blueBd,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    iconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${T.blue}15`, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 13.5, fontWeight: '600', color: T.blue },
    sub: { fontSize: 11, color: T.tx3, marginTop: 2 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
=======
        flexDirection: "row", alignItems: "center", gap: 14,
        borderRadius: 16, borderWidth: 1,
        paddingVertical: 16, paddingRight: 16, paddingLeft: 0, overflow: "hidden",
    },
    stripe: { width: 3, alignSelf: "stretch", marginRight: -2 },
    avatar: {
        width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
        alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 14,
    },
    avatarText: { fontSize: 18, fontWeight: "900" },
    phone: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 11.5, fontWeight: "600" },
    ending: { alignItems: "flex-end" },
    endingLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    endingNum: { fontSize: 15, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
export default function SettingsScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { parentUser, logout } = useAuthStore();
    const {
        student, token, card, emergencyProfile,
        recentScans, anomalies, updateRequests,
        trustedContacts,
        locationConsent, updateLocationConsent,
        updateNotificationPref, notificationPrefs,
    } = useProfileStore();

<<<<<<< HEAD
    const { theme, setTheme } = useColorScheme?.() ?? { theme: 'system', setTheme: () => { } };
=======
    // ── Theme ─────────────────────────────────────────────────────────────────
    const { colors: C } = useThemeContext() ?? {};
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9

    // ── Language ──────────────────────────────────────────────────────────────
    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
    const [langModalOpen, setLangModal] = useState(false);

    // ── Notification / location toggles ───────────────────────────────────────
    const [scanAlerts, setScanAlerts] = useState(notificationPrefs?.scanAlerts ?? true);
    const [anomalyAlerts, setAnomalyAlerts] = useState(notificationPrefs?.anomalyAlerts ?? true);
<<<<<<< HEAD
    const [locationOn, setLocationOn] = useState(locationConsent?.enabled ?? false);
    const [digestOn, setDigestOn] = useState(notificationPrefs?.weeklyDigest ?? true);
    const [digestDay, setDigestDay] = useState(notificationPrefs?.digestDay ?? 'Mon');
    const [lang, setLang] = useState('en');
    const [langModal, setLangModal] = useState(false);
    const [lockModal, setLockModal] = useState(false);

    const unresolvedAnomalies = (anomalies ?? []).filter(a => !a.resolved);
    const hasScans = (recentScans?.length ?? 0) > 0;
    const currentLang = LANGUAGES.find(l => l.code === lang);

    const handleLockConfirm = useCallback(() => {
        setLockModal(false);
        // TODO: call token deactivation API
        Alert.alert('Card Locked', 'Your card QR code has been deactivated. Contact your school for a replacement.');
    }, []);

    const handleReplace = () =>
        Alert.alert('Request Replacement', 'A replacement request will be sent to your school admin. They will issue a new printed card.', [{ text: 'OK' }]);

    const handleLogout = () =>
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
        ]);

    const handleDeleteAccount = () =>
        Alert.alert(
            'Delete Account',
            'This will permanently erase all data — scan history, emergency profile, and all linked cards. This cannot be undone.',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { } }]
=======
    const [locationEnabled, setLocation] = useState(locationConsent?.enabled ?? false);

    const unresolvedAnomalies = (anomalies ?? []).filter((a) => !a.resolved);

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert(
            t("common.logout"),
            "Are you sure you want to log out?",
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.logout"),
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace("/(auth)/login");
                    },
                },
            ],
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
        );

    const handleExport = () =>
        Alert.alert('Export Data', 'A download link will be sent to your registered phone number within a few minutes.');

    // Guard: wait for theme to be ready
    if (!C) return null;

    return (
<<<<<<< HEAD
        <Screen bg={T.bg} edges={['top', 'left', 'right']}>

            <LockCardModal
                visible={lockModal}
                onClose={() => setLockModal(false)}
                onConfirm={handleLockConfirm}
            />
            <LanguageModal
                visible={langModal}
                current={lang}
                onSelect={setLang}
                onClose={() => setLangModal(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Page header */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={s.header}>
                    <View>
                        <Text style={s.pageTitle}>Settings</Text>
                        <Text style={s.pageSub}>
                            {student?.first_name ? `${student.first_name}'s emergency card` : 'Manage your emergency card'}
                        </Text>
                    </View>
                    {token?.status && (
                        <View style={[s.pill, token.status === 'ACTIVE' ? s.pillActive : s.pillInactive]}>
                            <View style={[s.pillDot, { backgroundColor: token.status === 'ACTIVE' ? T.ok : T.amb }]} />
                            <Text style={[s.pillText, { color: token.status === 'ACTIVE' ? T.ok : T.amb }]}>
                                {token.status === 'ACTIVE' ? 'Card Live' : token.status}
=======
        <Screen bg={C.bg} edges={["top", "left", "right"]}>
            <LanguageModal visible={langModalOpen} onClose={() => setLangModal(false)} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[s.scroll, { gap: spacing[4] }]}
            >
                {/* ── Page header ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={s.header}>
                    <View>
                        <Text style={[s.pageTitle, { color: C.tx }]}>{t("settings.title")}</Text>
                        <Text style={[s.pageSub, { color: C.tx3 }]}>
                            {student?.first_name
                                ? `${student.first_name}'s emergency card`
                                : t("settings.subtitle")}
                        </Text>
                    </View>
                    {token?.status && (
                        <View style={[
                            s.statusPill,
                            token.status === "ACTIVE"
                                ? { backgroundColor: C.okBg, borderColor: C.okBd }
                                : { backgroundColor: C.ambBg, borderColor: C.ambBd },
                        ]}>
                            <View style={[s.statusDot, {
                                backgroundColor: token.status === "ACTIVE" ? C.ok : C.amb,
                            }]} />
                            <Text style={[s.statusText, {
                                color: token.status === "ACTIVE" ? C.ok : C.amb,
                            }]}>
                                {token.status === "ACTIVE" ? t("settings.cardLive") : token.status}
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Parent identity */}
                <Animated.View entering={FadeInDown.delay(70).duration(350)}>
                    <ParentCard parentUser={parentUser} C={C} />
                </Animated.View>

<<<<<<< HEAD
                {/* Pending update requests */}
=======
                {/* ── Pending updates ── */}
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                {(updateRequests?.length ?? 0) > 0 && (
                    <Animated.View entering={FadeInDown.delay(85).duration(350)}>
                        <PendingUpdatesBanner requests={updateRequests} />
                    </Animated.View>
                )}

<<<<<<< HEAD
                {/* Export data banner */}
                <Animated.View entering={FadeInDown.delay(95).duration(350)}>
                    <ExportDataBanner onPress={handleExport} />
                </Animated.View>

                {/* A: Physical Card */}
                <Animated.View entering={FadeInDown.delay(110).duration(350)} style={s.group}>
                    <SectionLabel label="Physical Card" accent={T.blue} tier="primary" />
                    <SettingsCard>
                        <PhysicalCardBlock
                            token={token}
                            card={card}
                            onLost={() => setLockModal(true)}
                            onReplace={handleReplace}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* B: Emergency Profile */}
                <Animated.View entering={FadeInDown.delay(140).duration(350)} style={s.group}>
                    <SectionLabel label="Emergency Profile" accent={T.red} tier="primary" />
                    <SettingsCard borderColor={T.redBd}>
                        <Row
                            iconEl={<IconShield color={T.red} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Emergency Info"
                            subtitle={`Blood group, allergies, conditions · ${student?.first_name ?? 'child'}'s card`}
                            onPress={() => router.push('/(app)/updates')}
                            size="critical"
                            badge={{ label: 'CRITICAL', color: T.red, bg: T.redBg }}
                        />
=======
                {/* ── Physical card ── */}
                <Animated.View entering={FadeInDown.delay(110).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.physicalCard")} accent={C.blue} />
                    <SettingsCard C={C}>
                        <CardStatusBlock token={token} card={card} />
                        <Row
                            C={C}
                            iconEl={<IconScan color={C.red} />}
                            iconBg={C.redBg} iconBd={C.redBd}
                            title={t("settings.deactivateCard")}
                            subtitle={t("settings.deactivateCardSub")}
                            onPress={() => router.push("/(app)/qr")}
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Scan history ── */}
                <Animated.View entering={FadeInDown.delay(140).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.scanActivity")} accent={C.blue} />
                    <SettingsCard C={C}>
                        <ScanHistoryPreview
                            scans={recentScans ?? []}
                            anomalyCount={unresolvedAnomalies.length}
                            onViewAll={() => router.push("/(app)/scan-history")}
                        />
                    </SettingsCard>
                </Animated.View>

                {/* ── Emergency profile ── */}
                <Animated.View entering={FadeInDown.delay(170).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.emergencyProfile")} accent={C.red} />
                    <SettingsCard C={C}>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                        <Row
                            C={C}
                            iconEl={<IconEye color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t("settings.visibilityControls")}
                            subtitle={visibilityLabel(emergencyProfile?.visibility)}
                            onPress={() => router.push('/(app)/visibility')}
                        />
<<<<<<< HEAD
                        <TrustedContactsPreview
                            contacts={trustedContacts ?? []}
                            onManage={() => router.push('/(app)/trusted-contacts')}
=======
                        <Row
                            C={C}
                            iconEl={<IconShield color={C.red} />}
                            iconBg={C.redBg} iconBd={C.redBd}
                            title={t("settings.emergencyInfo")}
                            subtitle={`${t("settings.emergencyInfoSub")} · ${student?.first_name ?? "child"}'s card`}
                            onPress={() => router.push("/(app)/updates")}
                            isLast
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                        />
                    </SettingsCard>
                </Animated.View>

<<<<<<< HEAD
                {/* C: Scan Activity */}
                <Animated.View entering={FadeInDown.delay(170).duration(350)} style={s.group}>
                    <SectionLabel label="Scan Activity" accent={T.blue} />
                    <SettingsCard>
                        {unresolvedAnomalies.length > 0 && (
                            <Row
                                iconEl={<Ic.AlertTriangle c={T.amb} s={16} />}
                                iconBg={T.ambBg} iconBd={T.ambBd}
                                title={`${unresolvedAnomalies.length} unresolved anomal${unresolvedAnomalies.length > 1 ? 'ies' : 'y'}`}
                                subtitle="Suspicious scan activity detected — review now"
                                onPress={() => router.push('/(app)/scan-history')}
                                size="critical"
                                badge={{ label: 'REVIEW', color: T.amb, bg: T.ambBg }}
                            />
                        )}
                        {hasScans ? (
                            <>
                                <ScanHistoryPreview
                                    scans={recentScans}
                                    anomalyCount={unresolvedAnomalies.length}
                                    onViewAll={() => router.push('/(app)/scan-history')}
                                />
                                <Row
                                    iconEl={<IconScan color={T.tx3} />}
                                    iconBg={T.s4} iconBd={T.bd2}
                                    title="View full scan history"
                                    onPress={() => router.push('/(app)/scan-history')}
                                    size="compact"
                                    isLast
                                />
                            </>
                        ) : (
                            <ScanEmptyState />
                        )}
                    </SettingsCard>
                </Animated.View>

                {/* D: Security */}
                <Animated.View entering={FadeInDown.delay(200).duration(350)} style={s.group}>
                    <SectionLabel label="Security" accent={T.purp} />
                    <SettingsCard>
=======
                {/* ── Security ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.security")} accent={C.purp} />
                    <SettingsCard C={C}>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                        <BiometricRow isLast />
                    </SettingsCard>
                </Animated.View>

<<<<<<< HEAD
                {/* E: Notifications + Activity Digest */}
                <Animated.View entering={FadeInDown.delay(230).duration(350)} style={s.group}>
                    <SectionLabel label="Notifications" accent={T.ok} />
                    <SettingsCard>
=======
                {/* ── Notifications ── */}
                <Animated.View entering={FadeInDown.delay(230).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.notifications")} accent={C.ok} />
                    <SettingsCard C={C}>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                        <Row
                            C={C}
                            iconEl={<IconBell color={C.ok} />}
                            iconBg={C.okBg} iconBd={C.okBd}
                            title={t("settings.scanAlerts")}
                            subtitle={t("settings.scanAlertsSub")}
                            toggle toggleVal={scanAlerts}
                            onToggle={(v) => { setScanAlerts(v); updateNotificationPref?.('scanAlerts', v); }}
                            size="compact"
                        />
                        <Row
                            C={C}
                            iconEl={<IconWarning color={C.amb} />}
                            iconBg={C.ambBg} iconBd={C.ambBd}
                            title={t("settings.anomalyAlerts")}
                            subtitle={t("settings.anomalyAlertsSub")}
                            toggle toggleVal={anomalyAlerts}
                            onToggle={(v) => { setAnomalyAlerts(v); updateNotificationPref?.('anomalyAlerts', v); }}
                            size="compact"
                        />
                        <Row
<<<<<<< HEAD
                            iconEl={<IconMapPin color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Location on Scan"
                            subtitle="Capture GPS coordinates when card is scanned"
                            toggle toggleVal={locationOn}
                            onToggle={(v) => { setLocationOn(v); updateLocationConsent?.(v); }}
                            size="compact"
=======
                            C={C}
                            iconEl={<IconMapPin color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t("settings.locationOnScan")}
                            subtitle={t("settings.locationOnScanSub")}
                            toggle toggleVal={locationEnabled}
                            onToggle={(v) => { setLocation(v); updateLocationConsent?.(v); }}
                            isLast
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                        />
                        <CardDivider label="WEEKLY DIGEST" />
                        <Row
                            iconEl={<Ic.Calendar c={T.purp} s={16} />}
                            iconBg={T.purpBg} iconBd={T.purpBd}
                            title="Activity Digest"
                            subtitle="Weekly scan summary sent to your phone"
                            toggle toggleVal={digestOn}
                            onToggle={(v) => { setDigestOn(v); updateNotificationPref?.('weeklyDigest', v); }}
                            size="compact"
                        />
                        {digestOn && (
                            <>
                                <View style={s.dayPickerLabel}>
                                    <Text style={s.dayPickerText}>SEND DIGEST ON</Text>
                                </View>
                                <DigestDayPicker
                                    value={digestDay}
                                    onChange={(d) => { setDigestDay(d); updateNotificationPref?.('digestDay', d); }}
                                />
                            </>
                        )}
                    </SettingsCard>
                </Animated.View>

<<<<<<< HEAD
                {/* F: Appearance */}
                <Animated.View entering={FadeInDown.delay(260).duration(350)} style={s.group}>
                    <SectionLabel label="Appearance" accent={T.tx3} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconGlobe color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Language"
                            subtitle={currentLang ? `${currentLang.native} · ${currentLang.label}` : 'English'}
=======
                {/* ── Appearance ── */}
                <Animated.View entering={FadeInDown.delay(260).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.appearance")} accent={C.tx3} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconGlobe color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t("settings.language")}
                            subtitle={`${currentLang.native} · ${currentLang.label}`}
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                            onPress={() => setLangModal(true)}
                            size="compact"
                        />
                        <Row
                            C={C}
                            iconEl={<IconMoon color={C.tx3} />}
                            iconBg={C.s4} iconBd={C.bd2}
                            title={t("settings.theme")}
                            subtitle={t("settings.themeSub")}
                            noChevron
<<<<<<< HEAD
                            right={<ThemeSegment value={theme} onChange={setTheme} />}
                            size="compact"
=======
                            right={<ThemeSegment />}  // reads context directly — no props needed
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

<<<<<<< HEAD
                {/* G: Account */}
                <Animated.View entering={FadeInDown.delay(290).duration(350)} style={s.group}>
                    <SectionLabel label="Account" accent={T.tx3} />
                    <SettingsCard>
                        <Row
                            iconEl={<IconPhone color={T.amb} />}
                            iconBg={T.ambBg} iconBd={T.ambBd}
                            title="Change Phone Number"
                            subtitle="OTP verification required"
                            onPress={() => Alert.alert('Coming Soon', 'Phone number change will be available in a future update.')}
                            size="compact"
                        />
                        <Row
                            iconEl={<IconInfo color={T.blue} />}
                            iconBg={T.blueBg} iconBd={T.blueBd}
                            title="Help & Support"
                            onPress={() => router.push('/(app)/support')}
                            size="compact"
=======
                {/* ── Account ── */}
                <Animated.View entering={FadeInDown.delay(290).duration(350)} style={s.group}>
                    <SectionLabel label={t("settings.account")} accent={C.tx3} />
                    <SettingsCard C={C}>
                        <Row
                            C={C}
                            iconEl={<IconPhone color={C.amb} />}
                            iconBg={C.ambBg} iconBd={C.ambBd}
                            title={t("settings.changePhone")}
                            subtitle={t("settings.changePhoneSub")}
                            onPress={() => router.push("/(app)/change-phone")}
                        />
                        <Row
                            C={C}
                            iconEl={<IconInfo color={C.blue} />}
                            iconBg={C.blueBg} iconBd={C.blueBd}
                            title={t("settings.support")}
                            onPress={() => router.push("/(app)/support")}
                        />
                        <Row
                            C={C}
                            iconEl={<LogOut c={C.red} s={16} />}
                            iconBg={C.redBg} iconBd={C.redBd}
                            title={t("settings.logout")}
                            onPress={handleLogout}
                            danger
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                            isLast
                        />
                    </SettingsCard>
                </Animated.View>

<<<<<<< HEAD
                {/* H: Danger Zone */}
                <Animated.View entering={FadeInDown.delay(320).duration(350)} style={s.group}>
                    <SectionLabel label="Danger Zone" accent={T.red} />
                    <DangerZoneCard>
                        <Row
                            iconEl={<Ic.LogOut c={T.red} s={16} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Log Out"
                            subtitle="You'll need OTP to sign back in"
                            onPress={handleLogout}
                            danger size="standard"
                        />
                        <Row
                            iconEl={<Ic.Trash c={T.red} s={16} />}
                            iconBg={T.redBg} iconBd={T.redBd}
                            title="Delete Account"
                            subtitle="Permanently erase all data and revoke all cards"
                            onPress={handleDeleteAccount}
                            danger size="standard" isLast
                        />
                    </DangerZoneCard>
                </Animated.View>

                {/* Footer */}
                <Animated.View entering={FadeInDown.delay(360).duration(350)} style={s.footer}>
                    <View style={s.footerLine} />
                    <Text style={s.footerApp}>RESQID · v1.0.0</Text>
                    <Text style={s.footerSub}>coreZ Technologies Pvt. Ltd.</Text>
                    <Text style={s.footerSub2}>Emergency ID Card Platform for Indian Schools</Text>
=======
                {/* ── Footer ── */}
                <Animated.View entering={FadeInDown.delay(320).duration(350)} style={s.footer}>
                    <View style={[s.footerDivider, { backgroundColor: C.bd2 }]} />
                    <Text style={[s.footerApp, { color: C.tx3 }]}>RESQID · v1.0.0</Text>
                    <Text style={[s.footerSub, { color: C.tx3 }]}>Emergency ID Card Platform</Text>
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

<<<<<<< HEAD
// ─── Styles ────────────────────────────────────────────────────────────────────
=======
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
const s = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[5],
        paddingBottom: spacing[12],
    },
<<<<<<< HEAD
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: spacing[1] },
    pageTitle: { fontSize: 26, fontWeight: '800', color: T.tx, letterSpacing: -0.5 },
    pageSub: { fontSize: 12.5, color: T.tx3, marginTop: 3 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, marginTop: 4 },
    pillActive: { backgroundColor: T.okBg, borderColor: T.okBd },
    pillInactive: { backgroundColor: T.ambBg, borderColor: T.ambBd },
    pillDot: { width: 5, height: 5, borderRadius: 3 },
    pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    group: { gap: 8 },
    dayPickerLabel: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 4 },
    dayPickerText: { fontSize: 9, fontWeight: '700', color: T.tx3, letterSpacing: 0.8 },
    footer: { alignItems: 'center', gap: 3, paddingTop: spacing[2] },
    footerLine: { width: 32, height: 1, backgroundColor: T.bd2, borderRadius: 1, marginBottom: 8 },
    footerApp: { fontSize: 11, fontWeight: '800', color: T.tx3, letterSpacing: 1.2 },
    footerSub: { fontSize: 11, color: T.tx3 },
    footerSub2: { fontSize: 10, color: T.tx4, marginTop: 1 },
=======
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingBottom: spacing[1],
    },
    pageTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    pageSub: { fontSize: 12.5, marginTop: 3 },
    statusPill: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1, marginTop: 4,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
    group: { gap: 8 },
    footer: { alignItems: "center", gap: 4, paddingTop: spacing[2] },
    footerDivider: { width: 32, height: 1, borderRadius: 1, marginBottom: 8 },
    footerApp: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
    footerSub: { fontSize: 11 },
>>>>>>> e44d5af02045e2ba776895ae6b70b3a08e61d6c9
});