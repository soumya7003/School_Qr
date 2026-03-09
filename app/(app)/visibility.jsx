<<<<<<< HEAD
/**
 * Visibility Screen — Controls EmergencyProfile.visibility
 * Schema: ProfileVisibility enum → PUBLIC | MINIMAL | HIDDEN
 * Also controls EmergencyProfile.is_visible (master on/off)
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5"
            stroke={colors.white} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const EyeIcon = ({ size = 20, color = colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const EyeOffIcon = ({ size = 20, color = colors.textTertiary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const ShieldIcon = ({ color = colors.warning }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UserIcon = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const LockIcon = ({ color = colors.textTertiary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ── Visibility options — mapped from ProfileVisibility enum ────────────────────

const VISIBILITY_OPTIONS = [
    {
        value: 'PUBLIC',
        label: 'Full Info Visible',
        tagline: 'Recommended for emergencies',
        description: 'Anyone who scans sees name, photo, blood group, allergies, conditions, medications, and all emergency contacts.',
        icon: <EyeIcon size={22} color={colors.success} />,
        iconBg: colors.successBg,
        accentColor: colors.success,
        fields: [
            { label: 'Name & Photo', visible: true },
            { label: 'Blood Group', visible: true },
            { label: 'Allergies & Conditions', visible: true },
            { label: 'Medications', visible: true },
            { label: 'Doctor Info', visible: true },
            { label: 'Emergency Contacts', visible: true },
        ],
    },
    {
        value: 'MINIMAL',
        label: 'Name & Contacts Only',
        tagline: 'Balanced privacy',
        description: 'Scanners see name, photo, and emergency contact buttons. Medical details stay hidden unless someone is actively helping.',
        icon: <ShieldIcon color={colors.warning} />,
        iconBg: colors.warningBg,
        accentColor: colors.warning,
        fields: [
            { label: 'Name & Photo', visible: true },
            { label: 'Blood Group', visible: false },
            { label: 'Allergies & Conditions', visible: false },
            { label: 'Medications', visible: false },
            { label: 'Doctor Info', visible: false },
            { label: 'Emergency Contacts', visible: true },
        ],
    },
    {
        value: 'HIDDEN',
        label: 'Hidden',
        tagline: 'Card shows nothing',
        description: 'Scanning shows only that this is a registered emergency card. No personal info is revealed. Only use if card is temporarily inactive.',
        icon: <EyeOffIcon size={22} color={colors.textTertiary} />,
        iconBg: colors.surface3,
        accentColor: colors.textTertiary,
        fields: [
            { label: 'Name & Photo', visible: false },
            { label: 'Blood Group', visible: false },
            { label: 'Allergies & Conditions', visible: false },
            { label: 'Medications', visible: false },
            { label: 'Doctor Info', visible: false },
            { label: 'Emergency Contacts', visible: false },
        ],
    },
];

// ── Field visibility row ───────────────────────────────────────────────────────

function FieldRow({ label, visible }) {
    return (
        <View style={styles.fieldRow}>
            {visible ? (
                <View style={styles.fieldDotVisible} />
            ) : (
                <View style={styles.fieldDotHidden} />
            )}
            <Text style={[styles.fieldLabel, !visible && styles.fieldLabelMuted]}>
                {label}
            </Text>
            {!visible && <LockIcon />}
        </View>
    );
}

// ── Option card ───────────────────────────────────────────────────────────────

function VisibilityCard({ option, selected, onSelect, delay }) {
    const isSelected = selected === option.value;

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
            <TouchableOpacity
                style={[
                    styles.optionCard,
                    isSelected && {
                        borderColor: option.accentColor,
                        borderWidth: 2,
                        backgroundColor: `${option.accentColor}08`,
                    },
                ]}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.75}
            >
                {/* Header row */}
                <View style={styles.optionHeader}>
                    <View style={[styles.optionIconWrap, { backgroundColor: option.iconBg }]}>
                        {option.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.optionTitleRow}>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            {isSelected && (
                                <View style={[styles.selectedDot, { backgroundColor: option.accentColor }]}>
                                    <CheckIcon />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.optionTagline, { color: option.accentColor }]}>
                            {option.tagline}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <Text style={styles.optionDesc}>{option.description}</Text>

                {/* Field breakdown — only show when selected */}
                {isSelected && (
                    <Animated.View
                        entering={FadeInRight.duration(300)}
                        style={styles.fieldBreakdown}
                    >
                        <Text style={styles.fieldBreakdownTitle}>What scanners will see</Text>
                        {option.fields.map((f) => (
                            <FieldRow key={f.label} label={f.label} visible={f.visible} />
                        ))}
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function VisibilityScreen() {
    const router = useRouter();
    const { emergencyProfile, updateVisibility } = useProfileStore();

    // EmergencyProfile.visibility — default PUBLIC per schema
    const [selected, setSelected] = useState(emergencyProfile?.visibility ?? 'PUBLIC');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateVisibility(selected);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            router.back();
        }, 1200);
    };

    const current = VISIBILITY_OPTIONS.find(o => o.value === selected);

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Who Can See What</Text>
                    <Text style={styles.pageSubtitle}>Controls what strangers see when they scan</Text>
                </View>
            </Animated.View>

            <Animated.ScrollView
                entering={FadeInDown.delay(50).duration(400)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Context banner */}
                <View style={styles.contextBanner}>
                    <View style={styles.contextIconWrap}>
                        <UserIcon color={colors.info} />
                    </View>
                    <Text style={styles.contextText}>
                        This controls what a <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>stranger</Text> sees when they scan your child's physical card. In a real emergency, <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Full Info</Text> helps first responders act faster.
                    </Text>
                </View>

                {/* Options */}
                {VISIBILITY_OPTIONS.map((opt, i) => (
                    <VisibilityCard
                        key={opt.value}
                        option={opt}
                        selected={selected}
                        onSelect={setSelected}
                        delay={100 + i * 60}
                    />
                ))}

                {/* Save button */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            saved && styles.saveBtnDone,
                            { borderColor: current?.accentColor ?? colors.primary },
                        ]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.saveBtnText,
                            saved && { color: colors.success },
                        ]}>
                            {saved ? '✓ Saved' : `Save — ${current?.label}`}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Warning for HIDDEN */}
                {selected === 'HIDDEN' && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.hiddenWarning}>
                        <Text style={styles.hiddenWarningText}>
                            ⚠️  Hidden mode means no one can help your child in an emergency. Only use this temporarily if the card is lost.
                        </Text>
                    </Animated.View>
                )}
            </Animated.ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[4],
    },
    backBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingBottom: spacing[10],
        gap: spacing[3],
    },

    // ── Context banner ────────────────────────────
    contextBanner: {
        flexDirection: 'row',
        gap: spacing[3],
        backgroundColor: colors.infoBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(59,130,246,0.2)`,
        padding: spacing[3.5],
        alignItems: 'flex-start',
    },
    contextIconWrap: {
        width: 32,
        height: 32,
        backgroundColor: `rgba(59,130,246,0.12)`,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    contextText: {
        ...typography.labelSm,
        color: colors.textSecondary,
        lineHeight: 18,
        flex: 1,
    },

    // ── Option card ───────────────────────────────
    optionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
        gap: spacing[3],
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    optionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[0.5],
    },
    optionLabel: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    selectedDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTagline: {
        ...typography.labelXs,
        fontWeight: '600',
    },
    optionDesc: {
        ...typography.bodySm,
        color: colors.textSecondary,
        lineHeight: 18,
    },

    // ── Field breakdown ───────────────────────────
    fieldBreakdown: {
        backgroundColor: colors.surface3,
        borderRadius: radius.md,
        padding: spacing[3],
        gap: spacing[1.5],
    },
    fieldBreakdownTitle: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[1],
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    fieldDotVisible: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.success,
    },
    fieldDotHidden: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.surface3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    fieldLabel: {
        ...typography.labelSm,
        color: colors.textSecondary,
        flex: 1,
    },
    fieldLabelMuted: {
        color: colors.textTertiary,
    },

    // ── Save ──────────────────────────────────────
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginTop: spacing[2],
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    saveBtnDone: {
        backgroundColor: colors.successBg,
        borderColor: colors.success,
    },
    saveBtnText: {
        ...typography.btnMd,
        color: colors.white,
        fontWeight: '700',
    },

    // ── Hidden warning ────────────────────────────
    hiddenWarning: {
        backgroundColor: colors.primaryBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(232,52,42,0.25)`,
        padding: spacing[3.5],
    },
    hiddenWarningText: {
        ...typography.bodySm,
        color: colors.primary,
        lineHeight: 18,
    },
=======
/**
 * Visibility Screen — Controls EmergencyProfile.visibility
 * Schema: ProfileVisibility enum → PUBLIC | MINIMAL | HIDDEN
 * Also controls EmergencyProfile.is_visible (master on/off)
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5"
            stroke={colors.white} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const EyeIcon = ({ size = 20, color = colors.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const EyeOffIcon = ({ size = 20, color = colors.textTertiary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const ShieldIcon = ({ color = colors.warning }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const UserIcon = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const LockIcon = ({ color = colors.textTertiary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ── Visibility options — mapped from ProfileVisibility enum ────────────────────

const VISIBILITY_OPTIONS = [
    {
        value: 'PUBLIC',
        label: 'Full Info Visible',
        tagline: 'Recommended for emergencies',
        description: 'Anyone who scans sees name, photo, blood group, allergies, conditions, medications, and all emergency contacts.',
        icon: <EyeIcon size={22} color={colors.success} />,
        iconBg: colors.successBg,
        accentColor: colors.success,
        fields: [
            { label: 'Name & Photo', visible: true },
            { label: 'Blood Group', visible: true },
            { label: 'Allergies & Conditions', visible: true },
            { label: 'Medications', visible: true },
            { label: 'Doctor Info', visible: true },
            { label: 'Emergency Contacts', visible: true },
        ],
    },
    {
        value: 'MINIMAL',
        label: 'Name & Contacts Only',
        tagline: 'Balanced privacy',
        description: 'Scanners see name, photo, and emergency contact buttons. Medical details stay hidden unless someone is actively helping.',
        icon: <ShieldIcon color={colors.warning} />,
        iconBg: colors.warningBg,
        accentColor: colors.warning,
        fields: [
            { label: 'Name & Photo', visible: true },
            { label: 'Blood Group', visible: false },
            { label: 'Allergies & Conditions', visible: false },
            { label: 'Medications', visible: false },
            { label: 'Doctor Info', visible: false },
            { label: 'Emergency Contacts', visible: true },
        ],
    },
    {
        value: 'HIDDEN',
        label: 'Hidden',
        tagline: 'Card shows nothing',
        description: 'Scanning shows only that this is a registered emergency card. No personal info is revealed. Only use if card is temporarily inactive.',
        icon: <EyeOffIcon size={22} color={colors.textTertiary} />,
        iconBg: colors.surface3,
        accentColor: colors.textTertiary,
        fields: [
            { label: 'Name & Photo', visible: false },
            { label: 'Blood Group', visible: false },
            { label: 'Allergies & Conditions', visible: false },
            { label: 'Medications', visible: false },
            { label: 'Doctor Info', visible: false },
            { label: 'Emergency Contacts', visible: false },
        ],
    },
];

// ── Field visibility row ───────────────────────────────────────────────────────

function FieldRow({ label, visible }) {
    return (
        <View style={styles.fieldRow}>
            {visible ? (
                <View style={styles.fieldDotVisible} />
            ) : (
                <View style={styles.fieldDotHidden} />
            )}
            <Text style={[styles.fieldLabel, !visible && styles.fieldLabelMuted]}>
                {label}
            </Text>
            {!visible && <LockIcon />}
        </View>
    );
}

// ── Option card ───────────────────────────────────────────────────────────────

function VisibilityCard({ option, selected, onSelect, delay }) {
    const isSelected = selected === option.value;

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
            <TouchableOpacity
                style={[
                    styles.optionCard,
                    isSelected && {
                        borderColor: option.accentColor,
                        borderWidth: 2,
                        backgroundColor: `${option.accentColor}08`,
                    },
                ]}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.75}
            >
                {/* Header row */}
                <View style={styles.optionHeader}>
                    <View style={[styles.optionIconWrap, { backgroundColor: option.iconBg }]}>
                        {option.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.optionTitleRow}>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            {isSelected && (
                                <View style={[styles.selectedDot, { backgroundColor: option.accentColor }]}>
                                    <CheckIcon />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.optionTagline, { color: option.accentColor }]}>
                            {option.tagline}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <Text style={styles.optionDesc}>{option.description}</Text>

                {/* Field breakdown — only show when selected */}
                {isSelected && (
                    <Animated.View
                        entering={FadeInRight.duration(300)}
                        style={styles.fieldBreakdown}
                    >
                        <Text style={styles.fieldBreakdownTitle}>What scanners will see</Text>
                        {option.fields.map((f) => (
                            <FieldRow key={f.label} label={f.label} visible={f.visible} />
                        ))}
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function VisibilityScreen() {
    const router = useRouter();
    const { emergencyProfile, updateVisibility } = useProfileStore();

    // EmergencyProfile.visibility — default PUBLIC per schema
    const [selected, setSelected] = useState(emergencyProfile?.visibility ?? 'PUBLIC');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateVisibility(selected);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                router.back();
            }, 1200);
        } catch {
            Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const current = VISIBILITY_OPTIONS.find(o => o.value === selected);

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Who Can See What</Text>
                    <Text style={styles.pageSubtitle}>Controls what strangers see when they scan</Text>
                </View>
            </Animated.View>

            <Animated.ScrollView
                entering={FadeInDown.delay(50).duration(400)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Context banner */}
                <View style={styles.contextBanner}>
                    <View style={styles.contextIconWrap}>
                        <UserIcon color={colors.info} />
                    </View>
                    <Text style={styles.contextText}>
                        This controls what a <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>stranger</Text> sees when they scan your child's physical card. In a real emergency, <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Full Info</Text> helps first responders act faster.
                    </Text>
                </View>

                {/* Options */}
                {VISIBILITY_OPTIONS.map((opt, i) => (
                    <VisibilityCard
                        key={opt.value}
                        option={opt}
                        selected={selected}
                        onSelect={setSelected}
                        delay={100 + i * 60}
                    />
                ))}

                {/* Save button */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            saved && styles.saveBtnDone,
                            { borderColor: current?.accentColor ?? colors.primary },
                            saving && { opacity: 0.6 },
                        ]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={saving}
                    >
                        <Text style={[
                            styles.saveBtnText,
                            saved && { color: colors.success },
                        ]}>
                            {saving ? 'Saving…' : saved ? '✓ Saved' : `Save — ${current?.label}`}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Warning for HIDDEN */}
                {selected === 'HIDDEN' && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.hiddenWarning}>
                        <Text style={styles.hiddenWarningText}>
                            ⚠️  Hidden mode means no one can help your child in an emergency. Only use this temporarily if the card is lost.
                        </Text>
                    </Animated.View>
                )}
            </Animated.ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[4],
    },
    backBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingBottom: spacing[10],
        gap: spacing[3],
    },

    // ── Context banner ────────────────────────────
    contextBanner: {
        flexDirection: 'row',
        gap: spacing[3],
        backgroundColor: colors.infoBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(59,130,246,0.2)`,
        padding: spacing[3.5],
        alignItems: 'flex-start',
    },
    contextIconWrap: {
        width: 32,
        height: 32,
        backgroundColor: `rgba(59,130,246,0.12)`,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    contextText: {
        ...typography.labelSm,
        color: colors.textSecondary,
        lineHeight: 18,
        flex: 1,
    },

    // ── Option card ───────────────────────────────
    optionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
        gap: spacing[3],
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    optionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    optionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[0.5],
    },
    optionLabel: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    selectedDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTagline: {
        ...typography.labelXs,
        fontWeight: '600',
    },
    optionDesc: {
        ...typography.bodySm,
        color: colors.textSecondary,
        lineHeight: 18,
    },

    // ── Field breakdown ───────────────────────────
    fieldBreakdown: {
        backgroundColor: colors.surface3,
        borderRadius: radius.md,
        padding: spacing[3],
        gap: spacing[1.5],
    },
    fieldBreakdownTitle: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[1],
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    fieldDotVisible: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.success,
    },
    fieldDotHidden: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.surface3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    fieldLabel: {
        ...typography.labelSm,
        color: colors.textSecondary,
        flex: 1,
    },
    fieldLabelMuted: {
        color: colors.textTertiary,
    },

    // ── Save ──────────────────────────────────────
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingVertical: spacing[4],
        alignItems: 'center',
        marginTop: spacing[2],
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    saveBtnDone: {
        backgroundColor: colors.successBg,
        borderColor: colors.success,
    },
    saveBtnText: {
        ...typography.btnMd,
        color: colors.white,
        fontWeight: '700',
    },

    // ── Hidden warning ────────────────────────────
    hiddenWarning: {
        backgroundColor: colors.primaryBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: `rgba(232,52,42,0.25)`,
        padding: spacing[3.5],
    },
    hiddenWarningText: {
        ...typography.bodySm,
        color: colors.primary,
        lineHeight: 18,
    },
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
});