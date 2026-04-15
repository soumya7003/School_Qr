// src/components/common/SettingsRow.jsx
import { colors } from '@/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const SettingsRow = ({
    icon,
    title,
    subtitle,
    rightElement,
    onPress,
    disabled = false,
    showDivider = true,
    style
}) => {
    const Container = onPress ? Pressable : View;

    return (
        <>
            <Container
                style={[
                    styles.row,
                    disabled && styles.disabled,
                    style
                ]}
                onPress={disabled ? undefined : onPress}
                disabled={disabled}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}

                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                {rightElement && (
                    <View style={styles.rightElement}>
                        {rightElement}
                    </View>
                )}
            </Container>
            {showDivider && <View style={styles.divider} />}
        </>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 60,
    },
    disabled: {
        opacity: 0.5,
    },
    iconContainer: {
        marginRight: 12,
        width: 24,
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textTertiary,
        lineHeight: 18,
    },
    rightElement: {
        marginLeft: 12,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 52,
    },
});