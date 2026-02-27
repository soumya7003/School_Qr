/**
 * Input — Text input with label, left icon, error state
 */

import { colors, radius, spacing, typography } from '@/src/theme';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Input({
    label,
    placeholder,
    value,
    onChangeText,
    onBlur,
    onFocus,
    iconLeft,
    iconRight,
    onIconRightPress,
    error,
    hint,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    editable = true,
    maxLength,
    style,
    inputStyle,
}) {
    const [focused, setFocused] = useState(false);

    const handleFocus = (e) => {
        setFocused(true);
        onFocus?.(e);
    };
    const handleBlur = (e) => {
        setFocused(false);
        onBlur?.(e);
    };

    const borderColor = error
        ? colors.primary
        : focused
            ? colors.borderActive
            : colors.border;

    const borderWidth = focused || error ? 1.5 : 1;

    return (
        <View style={[styles.wrapper, style]}>
            {/* Label */}
            {label && (
                <Text style={styles.label}>{label}</Text>
            )}

            {/* Input row */}
            <View
                style={[
                    styles.inputRow,
                    {
                        borderColor,
                        borderWidth,
                        backgroundColor: focused ? colors.surface : colors.surface,
                    },
                    focused && styles.focusedShadow,
                    !editable && styles.disabled,
                ]}
            >
                {/* Left icon */}
                {iconLeft && (
                    <View style={styles.iconLeft}>{iconLeft}</View>
                )}

                <TextInput
                    style={[styles.input, inputStyle]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    editable={editable}
                    maxLength={maxLength}
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                />

                {/* Right icon */}
                {iconRight && (
                    <TouchableOpacity
                        onPress={onIconRightPress}
                        style={styles.iconRight}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        {iconRight}
                    </TouchableOpacity>
                )}
            </View>

            {/* Error / Hint */}
            {error ? (
                <Text style={styles.error}>{error}</Text>
            ) : hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing[1.5],
    },
    label: {
        ...typography.labelXs,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: spacing.inputHeight,
        borderRadius: radius.input,
        paddingHorizontal: spacing[4],
        gap: spacing[2.5],
    },
    focusedShadow: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    disabled: {
        opacity: 0.5,
    },
    input: {
        flex: 1,
        ...typography.bodyLg,
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    iconLeft: {
        opacity: 0.6,
    },
    iconRight: {
        opacity: 0.7,
    },
    error: {
        ...typography.labelXs,
        color: colors.primary,
        marginTop: 2,
    },
    hint: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },
});