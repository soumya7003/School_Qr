/**
 * PendingUpdatesBanner — Shows pending/rejected StudentUpdateRequest
 * status above the settings content. Returns null if nothing to show.
 */

import { IconClock, IconWarning } from '@/components/icon/AllIcon';
import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function PendingUpdatesBanner({ requests = [] }) {
    const pending = requests.filter(r => r.status === 'PENDING');
    const rejected = requests.filter(r => r.status === 'REJECTED');

    if (!pending.length && !rejected.length) return null;

    return (
        <View style={styles.wrap}>
            {pending.length > 0 && (
                <View style={styles.pendingRow}>
                    <IconClock color={colors.warning} />
                    <Text style={styles.pendingText}>
                        {pending.length} profile update{pending.length > 1 ? 's' : ''} pending school approval
                    </Text>
                </View>
            )}
            {rejected.length > 0 && (
                <View style={styles.pendingRow}>
                    <IconWarning color={colors.primary} />
                    <Text style={[styles.pendingText, { color: colors.primary }]}>
                        {rejected.length} update{rejected.length > 1 ? 's' : ''} rejected — tap to review
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: colors.warningBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
        padding: spacing[3],
        gap: spacing[2],
    },
    pendingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    pendingText: {
        ...typography.labelSm,
        color: colors.warning,
        flex: 1,
    },
});