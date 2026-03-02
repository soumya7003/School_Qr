/**
 * ThemeSegment — Inline 3-way toggle: Light / Dark / System.
 * Used inside the Appearance settings group.
 */

import { THEME_OPTIONS } from '@/constants/constants';
import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ThemeSegment({ value, onChange }) {
    return (
        <View style={styles.segment}>
            {THEME_OPTIONS.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    style={[
                        styles.option,
                        value === opt.value && styles.optionActive,
                    ]}
                    onPress={() => onChange(opt.value)}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.optionText,
                        value === opt.value && styles.optionTextActive,
                    ]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    segment: {
        flexDirection: 'row',
        backgroundColor: colors.surface3,
        borderRadius: radius.md,
        padding: 3,
        marginTop: spacing[2],
        alignSelf: 'flex-start',
        gap: 2,
    },
    option: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: radius.sm,
    },
    optionActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    optionText: {
        ...typography.labelSm,
        color: colors.textTertiary,
        fontWeight: '500',
    },
    optionTextActive: {
        color: colors.textPrimary,
        fontWeight: '700',
    },
});