/**
 * ScanHistoryPreview — Shows last 3 scans with anomaly banner
 * and a "View Full Scan History" link inside the settings group.
 */

import { IconClock, IconWarning } from '@/components/icon/AllIcon';
import { colors, spacing, typography } from '@/theme';
import { fmtDateTime } from '@/utils/profile.utils';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resultColor(result) {
    if (result === 'SUCCESS') return colors.success;
    if (result === 'INVALID' || result === 'ERROR') return colors.primary;
    return colors.warning;
}

function purposeLabel(p) {
    if (p === 'EMERGENCY') return '🆘 Emergency';
    if (p === 'REGISTRATION') return '🔗 Registration';
    return '👁 Scan';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScanHistoryPreview({ scans = [], anomalyCount = 0, onViewAll }) {
    return (
        <View style={styles.wrap}>
            {/* Anomaly warning banner */}
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

            {/* Empty state */}
            {scans.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>No scans yet — card hasn't been used</Text>
                </View>
            ) : (
                scans.slice(0, 3).map((s, i) => (
                    <View
                        key={s.id ?? i}
                        style={[styles.scanRow, i < Math.min(scans.length, 3) - 1 && styles.scanRowBorder]}
                    >
                        <View style={[styles.dot, { backgroundColor: resultColor(s.result) }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.purpose}>{purposeLabel(s.scan_purpose)}</Text>
                            <View style={styles.meta}>
                                <IconClock />
                                <Text style={styles.time}>{fmtDateTime(s.created_at)}</Text>
                                {(s.ip_city || s.ip_region) && (
                                    <Text style={styles.location}>
                                        · {[s.ip_city, s.ip_region].filter(Boolean).join(', ')}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Text style={[styles.result, { color: resultColor(s.result) }]}>
                            {s.result}
                        </Text>
                    </View>
                ))
            )}

            {/* View all link */}
            <TouchableOpacity style={styles.viewAll} onPress={onViewAll} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View Full Scan History →</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 0 },

    // ── Anomaly banner ────────────────────────────
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
    anomalyText: {
        ...typography.labelSm,
        color: colors.warning,
        flex: 1,
    },
    anomalyLink: {
        ...typography.labelSm,
        color: colors.warning,
        fontWeight: '700',
    },

    // ── Empty ─────────────────────────────────────
    empty: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[5],
        alignItems: 'center',
    },
    emptyText: {
        ...typography.bodySm,
        color: colors.textTertiary,
        textAlign: 'center',
    },

    // ── Scan rows ─────────────────────────────────
    scanRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    scanRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    purpose: {
        ...typography.labelSm,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
        marginTop: 2,
    },
    time: { ...typography.labelXs, color: colors.textTertiary },
    location: { ...typography.labelXs, color: colors.textTertiary },
    result: {
        ...typography.labelXs,
        fontWeight: '700',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ── View all ──────────────────────────────────
    viewAll: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    viewAllText: {
        ...typography.labelSm,
        color: colors.primary,
        fontWeight: '600',
    },
});