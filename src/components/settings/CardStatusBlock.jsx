/**
 * CardStatusBlock — Shows physical card number, status badge,
 * expiry date and activation date inside the Physical Card group.
 */

import { colors, radius, spacing, typography } from '@/theme';
import { fmtDate, tokenMeta } from '@/utils/profile.utils';
import { StyleSheet, Text, View } from 'react-native';

export default function CardStatusBlock({ token, card }) {
    if (!token && !card) return null;

    const meta = tokenMeta(token?.status, colors);
    const isExpiringSoon = token?.expires_at &&
        (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;

    return (
        <View style={styles.block}>
            {/* Card number */}
            <View style={styles.row}>
                <Text style={styles.label}>Card No.</Text>
                <Text style={styles.value}>{card?.card_number ?? '—'}</Text>
            </View>

            <View style={styles.divider} />

            {/* Status badge */}
            <View style={styles.row}>
                <Text style={styles.label}>Status</Text>
                <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
            </View>

            {/* Expiry */}
            <View style={styles.row}>
                <Text style={styles.label}>Valid Until</Text>
                <Text style={[styles.value, isExpiringSoon && { color: colors.warning }]}>
                    {fmtDate(token?.expires_at)}{isExpiringSoon ? '  ⚠️' : ''}
                </Text>
            </View>

            {/* Activated date */}
            {token?.activated_at && (
                <View style={styles.row}>
                    <Text style={styles.label}>Activated</Text>
                    <Text style={styles.value}>{fmtDate(token.activated_at)}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    block: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        ...typography.labelXs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    value: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing[0.5],
    },
    badge: {
        paddingHorizontal: spacing[2],
        paddingVertical: 3,
        borderRadius: radius.chipFull,
    },
    badgeText: {
        ...typography.labelXs,
        fontWeight: '700',
        fontSize: 10,
    },
});
