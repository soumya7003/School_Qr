/**
 * Button — Primary / Secondary / Ghost variants
 */

import { colors, radius, shadows, spacing, typography } from '@/src/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Button({
    label,
    onPress,
    variant = 'primary',   // 'primary' | 'secondary' | 'ghost' | 'danger'
    size = 'md',           // 'sm' | 'md' | 'lg'
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    style,
    labelStyle,
    fullWidth = true,
}) {
    const isDisabled = disabled || loading;

    const heightMap = {
        sm: spacing.btnHeightSm,
        md: spacing.btnHeight,
        lg: 60,
    };

    const containerStyle = [
        styles.base,
        { height: heightMap[size] },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
    ];

    const textStyle = [
        styles.label,
        size === 'sm' && typography.btnSm,
        size === 'md' && typography.btnMd,
        size === 'lg' && typography.btnLg,
        labelStyle,
    ];

    // ── Primary — gradient red ──────────────────────────────────────────────────
    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.8}
                style={[containerStyle, shadows.primarySm]}
            >
                <LinearGradient
                    colors={isDisabled
                        ? [colors.surface2, colors.surface2]
                        : [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                        <View style={styles.row}>
                            {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
                            <Text style={[textStyle, { color: colors.white }]}>{label}</Text>
                            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // ── Secondary — surface border ──────────────────────────────────────────────
    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.7}
                style={[containerStyle, styles.secondary]}
            >
                {loading ? (
                    <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : (
                    <View style={styles.row}>
                        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
                        <Text style={[textStyle, { color: colors.textPrimary }]}>{label}</Text>
                        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    // ── Ghost — transparent, primary text ──────────────────────────────────────
    if (variant === 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.6}
                style={containerStyle}
            >
                <View style={styles.row}>
                    {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
                    <Text style={[textStyle, { color: colors.primary }]}>{label}</Text>
                    {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
                </View>
            </TouchableOpacity>
        );
    }

    // ── Danger ─────────────────────────────────────────────────────────────────
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[containerStyle, styles.danger]}
        >
            <View style={styles.row}>
                {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
                <Text style={[textStyle, { color: colors.white }]}>{label}</Text>
                {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.btn,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    fullWidth: {
        width: '100%',
    },
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
    },
    secondary: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: spacing.base,
    },
    danger: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.base,
    },
    disabled: {
        opacity: 0.45,
    },
    label: {
        ...typography.btnMd,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconLeft: {
        marginRight: spacing.xs,
    },
    iconRight: {
        marginLeft: spacing.xs,
    },
});