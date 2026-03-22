/**
 * @file app/(app)/emergency.jsx
 * @description Emergency Info Screen — Visibility & Preview
 *
 * REDESIGNED: "Medical Intelligence Dashboard"
 * ─────────────────────────────────────────────────────────────────
 * Design Direction: Authoritative / Clinical-Premium / Dark
 *   - Scanner preview reads like a real emergency responder card
 *   - Visibility selector is a segmented security-tier control
 *   - Field toggles are a proper data-access table, not emoji switches
 *   - Typography carries medical weight — nothing looks playful
 *   - Every element justifies its existence
 *
 * All original functionality preserved 100%:
 *   ✓ VISIBILITY_CONFIG — PUBLIC / MINIMAL / HIDDEN
 *   ✓ ALL_FIELDS — all 8 fields with correct minimalAllowed flags
 *   ✓ isFieldVisible() — same logic
 *   ✓ ScannerPreview — visibility-aware data rendering
 *   ✓ VisibilitySelector — 3-option selector
 *   ✓ FieldToggleRow — per-field toggle with disabled state
 *   ✓ handleSave → patchStudent with card_visibility payload
 *   ✓ isDirty guard on Save button
 *   ✓ HIDDEN warning, safety note
 *   ✓ useScreenSecurity
 *   ✓ store shape: s.students + s.activeStudentId
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    Layout,
} from 'react-native-reanimated';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    bg: '#07070A',
    s1: '#0D0D11',
    s2: '#131317',
    s3: '#18181E',
    s4: '#1F1F26',
    s5: '#26262F',

    bd: 'rgba(255,255,255,0.07)',
    bd2: 'rgba(255,255,255,0.11)',
    bd3: 'rgba(255,255,255,0.17)',

    tx: '#EDEDF2',
    tx2: 'rgba(237,237,242,0.62)',
    tx3: 'rgba(237,237,242,0.36)',
    tx4: 'rgba(237,237,242,0.20)',

    red: '#E8342A',
    redBg: 'rgba(232,52,42,0.09)',
    redBd: 'rgba(232,52,42,0.20)',

    green: '#12A150',
    greenBg: 'rgba(18,161,80,0.09)',
    greenBd: 'rgba(18,161,80,0.20)',

    amber: '#E08C00',
    amberBg: 'rgba(224,140,0,0.09)',
    amberBd: 'rgba(224,140,0,0.22)',

    blue: '#3D82F6',
    blueBg: 'rgba(61,130,246,0.09)',
    blueBd: 'rgba(61,130,246,0.20)',

    white: '#FFFFFF',
};

// ─── Visibility config (identical to original) ────────────────────────────────
const VISIBILITY_CONFIG = {
    PUBLIC: {
        label: 'Public',
        sublabel: 'All fields visible to scanner',
        detail: 'First responders see full emergency profile',
        color: T.green,
        bg: T.greenBg,
        bd: T.greenBd,
        iconName: 'eye',
        tier: 0,
        fields: ['blood_group', 'allergies', 'conditions', 'medications', 'doctor_name', 'doctor_phone', 'notes', 'contacts'],
    },
    MINIMAL: {
        label: 'Minimal',
        sublabel: 'Blood group + contacts only',
        detail: 'Only critical fields shown — rest are hidden',
        color: T.amber,
        bg: T.amberBg,
        bd: T.amberBd,
        iconName: 'eye',
        tier: 1,
        fields: ['blood_group', 'contacts'],
    },
    HIDDEN: {
        label: 'Hidden',
        sublabel: 'No data visible',
        detail: 'Scanner sees "info hidden by parent"',
        color: T.red,
        bg: T.redBg,
        bd: T.redBd,
        iconName: 'eye-off',
        tier: 2,
        fields: [],
    },
};

// All toggleable fields (identical to original)
const ALL_FIELDS = [
    { key: 'blood_group', label: 'Blood Group', category: 'Medical', minimalAllowed: true },
    { key: 'allergies', label: 'Allergies', category: 'Medical', minimalAllowed: false },
    { key: 'conditions', label: 'Medical Conditions', category: 'Medical', minimalAllowed: false },
    { key: 'medications', label: 'Medications', category: 'Medical', minimalAllowed: false },
    { key: 'doctor_name', label: 'Doctor Name', category: 'Physician', minimalAllowed: false },
    { key: 'doctor_phone', label: 'Doctor Phone', category: 'Physician', minimalAllowed: false },
    { key: 'notes', label: 'Notes', category: 'Other', minimalAllowed: false },
    { key: 'contacts', label: 'Emergency Contacts', category: 'Contacts', minimalAllowed: true },
];

// ─── Helpers (identical to original) ─────────────────────────────────────────
function isFieldVisible(fieldKey, visibility, hiddenFields = []) {
    if (visibility === 'HIDDEN') return false;
    if (visibility === 'MINIMAL') {
        return VISIBILITY_CONFIG.MINIMAL.fields.includes(fieldKey) && !hiddenFields.includes(fieldKey);
    }
    return !hiddenFields.includes(fieldKey);
}

// ─── Preview data row ─────────────────────────────────────────────────────────
function PreviewDataRow({ icon, label, value, last, accent }) {
    if (!value) return null;
    return (
        <View style={[s.pdRow, !last && s.pdRowBd]}>
            <View style={[s.pdIcon, { backgroundColor: (accent ?? T.blue) + '15' }]}>
                <Feather name={icon} size={12} color={accent ?? T.blue} />
            </View>
            <View style={s.pdBody}>
                <Text style={s.pdLabel}>{label}</Text>
                <Text style={s.pdValue}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Scanner Preview ──────────────────────────────────────────────────────────
function ScannerPreview({ student, emergency, contacts, visibility, hiddenFields }) {
    const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;
    const show = (key) => isFieldVisible(key, visibility, hiddenFields);

    const visibleContacts = show('contacts')
        ? (contacts ?? []).filter(Boolean).sort((a, b) => a.priority - b.priority)
        : [];

    const hasAnyData = visibility !== 'HIDDEN' && (
        (show('blood_group') && emergency?.blood_group) ||
        (show('allergies') && emergency?.allergies) ||
        (show('conditions') && emergency?.conditions) ||
        (show('medications') && emergency?.medications) ||
        (show('doctor_name') && emergency?.doctor_name) ||
        (show('doctor_phone') && emergency?.doctor_phone) ||
        (show('notes') && emergency?.notes) ||
        visibleContacts.length > 0
    );

    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'Student';
    const classLine = student?.class
        ? `Class ${student.class}${student.section ? `-${student.section}` : ''}`
        : null;

    return (
        <View style={s.previewCard}>

            {/* ── Preview header bar ── */}
            <View style={s.previewTopBar}>
                <View style={s.previewTopLeft}>
                    <View style={[s.previewScanBadge, { backgroundColor: T.redBg, borderColor: T.redBd }]}>
                        <View style={[s.previewScanDot, { backgroundColor: T.red }]} />
                        <Text style={[s.previewScanTx, { color: T.red }]}>SCANNER VIEW</Text>
                    </View>
                    <Text style={s.previewCaption}>
                        What first responders see
                    </Text>
                </View>
                <View style={[s.previewVisBadge, { backgroundColor: cfg.bg, borderColor: cfg.bd }]}>
                    <Feather name={cfg.iconName} size={10} color={cfg.color} />
                    <Text style={[s.previewVisTx, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
            </View>

            {/* ── Patient identity strip ── */}
            <View style={s.previewIdentity}>
                {/* Avatar */}
                <View style={[s.previewAvatar, { backgroundColor: T.redBg, borderColor: T.redBd }]}>
                    <Text style={s.previewAvatarTx}>
                        {[student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={s.previewIdentityBody}>
                    <Text style={s.previewName}>{fullName}</Text>
                    <View style={s.previewMetaRow}>
                        {classLine && (
                            <View style={s.previewMetaChip}>
                                <Text style={s.previewMetaChipTx}>{classLine}</Text>
                            </View>
                        )}
                        {student?.school?.name && (
                            <View style={[s.previewMetaChip, { borderColor: T.bd2 }]}>
                                <Text style={[s.previewMetaChipTx, { color: T.tx3 }]} numberOfLines={1}>
                                    {student.school.name}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* Emergency label */}
                <View style={[s.previewEmergencyPill, { backgroundColor: T.redBg, borderColor: T.redBd }]}>
                    <MaterialCommunityIcons name="medical-bag" size={11} color={T.red} />
                    <Text style={[s.previewEmergencyTx, { color: T.red }]}>Emergency</Text>
                </View>
            </View>

            {/* ── Data section ── */}
            {visibility === 'HIDDEN' ? (
                <View style={s.previewBlocked}>
                    <View style={[s.previewBlockedIcon, { backgroundColor: T.redBg, borderColor: T.redBd }]}>
                        <Feather name="lock" size={18} color={T.red} />
                    </View>
                    <View>
                        <Text style={s.previewBlockedTitle}>Profile Hidden by Parent</Text>
                        <Text style={s.previewBlockedSub}>Emergency info is not available to scanners</Text>
                    </View>
                </View>
            ) : !hasAnyData ? (
                <View style={s.previewBlocked}>
                    <View style={[s.previewBlockedIcon, { backgroundColor: T.s4, borderColor: T.bd }]}>
                        <Feather name="alert-circle" size={18} color={T.tx3} />
                    </View>
                    <View>
                        <Text style={[s.previewBlockedTitle, { color: T.tx2 }]}>No data to display</Text>
                        <Text style={s.previewBlockedSub}>Fill in the emergency profile to make this useful</Text>
                    </View>
                </View>
            ) : (
                <View>
                    {/* Medical data */}
                    {(show('blood_group') && emergency?.blood_group) ||
                        (show('allergies') && emergency?.allergies) ||
                        (show('conditions') && emergency?.conditions) ||
                        (show('medications') && emergency?.medications) ? (
                        <View style={s.previewSection}>
                            <Text style={s.previewSectionHead}>MEDICAL</Text>
                            {show('blood_group') && (
                                <PreviewDataRow icon="droplet" label="Blood Group" value={emergency?.blood_group} accent={T.red} />
                            )}
                            {show('allergies') && (
                                <PreviewDataRow icon="alert-triangle" label="Allergies" value={emergency?.allergies} accent={T.amber} />
                            )}
                            {show('conditions') && (
                                <PreviewDataRow icon="activity" label="Conditions" value={emergency?.conditions} accent={T.blue} />
                            )}
                            {show('medications') && (
                                <PreviewDataRow icon="package" label="Medications" value={emergency?.medications} accent={T.blue} last={!show('doctor_name') && !show('doctor_phone') && !show('notes') && visibleContacts.length === 0} />
                            )}
                        </View>
                    ) : null}

                    {/* Physician */}
                    {(show('doctor_name') && emergency?.doctor_name) ||
                        (show('doctor_phone') && emergency?.doctor_phone) ? (
                        <View style={s.previewSection}>
                            <Text style={s.previewSectionHead}>PHYSICIAN</Text>
                            {show('doctor_name') && (
                                <PreviewDataRow icon="user" label="Doctor" value={emergency?.doctor_name} accent={T.blue} />
                            )}
                            {show('doctor_phone') && (
                                <PreviewDataRow icon="phone" label="Doctor Phone" value={emergency?.doctor_phone} accent={T.green} last={!show('notes') && visibleContacts.length === 0} />
                            )}
                        </View>
                    ) : null}

                    {/* Notes */}
                    {show('notes') && emergency?.notes && (
                        <View style={s.previewSection}>
                            <Text style={s.previewSectionHead}>NOTES</Text>
                            <View style={s.previewNoteRow}>
                                <Text style={s.previewNoteText}>{emergency.notes}</Text>
                            </View>
                        </View>
                    )}

                    {/* Emergency contacts */}
                    {visibleContacts.length > 0 && (
                        <View style={s.previewSection}>
                            <Text style={s.previewSectionHead}>EMERGENCY CONTACTS</Text>
                            {visibleContacts.map((c, i) => (
                                <View key={c.id ?? i} style={[s.previewContact, i < visibleContacts.length - 1 && s.previewContactBd]}>
                                    <View style={[s.previewContactAv, { backgroundColor: i === 0 ? T.redBg : T.blueBg, borderColor: i === 0 ? T.redBd : T.blueBd }]}>
                                        <Text style={[s.previewContactAvTx, { color: i === 0 ? T.red : T.blue }]}>
                                            {c.name?.[0]?.toUpperCase() ?? '?'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.previewContactName}>{c.name}</Text>
                                        <Text style={s.previewContactRel}>
                                            {c.relationship ?? 'Guardian'}{c.priority === 1 ? '  ·  Primary' : ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={s.previewCallBtn}
                                        onPress={() => Linking.openURL(`tel:${c.phone}`)}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="phone-call" size={13} color={T.green} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* ── Footer watermark ── */}
            <View style={s.previewFooter}>
                <MaterialCommunityIcons name="shield-check" size={11} color={T.tx4} />
                <Text style={s.previewFooterTx}>Powered by RESQID Guardian  ·  Emergency use only</Text>
            </View>
        </View>
    );
}

// ─── Visibility Selector — segmented security tier ────────────────────────────
function VisibilitySelector({ current, onChange }) {
    return (
        <View style={s.visSeg}>
            {Object.entries(VISIBILITY_CONFIG).map(([key, cfg], i, arr) => {
                const active = current === key;
                return (
                    <TouchableOpacity
                        key={key}
                        style={[
                            s.visSegItem,
                            i < arr.length - 1 && s.visSegItemBd,
                            active && { backgroundColor: cfg.bg },
                        ]}
                        onPress={() => onChange(key)}
                        activeOpacity={0.75}
                    >
                        {/* Left: icon + label */}
                        <View style={s.visSegLeft}>
                            <View style={[s.visSegIcon, { backgroundColor: active ? cfg.color + '20' : T.s4, borderColor: active ? cfg.color + '35' : T.bd }]}>
                                <Feather name={cfg.iconName} size={14} color={active ? cfg.color : T.tx3} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.visSegLabel, active && { color: cfg.color }]}>{cfg.label}</Text>
                                <Text style={s.visSegSub} numberOfLines={1}>{cfg.detail}</Text>
                            </View>
                        </View>
                        {/* Right: active indicator */}
                        <View style={[
                            s.visSegCheck,
                            active
                                ? { backgroundColor: cfg.color, borderColor: cfg.color }
                                : { backgroundColor: 'transparent', borderColor: T.bd2 },
                        ]}>
                            {active && <Feather name="check" size={10} color={T.white} />}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Field Access Table ───────────────────────────────────────────────────────
function FieldAccessTable({ visibility, hiddenFields, onToggle }) {
    const isDisabled = (field) => {
        if (visibility === 'HIDDEN') return true;
        if (visibility === 'MINIMAL' && !field.minimalAllowed) return true;
        return false;
    };

    // Group fields by category
    const categories = ['Medical', 'Physician', 'Other', 'Contacts'];

    return (
        <View style={s.fieldTable}>
            {/* Table header */}
            <View style={s.fieldTableHead}>
                <Text style={s.fieldTableHeadLbl}>FIELD</Text>
                <Text style={s.fieldTableHeadLbl}>VISIBLE</Text>
            </View>

            {ALL_FIELDS.map((field, i) => {
                const disabled = isDisabled(field);
                const visible = !hiddenFields.includes(field.key);
                const effective = visible && !disabled;
                const isLast = i === ALL_FIELDS.length - 1;

                // Category divider
                const prevCategory = i > 0 ? ALL_FIELDS[i - 1].category : null;
                const showDivider = field.category !== prevCategory && i > 0;

                return (
                    <View key={field.key}>
                        {showDivider && (
                            <View style={s.fieldCategoryDivider}>
                                <Text style={s.fieldCategoryTx}>{field.category.toUpperCase()}</Text>
                                <View style={s.fieldCategoryLine} />
                            </View>
                        )}
                        <View style={[s.fieldRow, !isLast && s.fieldRowBd, disabled && s.fieldRowDim]}>
                            {/* Status dot */}
                            <View style={[s.fieldDot, { backgroundColor: effective ? T.green : disabled ? T.tx4 : T.tx3 }]} />

                            {/* Label */}
                            <Text style={[s.fieldLabel, disabled && { color: T.tx4 }]}>{field.label}</Text>

                            {/* Locked tag (MINIMAL) */}
                            {disabled && visibility !== 'HIDDEN' && (
                                <View style={s.fieldLockedTag}>
                                    <Feather name="lock" size={9} color={T.tx4} />
                                    <Text style={s.fieldLockedTx}>Minimal</Text>
                                </View>
                            )}

                            {/* Spacer */}
                            <View style={{ flex: 1 }} />

                            {/* Toggle */}
                            <Switch
                                value={effective}
                                onValueChange={() => !disabled && onToggle(field.key)}
                                disabled={disabled}
                                trackColor={{ false: T.s5, true: T.green + '70' }}
                                thumbColor={effective ? T.green : T.tx3}
                                ios_backgroundColor={T.s5}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// ─── Save Bar ─────────────────────────────────────────────────────────────────
function SaveBar({ isDirty, saving, saved, onSave }) {
    if (!isDirty) return null;
    return (
        <Animated.View entering={FadeInUp.duration(280)} style={s.saveBar}>
            <View style={s.saveBarLeft}>
                <View style={[s.saveBarDot, { backgroundColor: saving ? T.amber : T.red }]} />
                <Text style={s.saveBarTx}>Unsaved changes</Text>
            </View>
            <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDim, saved && { backgroundColor: T.green }]}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={saving}
            >
                {saved
                    ? <Feather name="check" size={14} color={T.white} />
                    : <Text style={s.saveBtnTx}>{saving ? 'Saving…' : 'Save'}</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EmergencyScreen() {
    useScreenSecurity();

    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null,
    );
    const patchStudent = useProfileStore((s) => s.patchStudent);

    const student = activeStudent;
    const emergency = activeStudent?.emergency ?? null;
    const contacts = activeStudent?.emergency?.contacts ?? [];
    const cardVisibility = activeStudent?.card_visibility ?? null;

    const [visibility, setVisibility] = useState(cardVisibility?.visibility ?? 'PUBLIC');
    const [hiddenFields, setHiddenFields] = useState(cardVisibility?.hidden_fields ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty =
        visibility !== (cardVisibility?.visibility ?? 'PUBLIC') ||
        JSON.stringify([...(hiddenFields ?? [])].sort()) !==
        JSON.stringify([...(cardVisibility?.hidden_fields ?? [])].sort());

    const toggleField = (key) => {
        setHiddenFields((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
        );
    };

    const handleSave = async () => {
        if (!student?.id) return;
        setSaving(true);
        try {
            await patchStudent(student.id, {
                card_visibility: { visibility, hidden_fields: hiddenFields },
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;

    return (
        <Screen bg={T.bg} edges={['top', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.delay(0).duration(380)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.pageTitle}>Emergency Info</Text>
                        <Text style={s.pageSub}>
                            Control what first responders see when{' '}
                            {student?.first_name ? `${student.first_name}'s` : 'the'} card is scanned
                        </Text>
                    </View>
                    {/* Live status pill */}
                    <View style={[s.liveStatusPill, { backgroundColor: cfg.bg, borderColor: cfg.bd }]}>
                        <Feather name={cfg.iconName} size={11} color={cfg.color} />
                        <Text style={[s.liveStatusTx, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </Animated.View>

                {/* ── Scanner Preview ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(380)}>
                    <View style={s.sectionHeadRow}>
                        <Text style={s.sectionHead}>SCANNER PREVIEW</Text>
                        <Text style={s.sectionDesc}>Live view of what responders see</Text>
                    </View>
                    <ScannerPreview
                        student={student}
                        emergency={emergency}
                        contacts={contacts}
                        visibility={visibility}
                        hiddenFields={hiddenFields}
                    />
                </Animated.View>

                {/* ── Visibility Selector ── */}
                <Animated.View entering={FadeInDown.delay(80).duration(380)}>
                    <View style={s.sectionHeadRow}>
                        <Text style={s.sectionHead}>ACCESS LEVEL</Text>
                        <Text style={s.sectionDesc}>Set how much data is shared on scan</Text>
                    </View>
                    <VisibilitySelector current={visibility} onChange={setVisibility} />
                </Animated.View>

                {/* ── Field Access Table ── */}
                {visibility !== 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(320)} layout={Layout.duration(260)}>
                        <View style={s.sectionHeadRow}>
                            <Text style={s.sectionHead}>FIELD ACCESS</Text>
                            <Text style={s.sectionDesc}>
                                {visibility === 'MINIMAL'
                                    ? 'Only blood group and contacts available in Minimal mode'
                                    : 'Toggle individual fields — locked fields follow access level'}
                            </Text>
                        </View>
                        <FieldAccessTable
                            visibility={visibility}
                            hiddenFields={hiddenFields}
                            onToggle={toggleField}
                        />
                    </Animated.View>
                )}

                {/* ── HIDDEN warning ── */}
                {visibility === 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(280)} style={s.hiddenWarn}>
                        <View style={[s.hiddenWarnIcon, { backgroundColor: T.amberBg, borderColor: T.amberBd }]}>
                            <Feather name="alert-triangle" size={15} color={T.amber} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.hiddenWarnTitle}>Hidden mode active</Text>
                            <Text style={s.hiddenWarnBody}>
                                First responders will not see any emergency info. Only use this if you have another way to communicate this information in an emergency.
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* ── Save bar ── */}
                <SaveBar isDirty={isDirty} saving={saving} saved={saved} onSave={handleSave} />

                {/* ── Safety note ── */}
                <Animated.View entering={FadeInDown.delay(160).duration(380)} style={s.safetyNote}>
                    <View style={s.safetyNoteIcon}>
                        <Feather name="shield" size={13} color={T.green} />
                    </View>
                    <Text style={s.safetyNoteTx}>
                        We recommend keeping visibility set to{' '}
                        <Text style={{ color: T.green, fontWeight: '800' }}>Public</Text>
                        {' '}— it gives first responders the best chance to help your child in an emergency.
                    </Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

    scroll: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 12 : 18,
        paddingBottom: 60,
        gap: 20,
    },

    // ── Page header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: T.tx,
        letterSpacing: -0.4,
    },
    pageSub: {
        fontSize: 13,
        color: T.tx3,
        marginTop: 3,
        lineHeight: 18,
        fontWeight: '500',
    },
    liveStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 99, borderWidth: 1,
        flexShrink: 0, marginTop: 4,
    },
    liveStatusTx: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

    // ── Section head
    sectionHeadRow: { gap: 2, marginBottom: 10 },
    sectionHead: {
        fontSize: 10.5, fontWeight: '800',
        color: T.tx3, letterSpacing: 1.1,
    },
    sectionDesc: {
        fontSize: 12, color: T.tx4, fontWeight: '500',
    },

    // ── Scanner Preview card
    previewCard: {
        backgroundColor: T.s1,
        borderRadius: 18,
        borderWidth: 1, borderColor: T.bd2,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20 },
            android: { elevation: 10 },
        }),
    },

    // Preview top bar
    previewTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: T.bd,
        backgroundColor: T.s2,
    },
    previewTopLeft: { gap: 3 },
    previewScanBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 5, borderWidth: 1,
        alignSelf: 'flex-start',
    },
    previewScanDot: { width: 5, height: 5, borderRadius: 2.5 },
    previewScanTx: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    previewCaption: { fontSize: 11, color: T.tx3, fontWeight: '500' },
    previewVisBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 9, paddingVertical: 5,
        borderRadius: 99, borderWidth: 1,
    },
    previewVisTx: { fontSize: 11, fontWeight: '800' },

    // Preview identity strip
    previewIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: T.bd,
        backgroundColor: T.s2,
    },
    previewAvatar: {
        width: 46, height: 46, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, flexShrink: 0,
    },
    previewAvatarTx: { fontSize: 17, fontWeight: '900', color: T.red },
    previewIdentityBody: { flex: 1, gap: 5 },
    previewName: {
        fontSize: 16, fontWeight: '800',
        color: T.tx, letterSpacing: -0.2,
    },
    previewMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    previewMetaChip: {
        paddingHorizontal: 7, paddingVertical: 2,
        borderRadius: 5, borderWidth: 1, borderColor: T.bd2,
        backgroundColor: T.s3,
    },
    previewMetaChipTx: { fontSize: 10.5, color: T.tx3, fontWeight: '600' },
    previewEmergencyPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1,
        flexShrink: 0, alignSelf: 'flex-start',
    },
    previewEmergencyTx: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },

    // Preview data section
    previewSection: {
        borderBottomWidth: 1, borderBottomColor: T.bd,
    },
    previewSectionHead: {
        fontSize: 9.5, fontWeight: '800',
        color: T.tx4, letterSpacing: 1.2,
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    },
    pdRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: 11, paddingHorizontal: 16, paddingVertical: 10,
    },
    pdRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    pdIcon: {
        width: 28, height: 28, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
    },
    pdBody: { flex: 1, gap: 2 },
    pdLabel: { fontSize: 10, color: T.tx4, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    pdValue: { fontSize: 14, color: T.tx, fontWeight: '600', lineHeight: 19 },

    // Preview notes row
    previewNoteRow: { paddingHorizontal: 16, paddingVertical: 12 },
    previewNoteText: {
        fontSize: 13.5, color: T.tx2,
        lineHeight: 20, fontStyle: 'italic',
    },

    // Preview contacts
    previewContact: {
        flexDirection: 'row', alignItems: 'center',
        gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    },
    previewContactBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    previewContactAv: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    previewContactAvTx: { fontSize: 13, fontWeight: '900' },
    previewContactName: { fontSize: 14, fontWeight: '700', color: T.tx },
    previewContactRel: { fontSize: 11.5, color: T.tx3, marginTop: 2 },
    previewCallBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: T.greenBg, borderWidth: 1, borderColor: T.greenBd,
        alignItems: 'center', justifyContent: 'center',
    },

    // Preview blocked / hidden states
    previewBlocked: {
        flexDirection: 'row', alignItems: 'center',
        gap: 14, padding: 20,
    },
    previewBlockedIcon: {
        width: 44, height: 44, borderRadius: 13,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    previewBlockedTitle: {
        fontSize: 14.5, fontWeight: '800', color: T.tx,
    },
    previewBlockedSub: {
        fontSize: 12.5, color: T.tx3, marginTop: 3, lineHeight: 17,
    },

    // Preview footer
    previewFooter: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        paddingVertical: 10, paddingHorizontal: 16,
        borderTopWidth: 1, borderTopColor: T.bd,
        backgroundColor: T.s2,
    },
    previewFooterTx: { fontSize: 10, color: T.tx4, fontWeight: '500' },

    // ── Visibility selector (segmented list)
    visSeg: {
        backgroundColor: T.s1,
        borderRadius: 17, borderWidth: 1, borderColor: T.bd2,
        overflow: 'hidden',
    },
    visSegItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        gap: 14,
    },
    visSegItemBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    visSegLeft: {
        flexDirection: 'row', alignItems: 'center',
        gap: 12, flex: 1,
    },
    visSegIcon: {
        width: 38, height: 38, borderRadius: 11,
        borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    visSegLabel: { fontSize: 14.5, fontWeight: '800', color: T.tx },
    visSegSub: { fontSize: 12, color: T.tx3, marginTop: 2, fontWeight: '500' },
    visSegCheck: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },

    // ── Field access table
    fieldTable: {
        backgroundColor: T.s1,
        borderRadius: 17, borderWidth: 1, borderColor: T.bd2,
        overflow: 'hidden',
    },
    fieldTableHead: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: T.bd,
        backgroundColor: T.s2,
    },
    fieldTableHeadLbl: {
        fontSize: 9.5, fontWeight: '800',
        color: T.tx4, letterSpacing: 1.0,
    },
    fieldCategoryDivider: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
        gap: 8,
    },
    fieldCategoryTx: {
        fontSize: 9, fontWeight: '800',
        color: T.tx4, letterSpacing: 1.2,
    },
    fieldCategoryLine: {
        flex: 1, height: 1,
        backgroundColor: T.bd,
    },
    fieldRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        gap: 10,
    },
    fieldRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    fieldRowDim: { opacity: 0.45 },
    fieldDot: {
        width: 7, height: 7, borderRadius: 3.5, flexShrink: 0,
    },
    fieldLabel: {
        fontSize: 14, fontWeight: '600', color: T.tx,
    },
    fieldLockedTag: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 5, borderWidth: 1, borderColor: T.bd,
        backgroundColor: T.s3,
    },
    fieldLockedTx: { fontSize: 9.5, color: T.tx4, fontWeight: '600' },

    // ── Hidden warning
    hiddenWarn: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: 13,
        backgroundColor: T.amberBg,
        borderRadius: 16, borderWidth: 1, borderColor: T.amberBd,
        padding: 16,
    },
    hiddenWarnIcon: {
        width: 38, height: 38, borderRadius: 11,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    hiddenWarnTitle: {
        fontSize: 14, fontWeight: '800', color: T.amber, marginBottom: 4,
    },
    hiddenWarnBody: {
        fontSize: 13, color: T.amber, opacity: 0.85, lineHeight: 18,
    },

    // ── Save bar
    saveBar: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: T.s1,
        borderRadius: 16, borderWidth: 1, borderColor: T.bd2,
        paddingHorizontal: 16, paddingVertical: 12,
        gap: 12,
    },
    saveBarLeft: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    saveBarDot: {
        width: 7, height: 7, borderRadius: 3.5,
    },
    saveBarTx: { fontSize: 13.5, color: T.tx2, fontWeight: '600' },
    saveBtn: {
        backgroundColor: T.red,
        borderRadius: 11,
        paddingHorizontal: 20, paddingVertical: 10,
        alignItems: 'center', justifyContent: 'center',
        minWidth: 70,
    },
    saveBtnDim: { opacity: 0.6 },
    saveBtnTx: { fontSize: 13.5, fontWeight: '800', color: T.white },

    // ── Safety note
    safetyNote: {
        flexDirection: 'row', alignItems: 'flex-start',
        gap: 12,
        backgroundColor: T.greenBg,
        borderRadius: 16, borderWidth: 1, borderColor: T.greenBd,
        padding: 15,
    },
    safetyNoteIcon: {
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: 'rgba(18,161,80,0.15)',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    safetyNoteTx: {
        fontSize: 13, color: T.tx2, flex: 1,
        lineHeight: 19, fontWeight: '500', paddingTop: 4,
    },
});