/**
 * Card — Surface container with optional top accent strip
 */

import { colors, radius, shadows, spacing } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export default function Card({
    children,
    accent = false,          // show top red gradient strip
    accentColors,            // custom gradient colors for accent
    elevated = false,        // stronger shadow
    style,
    innerStyle,
    bg,
}) {
    return (
        <View
            style={[
                styles.card,
                elevated ? shadows.lg : shadows.sm,
                bg && { backgroundColor: bg },
                style,
            ]}
        >
            {/* Top accent strip */}
            {accent && (
                <LinearGradient
                    colors={accentColors ?? [colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accent}
                />
            )}

            <View style={[styles.inner, innerStyle]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface2,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    accent: {
        height: 4,
        width: '100%',
    },
    inner: {
        padding: spacing.cardPad,
    },
});