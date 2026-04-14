/**
 * SettingsRow + GroupLabel — Core primitives for every settings group.
 *
 * GroupLabel  — overline section title above a group card
 * SettingsRow — single tappable row with icon, text, badge, toggle, or chevron
 */

import { ChevronRight } from '@/components/icon/AllIcon';
import { colors, radius, spacing, typography } from '@/theme';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

// ── GroupLabel ─────────────────────────────────────────────────────────────

export function GroupLabel({ label }) {
    return <Text style={styles.groupLabel}>{label}</Text>;
}

// ── SettingsRow ────────────────────────────────────────────────────────────

export function SettingsRow({
    icon,
    iconBg,
    title,
    subtitle,
    value,
    onPress,
    toggle,
    toggleVal,
    onToggle,
    danger,
    badge,
    isLast,
    children,
}) {
    return (
        <TouchableOpacity
            style={[styles.row, isLast && styles.rowLast]}
            onPress={onPress}
            activeOpacity={onPress ? 0.65 : 1}
        >
            {/* Left icon */}
            <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
                {icon}
            </View>

            {/* Body */}
            <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
                    {title}
                </Text>
                {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
                {children}
            </View>

            {/* Right — badge */}
            {badge ? (
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.label}
                    </Text>
                </View>
            ) : null}

            {/* Right — plain value text */}
            {value ? (
                <Text style={styles.rowValue}>{value}</Text>
            ) : null}

            {/* Right — toggle switch */}
            {toggle ? (
                <Switch
                    value={toggleVal}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.surface3, true: colors.primary }}
                    thumbColor={colors.white}
                    ios_backgroundColor={colors.surface3}
                />
            ) : (!danger && !toggle && !children) ? (
                // Default — chevron arrow
                <ChevronRight />
            ) : null}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // ── GroupLabel ────────────────────────────────
    groupLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        paddingLeft: spacing[1],
    },

    // ── Row ───────────────────────────────────────
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3.5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowIcon: {
        width: 34,
        height: 34,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rowBody: {
        flex: 1,
        gap: spacing[0.5],
    },
    rowTitle: {
        ...typography.bodyMd,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    rowTitleDanger: {
        color: colors.primary,
    },
    rowSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 1,
    },
    rowValue: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },

    // ── Badge ─────────────────────────────────────
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
