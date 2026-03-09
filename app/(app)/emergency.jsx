/**
 * Emergency Screen — Two sections:
 *
 *  1. PREVIEW — exactly what a first responder sees when they scan the card
 *     (respects current visibility + hidden_fields settings)
 *
 *  2. VISIBILITY CONTROLS — parent can switch PUBLIC / MINIMAL / HIDDEN
 *     and toggle individual fields on/off
 *
 * Schema models used:
 *   CardVisibility:   visibility (ProfileVisibility), hidden_fields (String[])
 *   EmergencyProfile: blood_group, allergies, conditions, medications,
 *                     doctor_name, doctor_phone, notes
 *   EmergencyContact: name, phone, relationship, priority
 *   Student:          first_name, last_name, class, section, school
 *
 * Data source:
 *   All data already in profile.store — GET /parent/me fetched on login.
 *   Visibility save: PATCH /parent/student/:id with { student, emergency, contacts }
 *   TODO: add a dedicated visibility PATCH endpoint or reuse patchStudent
 *
 * ProfileVisibility enum:
 *   PUBLIC  — all fields shown to scanner
 *   MINIMAL — only blood_group + emergency contacts shown
 *   HIDDEN  — nothing shown (card shows "info hidden by parent")
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { colors, radius, spacing, typography } from '@/theme';
import { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconEye = ({ color = colors.success, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

const IconEyeOff = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconShield = ({ color = colors.success, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconPhone = ({ color = colors.success, size = 15 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconAlert = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconLock = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconInfo = ({ color = colors.textTertiary, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconCheck = ({ color = colors.white, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─── Visibility config ────────────────────────────────────────────────────────
// Maps ProfileVisibility enum → what a scanner actually sees

const VISIBILITY_CONFIG = {
    PUBLIC: {
        label: 'Public',
        sublabel: 'All info visible to scanner',
        color: colors.success,
        bg: colors.successBg,
        border: 'rgba(22,163,74,0.25)',
        icon: <IconEye color={colors.success} size={18} />,
        fields: ['blood_group', 'allergies', 'conditions', 'medications', 'doctor_name', 'doctor_phone', 'notes', 'contacts'],
    },
    MINIMAL: {
        label: 'Minimal',
        sublabel: 'Only blood group + contacts shown',
        color: colors.warning,
        bg: colors.warningBg,
        border: 'rgba(245,158,11,0.25)',
        icon: <IconEye color={colors.warning} size={18} />,
        fields: ['blood_group', 'contacts'],
    },
    HIDDEN: {
        label: 'Hidden',
        sublabel: 'Scanner sees "info hidden by parent"',
        color: colors.primary,
        bg: colors.primaryBg,
        border: 'rgba(232,52,42,0.2)',
        icon: <IconEyeOff color={colors.primary} size={18} />,
        fields: [],
    },
};

// All toggleable fields with labels
const ALL_FIELDS = [
    { key: 'blood_group', label: 'Blood Group', emoji: '🩸', minimalAllowed: true },
    { key: 'allergies', label: 'Allergies', emoji: '⚠️', minimalAllowed: false },
    { key: 'conditions', label: 'Medical Conditions', emoji: '🏥', minimalAllowed: false },
    { key: 'medications', label: 'Medications', emoji: '💊', minimalAllowed: false },
    { key: 'doctor_name', label: 'Doctor Name', emoji: '👨‍⚕️', minimalAllowed: false },
    { key: 'doctor_phone', label: 'Doctor Phone', emoji: '📞', minimalAllowed: false },
    { key: 'notes', label: 'Notes', emoji: '📝', minimalAllowed: false },
    { key: 'contacts', label: 'Emergency Contacts', emoji: '👥', minimalAllowed: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFieldVisible(fieldKey, visibility, hiddenFields = []) {
    if (visibility === 'HIDDEN') return false;
    if (visibility === 'MINIMAL') {
        const config = VISIBILITY_CONFIG.MINIMAL;
        return config.fields.includes(fieldKey) && !hiddenFields.includes(fieldKey);
    }
    return !hiddenFields.includes(fieldKey);
}

// ─── Preview Row ──────────────────────────────────────────────────────────────

function PreviewRow({ emoji, label, value, last }) {
    if (!value) return null;
    return (
        <View style={[styles.previewRow, !last && styles.previewRowBorder]}>
            <Text style={styles.previewEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
                <Text style={styles.previewLabel}>{label}</Text>
                <Text style={styles.previewValue}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Scanner Preview ──────────────────────────────────────────────────────────
// Simulates exactly what a first responder sees when they scan the card

function ScannerPreview({ student, emergency, contacts, visibility, hiddenFields }) {
    const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;

    const show = (key) => isFieldVisible(key, visibility, hiddenFields);

    const visibleContacts = show('contacts')
        ? (contacts ?? []).filter(c => c).sort((a, b) => a.priority - b.priority)
        : [];

    const hasAnyData = visibility !== 'HIDDEN' && (
        show('blood_group') && emergency?.blood_group ||
        show('allergies') && emergency?.allergies ||
        show('conditions') && emergency?.conditions ||
        show('medications') && emergency?.medications ||
        show('doctor_name') && emergency?.doctor_name ||
        show('doctor_phone') && emergency?.doctor_phone ||
        show('notes') && emergency?.notes ||
        visibleContacts.length > 0
    );

    return (
        <View style={styles.previewCard}>
            {/* Scanner header — mimics what the scan page shows */}
            <View style={[styles.previewHeader, { backgroundColor: cfg.bg, borderBottomColor: `${cfg.color}20` }]}>
                <View style={styles.previewHeaderLeft}>
                    <View style={[styles.previewIconWrap, { backgroundColor: `${cfg.color}20` }]}>
                        {cfg.icon}
                    </View>
                    <View>
                        <Text style={styles.previewScannerTitle}>
                            {student?.first_name
                                ? `${student.first_name}${student?.last_name ? ` ${student.last_name}` : ''}`
                                : 'Student Name'}
                        </Text>
                        <Text style={[styles.previewScannerSub, { color: cfg.color }]}>
                            {cfg.sublabel}
                        </Text>
                    </View>
                </View>
                <View style={[styles.previewBadge, { backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }]}>
                    <View style={[styles.previewBadgeDot, { backgroundColor: cfg.color }]} />
                    <Text style={[styles.previewBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            {/* Data rows */}
            {visibility === 'HIDDEN' ? (
                <View style={styles.hiddenNotice}>
                    <IconLock color={colors.primary} size={20} />
                    <View>
                        <Text style={styles.hiddenNoticeTitle}>Info Hidden by Parent</Text>
                        <Text style={styles.hiddenNoticeText}>
                            Emergency info is not visible to scanners.
                        </Text>
                    </View>
                </View>
            ) : !hasAnyData ? (
                <View style={styles.hiddenNotice}>
                    <IconInfo color={colors.textTertiary} size={18} />
                    <Text style={styles.hiddenNoticeText}>
                        No visible data — fill in emergency profile to make this useful.
                    </Text>
                </View>
            ) : (
                <View style={styles.previewRows}>
                    {show('blood_group') && (
                        <PreviewRow
                            emoji="🩸" label="Blood Group"
                            value={emergency?.blood_group}
                        />
                    )}
                    {show('allergies') && (
                        <PreviewRow
                            emoji="⚠️" label="Allergies"
                            value={emergency?.allergies}
                        />
                    )}
                    {show('conditions') && (
                        <PreviewRow
                            emoji="🏥" label="Medical Conditions"
                            value={emergency?.conditions}
                        />
                    )}
                    {show('medications') && (
                        <PreviewRow
                            emoji="💊" label="Medications"
                            value={emergency?.medications}
                        />
                    )}
                    {show('doctor_name') && (
                        <PreviewRow
                            emoji="👨‍⚕️" label="Doctor"
                            value={emergency?.doctor_name}
                        />
                    )}
                    {show('doctor_phone') && (
                        <PreviewRow
                            emoji="📞" label="Doctor Phone"
                            value={emergency?.doctor_phone}
                        />
                    )}
                    {show('notes') && (
                        <PreviewRow
                            emoji="📝" label="Notes"
                            value={emergency?.notes}
                        />
                    )}

                    {/* Emergency contacts */}
                    {visibleContacts.length > 0 && (
                        <View style={styles.contactsBlock}>
                            <Text style={styles.contactsLabel}>Emergency Contacts</Text>
                            {visibleContacts.map((c, i) => (
                                <View key={c.id ?? i} style={[
                                    styles.contactRow,
                                    i < visibleContacts.length - 1 && styles.contactRowBorder,
                                ]}>
                                    <View style={styles.contactAvatar}>
                                        <Text style={styles.contactAvatarText}>
                                            {c.name?.[0]?.toUpperCase() ?? '?'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.contactName}>{c.name}</Text>
                                        <Text style={styles.contactRel}>
                                            {c.relationship ?? 'Guardian'}
                                            {c.priority === 1 ? '  · Primary' : ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.callBtn}
                                        onPress={() => Linking.openURL(`tel:${c.phone}`)}
                                        activeOpacity={0.7}
                                    >
                                        <IconPhone color={colors.success} size={14} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

// ─── Visibility Selector ──────────────────────────────────────────────────────

function VisibilitySelector({ current, onChange }) {
    return (
        <View style={styles.visSelector}>
            {Object.entries(VISIBILITY_CONFIG).map(([key, cfg]) => {
                const active = current === key;
                return (
                    <TouchableOpacity
                        key={key}
                        style={[
                            styles.visOption,
                            active && { borderColor: cfg.color, backgroundColor: cfg.bg },
                        ]}
                        onPress={() => onChange(key)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.visOptionTop}>
                            <View style={[styles.visOptionIcon, { backgroundColor: `${cfg.color}15` }]}>
                                {cfg.icon}
                            </View>
                            {active && (
                                <View style={[styles.visCheckmark, { backgroundColor: cfg.color }]}>
                                    <IconCheck color={colors.white} size={10} />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.visOptionLabel, active && { color: cfg.color }]}>
                            {cfg.label}
                        </Text>
                        <Text style={styles.visOptionSub} numberOfLines={2}>
                            {cfg.sublabel}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Field Toggle Row ─────────────────────────────────────────────────────────

function FieldToggleRow({ field, visible, disabled, onToggle }) {
    return (
        <View style={[styles.fieldRow, disabled && styles.fieldRowDisabled]}>
            <Text style={styles.fieldEmoji}>{field.emoji}</Text>
            <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, disabled && { color: colors.textTertiary }]}>
                    {field.label}
                </Text>
                {disabled && (
                    <Text style={styles.fieldDisabledNote}>
                        Hidden by visibility setting
                    </Text>
                )}
            </View>
            <Switch
                value={visible && !disabled}
                onValueChange={onToggle}
                disabled={disabled}
                trackColor={{ false: colors.surface3, true: `${colors.success}60` }}
                thumbColor={visible && !disabled ? colors.success : colors.textTertiary}
            />
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EmergencyScreen() {
    useScreenSecurity()
    // ── Store access (fixed shape) ───────────────────────────────────
    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null
    );
    const patchStudent = useProfileStore((s) => s.patchStudent);

    const student = activeStudent;
    const emergency = activeStudent?.emergency ?? null;
    const contacts = activeStudent?.emergency?.contacts ?? [];
    const cardVisibility = activeStudent?.card_visibility ?? null;

    // ── Local state (uncommitted until Save is pressed) ──────────────
    const [visibility, setVisibility] = useState(
        cardVisibility?.visibility ?? 'PUBLIC'
    );
    const [hiddenFields, setHiddenFields] = useState(
        cardVisibility?.hidden_fields ?? []
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty =
        visibility !== (cardVisibility?.visibility ?? 'PUBLIC') ||
        JSON.stringify([...(hiddenFields ?? [])].sort()) !==
        JSON.stringify([...(cardVisibility?.hidden_fields ?? [])].sort());

    // ── Field toggle ─────────────────────────────────────────────────
    const toggleField = (key) => {
        setHiddenFields((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
        );
    };

    const isFieldDisabled = (field) => {
        if (visibility === 'HIDDEN') return true;
        if (visibility === 'MINIMAL' && !field.minimalAllowed) return true;
        return false;
    };

    // ── Save ─────────────────────────────────────────────────────────
    // TODO: add a dedicated PATCH /parent/student/:id/visibility endpoint
    // For now reuses patchStudent with a card_visibility payload
    // Your backend will need to handle card_visibility in the update
    const handleSave = async () => {
        if (!student?.id) return;
        setSaving(true);
        try {
            // Pass visibility settings — wire to your PATCH endpoint
            await patchStudent(student.id, {
                card_visibility: {
                    visibility,
                    hidden_fields: hiddenFields,
                },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Emergency Info</Text>
                        <Text style={styles.pageSubtitle}>
                            Control what first responders see when they scan the card
                        </Text>
                    </View>
                </Animated.View>

                {/* ── Scanner preview ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(400)}>
                    <Text style={styles.sectionLabel}>SCANNER PREVIEW</Text>
                    <Text style={styles.sectionDesc}>
                        This is exactly what a first responder sees when they scan {student?.first_name ? `${student.first_name}'s` : 'the'} card
                    </Text>
                    <ScannerPreview
                        student={student}
                        emergency={emergency}
                        contacts={contacts}
                        visibility={visibility}
                        hiddenFields={hiddenFields}
                    />
                </Animated.View>

                {/* ── Visibility selector ── */}
                <Animated.View entering={FadeInDown.delay(80).duration(400)}>
                    <Text style={styles.sectionLabel}>VISIBILITY LEVEL</Text>
                    <Text style={styles.sectionDesc}>
                        Choose how much information is shared when the card is scanned
                    </Text>
                    <VisibilitySelector current={visibility} onChange={setVisibility} />
                </Animated.View>

                {/* ── Field toggles (only shown for PUBLIC) ── */}
                {visibility !== 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(300)}>
                        <Text style={styles.sectionLabel}>FIELD VISIBILITY</Text>
                        <Text style={styles.sectionDesc}>
                            {visibility === 'MINIMAL'
                                ? 'In Minimal mode only blood group and contacts are shown — other fields are locked'
                                : 'Toggle individual fields on or off'}
                        </Text>
                        <View style={styles.fieldsCard}>
                            {ALL_FIELDS.map((field, i) => {
                                const disabled = isFieldDisabled(field);
                                const visible = !hiddenFields.includes(field.key);
                                return (
                                    <View key={field.key} style={[
                                        i < ALL_FIELDS.length - 1 && styles.fieldRowBorder
                                    ]}>
                                        <FieldToggleRow
                                            field={field}
                                            visible={visible}
                                            disabled={disabled}
                                            onToggle={() => !disabled && toggleField(field.key)}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </Animated.View>
                )}

                {/* ── HIDDEN mode warning ── */}
                {visibility === 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.hiddenWarning}>
                        <IconAlert color={colors.warning} size={16} />
                        <Text style={styles.hiddenWarningText}>
                            <Text style={{ fontWeight: '700' }}>Warning: </Text>
                            Hidden mode means first responders won't see any emergency info. Only use this if you have another way to share this information in an emergency.
                        </Text>
                    </Animated.View>
                )}

                {/* ── Save button ── */}
                {isDirty && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            activeOpacity={0.85}
                            disabled={saving}
                        >
                            <Text style={styles.saveBtnText}>
                                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* ── Safety note ── */}
                <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.safetyNote}>
                    <IconShield color={colors.success} size={14} />
                    <Text style={styles.safetyNoteText}>
                        We recommend keeping visibility set to <Text style={{ color: colors.success, fontWeight: '700' }}>Public</Text> — it gives first responders the best chance to help your child in an emergency.
                    </Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[12],
        gap: spacing[5],
    },

    // ── Header ────────────────────────────────────────────────────────
    header: {
        gap: spacing[0.5],
    },
    pageTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.bodySm,
        color: colors.textTertiary,
        marginTop: 2,
        lineHeight: 18,
    },

    // ── Section labels ─────────────────────────────────────────────────
    sectionLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[1],
    },
    sectionDesc: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginBottom: spacing[2.5],
        lineHeight: 16,
    },

    // ── Scanner preview card ───────────────────────────────────────────
    previewCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        borderBottomWidth: 1,
    },
    previewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        flex: 1,
    },
    previewIconWrap: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    previewScannerTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    previewScannerSub: {
        ...typography.labelXs,
        marginTop: 2,
    },
    previewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
        paddingHorizontal: spacing[2.5],
        paddingVertical: spacing[1.5],
        borderRadius: radius.chipFull,
        borderWidth: 1,
        flexShrink: 0,
    },
    previewBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    previewBadgeText: {
        ...typography.labelXs,
        fontWeight: '700',
        fontSize: 10,
    },
    previewRows: {
        paddingVertical: spacing[1],
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    previewRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    previewEmoji: {
        fontSize: 16,
        marginTop: 1,
        width: 22,
        textAlign: 'center',
    },
    previewLabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    previewValue: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
        marginTop: 2,
        lineHeight: 18,
    },

    // ── Hidden / empty notice ──────────────────────────────────────────
    hiddenNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[5],
    },
    hiddenNoticeTitle: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    hiddenNoticeText: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
        lineHeight: 16,
    },

    // ── Contacts inside preview ────────────────────────────────────────
    contactsBlock: {
        paddingTop: spacing[2],
    },
    contactsLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    contactRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    contactAvatar: {
        width: 34,
        height: 34,
        borderRadius: radius.md,
        backgroundColor: colors.primaryBg,
        borderWidth: 1,
        borderColor: 'rgba(232,52,42,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    contactAvatarText: {
        ...typography.labelMd,
        color: colors.primary,
        fontWeight: '800',
    },
    contactName: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    contactRel: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    callBtn: {
        width: 32,
        height: 32,
        backgroundColor: colors.successBg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Visibility selector ────────────────────────────────────────────
    visSelector: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    visOption: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: spacing[3],
        gap: spacing[1.5],
        position: 'relative',
    },
    visOptionTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    visOptionIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visCheckmark: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    visOptionLabel: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    visOptionSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
        lineHeight: 14,
    },

    // ── Field toggles ──────────────────────────────────────────────────
    fieldsCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    fieldRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    fieldRowDisabled: {
        opacity: 0.45,
    },
    fieldEmoji: {
        fontSize: 17,
        width: 24,
        textAlign: 'center',
    },
    fieldLabel: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    fieldDisabledNote: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    // ── Hidden warning ─────────────────────────────────────────────────
    hiddenWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2.5],
        backgroundColor: colors.warningBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
        padding: spacing[3.5],
    },
    hiddenWarningText: {
        ...typography.labelXs,
        color: colors.warning,
        flex: 1,
        lineHeight: 17,
    },

    // ── Save button ────────────────────────────────────────────────────
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        ...typography.btnMd,
        color: colors.white,
        fontWeight: '700',
    },

    // ── Safety note ────────────────────────────────────────────────────
    safetyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2.5],
        backgroundColor: colors.successBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        padding: spacing[3.5],
    },
    safetyNoteText: {
        ...typography.labelXs,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 17,
    },
});