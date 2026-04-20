/**
 * Badge — Status pill that maps directly to TokenStatus enum from schema.
 *
 * TokenStatus: UNASSIGNED | ISSUED | ACTIVE | INACTIVE | REVOKED | EXPIRED
 * Also handles: PENDING (UI-only state during setup flow)
 */

import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

// Maps TokenStatus → { label, color, bg }
const STATUS_MAP = {
    // ── From schema TokenStatus enum ──────────────
    ACTIVE: {
        label: 'Active',
        color: colors.statusActive,
        bg: colors.statusActiveBg,
        dot: true,
    },
    INACTIVE: {
        label: 'Inactive',
        color: colors.statusInactive,
        bg: colors.statusInactiveBg,
        dot: true,
    },
    ISSUED: {
        label: 'Setup Pending',
        color: colors.statusPending,
        bg: colors.statusPendingBg,
        dot: true,
    },
    UNASSIGNED: {
        label: 'Unassigned',
        color: colors.textTertiary,
        bg: 'rgba(85,92,112,0.12)',
        dot: false,
    },
    REVOKED: {
        label: 'Revoked',
        color: colors.statusRevoked,
        bg: colors.statusRevokedBg,
        dot: false,
    },
    EXPIRED: {
        label: 'Expired',
        color: colors.statusExpired,
        bg: colors.statusExpiredBg,
        dot: false,
    },

    // ── UI-only states ─────────────────────────────
    PENDING: {
        label: 'Setup Pending',
        color: colors.statusPending,
        bg: colors.statusPendingBg,
        dot: true,
    },
    AWAITING: {
        label: 'Awaiting Activation',
        color: colors.statusInactive,
        bg: colors.statusInactiveBg,
        dot: true,
    },
};

export default function Badge({
    status = 'ACTIVE',
    label,            // override the default label
    size = 'md',      // 'sm' | 'md'
    style,
}) {
    const config = STATUS_MAP[status] ?? STATUS_MAP.UNASSIGNED;
    const displayLabel = label ?? config.label;

    return (
        <View
            style={[
                styles.pill,
                { backgroundColor: config.bg },
                size === 'sm' && styles.pillSm,
                style,
            ]}
        >
            {config.dot && (
                <View style={[styles.dot, { backgroundColor: config.color }]} />
            )}
            <Text
                style={[
                    styles.text,
                    { color: config.color },
                    size === 'sm' && styles.textSm,
                ]}
            >
                {displayLabel}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing[1],
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[0.5] + 1,
        borderRadius: radius.chip,
    },
    pillSm: {
        paddingHorizontal: spacing[1.5],
        paddingVertical: 2,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    text: {
        ...typography.labelXs,
        fontWeight: '600',
    },
    textSm: {
        fontSize: 10,
    },
});
