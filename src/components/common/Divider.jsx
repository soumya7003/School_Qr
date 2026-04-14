/**
 * Divider — horizontal line with optional center label
 */

import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export default function Divider({ label, style }) {
    return (
        <View style={[styles.row, style]}>
            <View style={styles.line} />
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}
            <View style={styles.line} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    label: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
});
