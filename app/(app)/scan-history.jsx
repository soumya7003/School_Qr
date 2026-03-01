/**
 * Scan History Screen — Full ScanLog viewer for parents
 * Schema fields used:
 *   ScanLog:     id, result, scan_purpose, ip_city, ip_region, ip_country,
 *                latitude, longitude, created_at, device
 *   ScanAnomaly: id, reason, resolved, created_at
 *   ScanResult enum: SUCCESS | INVALID | REVOKED | EXPIRED | INACTIVE | RATE_LIMITED | ERROR
 */

import Screen from '@/src/components/common/Screen';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ScanIcon = ({ color }) => (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
        <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const LocationIcon = ({ color = colors.textTertiary }) => (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const AlertIcon = ({ color = colors.warning }) => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const CheckCircleIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={colors.success} strokeWidth={1.8} />
        <Path d="M9 12l2 2 4-4" stroke={colors.success} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const DeviceIcon = () => (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            stroke={colors.textTertiary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * ScanResult enum → color + label
 */
function resultMeta(result) {
    switch (result) {
        case 'SUCCESS': return { color: colors.success, bg: colors.successBg, label: 'Success' };
        case 'INVALID': return { color: colors.primary, bg: colors.primaryBg, label: 'Invalid' };
        case 'REVOKED': return { color: colors.primary, bg: colors.primaryBg, label: 'Revoked' };
        case 'EXPIRED': return { color: colors.warning, bg: colors.warningBg, label: 'Expired' };
        case 'INACTIVE': return { color: colors.textTertiary, bg: colors.surface3, label: 'Inactive' };
        case 'RATE_LIMITED': return { color: colors.warning, bg: colors.warningBg, label: 'Rate Limited' };
        case 'ERROR': return { color: colors.primary, bg: colors.primaryBg, label: 'Error' };
        default: return { color: colors.textTertiary, bg: colors.surface3, label: result ?? '—' };
    }
}

/**
 * scan_purpose → human label + emoji
 */
function purposeMeta(purpose) {
    if (purpose === 'EMERGENCY') return { label: 'Emergency Scan', emoji: '🆘' };
    if (purpose === 'REGISTRATION') return { label: 'Card Registration', emoji: '🔗' };
    return { label: 'General Scan', emoji: '👁' };
}

function fmtRelTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
}

function fmtFull(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function locationStr(scan) {
    const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location unknown';
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Emergency', 'Success', 'Flagged'];

function FilterTab({ label, active, onPress, count }) {
    return (
        <TouchableOpacity
            style={[styles.filterTab, active && styles.filterTabActive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                {label}
            </Text>
            {count > 0 && (
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && { color: colors.white }]}>
                        {count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ── Anomaly card ──────────────────────────────────────────────────────────────

function AnomalyCard({ anomaly }) {
    return (
        <View style={styles.anomalyCard}>
            <View style={styles.anomalyHeader}>
                <AlertIcon />
                <Text style={styles.anomalyLabel}>Suspicious Activity</Text>
                {anomaly.resolved && (
                    <View style={styles.resolvedBadge}>
                        <Text style={styles.resolvedText}>Resolved</Text>
                    </View>
                )}
            </View>
            <Text style={styles.anomalyReason}>{anomaly.reason}</Text>
            <Text style={styles.anomalyTime}>{fmtFull(anomaly.created_at)}</Text>
        </View>
    );
}

// ── Scan row ──────────────────────────────────────────────────────────────────

function ScanRow({ scan, index }) {
    const [expanded, setExpanded] = useState(false);
    const meta = resultMeta(scan.result);
    const purpose = purposeMeta(scan.scan_purpose);
    const loc = locationStr(scan);

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 40).duration(350)}
            layout={Layout.springify()}
        >
            <TouchableOpacity
                style={[
                    styles.scanRow,
                    scan.result !== 'SUCCESS' && styles.scanRowWarning,
                ]}
                onPress={() => setExpanded(v => !v)}
                activeOpacity={0.75}
            >
                {/* Left — result dot */}
                <View style={[styles.resultDot, { backgroundColor: meta.color }]} />

                {/* Middle — main info */}
                <View style={{ flex: 1 }}>
                    <View style={styles.scanRowTop}>
                        <Text style={styles.scanPurposeText}>
                            {purpose.emoji}  {purpose.label}
                        </Text>
                        <View style={[styles.resultBadge, { backgroundColor: meta.bg }]}>
                            <Text style={[styles.resultBadgeText, { color: meta.color }]}>
                                {meta.label}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.scanMetaRow}>
                        <LocationIcon />
                        <Text style={styles.scanMetaText}>{loc}</Text>
                        <Text style={styles.scanMetaDot}>·</Text>
                        <Text style={styles.scanMetaText}>{fmtRelTime(scan.created_at)}</Text>
                    </View>
                </View>

                {/* Right — expand chevron */}
                <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
            </TouchableOpacity>

            {/* Expanded detail */}
            {expanded && (
                <Animated.View
                    entering={FadeInDown.duration(250)}
                    style={styles.scanDetail}
                >
                    <View style={styles.detailGrid}>
                        <DetailCell label="Date & Time" value={fmtFull(scan.created_at)} />
                        <DetailCell label="Result" value={meta.label} valueColor={meta.color} />
                        <DetailCell label="Purpose" value={purpose.label} />
                        <DetailCell label="Location" value={loc} />
                        {scan.ip_address && (
                            <DetailCell label="IP Address" value={scan.ip_address} mono />
                        )}
                        {scan.device && (
                            <DetailCell label="Device" value={scan.device} />
                        )}
                    </View>
                    {scan.latitude && scan.longitude && (
                        <View style={styles.coordRow}>
                            <LocationIcon color={colors.info} />
                            <Text style={styles.coordText}>
                                GPS: {scan.latitude.toFixed(4)}, {scan.longitude.toFixed(4)}
                            </Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </Animated.View>
    );
}

function DetailCell({ label, value, valueColor, mono }) {
    return (
        <View style={styles.detailCell}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[
                styles.detailValue,
                valueColor && { color: valueColor },
                mono && styles.detailValueMono,
            ]}>
                {value}
            </Text>
        </View>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.empty}>
            <View style={styles.emptyIcon}>
                <ScanIcon color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>
                When someone scans your child's card, the activity will appear here.
            </Text>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ScanHistoryScreen() {
    const router = useRouter();
    const { recentScans, anomalies } = useProfileStore();

    const [activeFilter, setActiveFilter] = useState('All');

    const scans = recentScans ?? [];
    const allAnomalies = anomalies ?? [];
    const unresolved = allAnomalies.filter(a => !a.resolved);

    // Filter logic
    const filtered = scans.filter(s => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Emergency') return s.scan_purpose === 'EMERGENCY';
        if (activeFilter === 'Success') return s.result === 'SUCCESS';
        if (activeFilter === 'Flagged') return s.result !== 'SUCCESS';
        return true;
    });

    // Filter counts
    const counts = {
        All: scans.length,
        Emergency: scans.filter(s => s.scan_purpose === 'EMERGENCY').length,
        Success: scans.filter(s => s.result === 'SUCCESS').length,
        Flagged: scans.filter(s => s.result !== 'SUCCESS').length,
    };

    // Stats
    const totalScans = scans.length;
    const emergencyScans = counts.Emergency;
    const lastScan = scans[0];

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Scan History</Text>
                    <Text style={styles.pageSubtitle}>Every time your card was scanned</Text>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Stats row */}
                <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>{totalScans}</Text>
                        <Text style={styles.statLabel}>Total Scans</Text>
                    </View>
                    <View style={[styles.statCard, emergencyScans > 0 && styles.statCardRed]}>
                        <Text style={[styles.statNum, emergencyScans > 0 && { color: colors.primary }]}>
                            {emergencyScans}
                        </Text>
                        <Text style={styles.statLabel}>Emergency</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>{unresolved.length}</Text>
                        <Text style={styles.statLabel}>Anomalies</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>
                            {lastScan ? fmtRelTime(lastScan.created_at) : '—'}
                        </Text>
                        <Text style={styles.statLabel}>Last Scan</Text>
                    </View>
                </Animated.View>

                {/* Unresolved anomalies section */}
                {unresolved.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                        <Text style={styles.sectionLabel}>⚠️  Suspicious Activity</Text>
                        <View style={styles.anomalyList}>
                            {unresolved.map((a, i) => (
                                <AnomalyCard key={a.id ?? i} anomaly={a} />
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Filter tabs */}
                <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRow}
                    >
                        {FILTERS.map(f => (
                            <FilterTab
                                key={f}
                                label={f}
                                active={activeFilter === f}
                                onPress={() => setActiveFilter(f)}
                                count={f !== 'All' ? counts[f] : 0}
                            />
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Scan list */}
                {filtered.length === 0 ? (
                    <EmptyState />
                ) : (
                    <View style={styles.scanList}>
                        {filtered.map((scan, i) => (
                            <ScanRow key={scan.id ?? i} scan={scan} index={i} />
                        ))}
                    </View>
                )}

                {/* Privacy note */}
                <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.privacyNote}>
                    <CheckCircleIcon />
                    <Text style={styles.privacyNoteText}>
                        Scan logs are stored securely. IP and device data is used only for anomaly detection, never shared with third parties.
                    </Text>
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[3],
    },
    backBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingBottom: spacing[10],
        gap: spacing[4],
    },

    // ── Stats ─────────────────────────────────────
    statsRow: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3],
        alignItems: 'center',
        gap: spacing[1],
    },
    statCardRed: {
        backgroundColor: colors.primaryBg,
        borderColor: `rgba(232,52,42,0.2)`,
    },
    statNum: {
        ...typography.h4,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    statLabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
        textAlign: 'center',
    },

    // ── Section label ─────────────────────────────
    sectionLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[2],
    },

    // ── Anomaly card ──────────────────────────────
    anomalyList: {
        gap: spacing[2],
    },
    anomalyCard: {
        backgroundColor: colors.warningBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(245,158,11,0.25)`,
        padding: spacing[3.5],
        gap: spacing[1.5],
    },
    anomalyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
    },
    anomalyLabel: {
        ...typography.labelSm,
        color: colors.warning,
        fontWeight: '700',
        flex: 1,
    },
    resolvedBadge: {
        backgroundColor: colors.successBg,
        borderRadius: radius.chipFull,
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
    },
    resolvedText: {
        ...typography.labelXs,
        color: colors.success,
        fontWeight: '700',
    },
    anomalyReason: {
        ...typography.bodySm,
        color: colors.textSecondary,
    },
    anomalyTime: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },

    // ── Filter tabs ───────────────────────────────
    filterRow: {
        flexDirection: 'row',
        gap: spacing[2],
        paddingRight: spacing[2],
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        backgroundColor: colors.surface,
        borderRadius: radius.chipFull,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterTabText: {
        ...typography.labelSm,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: colors.white,
    },
    filterBadge: {
        backgroundColor: colors.surface3,
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 18,
        alignItems: 'center',
    },
    filterBadgeActive: {
        backgroundColor: `rgba(255,255,255,0.25)`,
    },
    filterBadgeText: {
        ...typography.labelXs,
        color: colors.textTertiary,
        fontWeight: '700',
        fontSize: 9,
    },

    // ── Scan list ─────────────────────────────────
    scanList: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    scanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    scanRowWarning: {
        backgroundColor: `rgba(232,52,42,0.03)`,
    },
    resultDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    scanRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[1],
    },
    scanPurposeText: {
        ...typography.labelSm,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    resultBadge: {
        paddingHorizontal: spacing[1.5],
        paddingVertical: 2,
        borderRadius: radius.chipFull,
    },
    resultBadgeText: {
        ...typography.labelXs,
        fontWeight: '700',
        fontSize: 9,
        textTransform: 'uppercase',
    },
    scanMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
    },
    scanMetaText: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
    scanMetaDot: {
        color: colors.textTertiary,
        fontSize: 10,
    },
    chevron: {
        color: colors.textTertiary,
        fontSize: 18,
        lineHeight: 20,
    },
    chevronOpen: {
        transform: [{ rotate: '90deg' }],
    },

    // ── Scan detail (expanded) ────────────────────
    scanDetail: {
        backgroundColor: colors.surface3,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        padding: spacing[4],
        gap: spacing[3],
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
    },
    detailCell: {
        width: '45%',
        gap: spacing[0.5],
    },
    detailLabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    detailValue: {
        ...typography.labelSm,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    detailValueMono: {
        fontFamily: 'monospace',
        fontSize: 11,
    },
    coordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
    },
    coordText: {
        ...typography.labelXs,
        color: colors.info,
        fontFamily: 'monospace',
    },

    // ── Empty ─────────────────────────────────────
    empty: {
        alignItems: 'center',
        paddingVertical: spacing[10],
        gap: spacing[3],
    },
    emptyIcon: {
        width: 56,
        height: 56,
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        ...typography.h4,
        color: colors.textPrimary,
    },
    emptyText: {
        ...typography.bodySm,
        color: colors.textTertiary,
        textAlign: 'center',
        maxWidth: 260,
    },

    // ── Privacy note ──────────────────────────────
    privacyNote: {
        flexDirection: 'row',
        gap: spacing[2],
        alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3.5],
    },
    privacyNoteText: {
        ...typography.labelXs,
        color: colors.textTertiary,
        flex: 1,
        lineHeight: 16,
    },
});