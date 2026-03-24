/**
 * app/(app)/emergency.jsx
 * Emergency Info — visibility + field access control
 * All colors from useTheme().colors — the _T fallback is ONLY used in
 * StyleSheet.create() which runs once at module load before the provider
 * is available; all JSX uses the live C from useTheme().
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { useTheme } from '@/providers/ThemeProvider';
import { darkT as _T } from '@/theme/tokens';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert, Linking, Platform, ScrollView,
    StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

// ── Visibility config ─────────────────────────────────────────────────────────
const VISIBILITY_CONFIG = {
    PUBLIC: {
        label: 'Public', sublabel: 'All fields visible',
        detail: 'First responders see full emergency profile',
        iconName: 'eye', tier: 0,
        fields: ['blood_group', 'allergies', 'conditions', 'medications', 'doctor_name', 'doctor_phone', 'notes', 'contacts'],
    },
    MINIMAL: {
        label: 'Minimal', sublabel: 'Blood group + contacts only',
        detail: 'Only critical fields shown — rest are hidden',
        iconName: 'eye', tier: 1,
        fields: ['blood_group', 'contacts'],
    },
    HIDDEN: {
        label: 'Hidden', sublabel: 'No data visible',
        detail: 'Scanner sees "info hidden by parent"',
        iconName: 'eye-off', tier: 2,
        fields: [],
    },
};

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

function isFieldVisible(fieldKey, visibility, hiddenFields = []) {
    if (visibility === 'HIDDEN') return false;
    if (visibility === 'MINIMAL') return VISIBILITY_CONFIG.MINIMAL.fields.includes(fieldKey) && !hiddenFields.includes(fieldKey);
    return !hiddenFields.includes(fieldKey);
}

// ── Preview data row ──────────────────────────────────────────────────────────
function PreviewDataRow({ icon, label, value, last, accent, C }) {
    if (!value) return null;
    return (
        <View style={[s.pdRow, !last && s.pdRowBd]}>
            <View style={[s.pdIcon, { backgroundColor: (accent ?? C.blue) + '18' }]}>
                <Feather name={icon} size={12} color={accent ?? C.blue} />
            </View>
            <View style={s.pdBody}>
                <Text style={[s.pdLabel, { color: C.tx3 }]}>{label}</Text>
                <Text style={[s.pdValue, { color: C.tx }]}>{value}</Text>
            </View>
        </View>
    );
}

// ── Scanner preview ───────────────────────────────────────────────────────────
function ScannerPreview({ student, emergency, contacts, visibility, hiddenFields, C }) {
    const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;
    const show = (key) => isFieldVisible(key, visibility, hiddenFields);
    const visibleContacts = show('contacts') ? (contacts ?? []).sort((a, b) => a.priority - b.priority) : [];
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

    return (
        <View style={[s.previewCard, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            {/* Top bar */}
            <View style={[s.previewTopBar, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <View style={s.previewTopLeft}>
                    <View style={[s.previewScanBadge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                        <View style={[s.previewScanDot, { backgroundColor: C.primary }]} />
                        <Text style={[s.previewScanTx, { color: C.primary }]}>SCANNER VIEW</Text>
                    </View>
                    <Text style={[s.previewCaption, { color: C.tx3 }]}>What first responders see</Text>
                </View>
                <View style={[s.previewVisBadge, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
                    <Feather name={cfg.iconName} size={10} color={C.tx2} />
                    <Text style={[s.previewVisTx, { color: C.tx2 }]}>{cfg.label}</Text>
                </View>
            </View>

            {/* Patient identity */}
            <View style={[s.previewIdentity, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <View style={[s.previewAvatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                    <Text style={[s.previewAvatarTx, { color: C.primary }]}>
                        {[student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={s.previewIdentityBody}>
                    <Text style={[s.previewName, { color: C.tx }]}>{fullName}</Text>
                    <View style={s.previewMetaRow}>
                        {student?.class && (
                            <View style={[s.previewMetaChip, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
                                <Text style={[s.previewMetaChipTx, { color: C.tx3 }]}>Class {student.class}{student.section ? `-${student.section}` : ''}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={[s.previewEmergencyPill, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                    <MaterialCommunityIcons name="medical-bag" size={11} color={C.primary} />
                    <Text style={[s.previewEmergencyTx, { color: C.primary }]}>Emergency</Text>
                </View>
            </View>

            {/* Data */}
            {visibility === 'HIDDEN' ? (
                <View style={s.previewBlocked}>
                    <View style={[s.previewBlockedIcon, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Feather name="lock" size={18} color={C.red} />
                    </View>
                    <View>
                        <Text style={[s.previewBlockedTitle, { color: C.tx }]}>Profile Hidden by Parent</Text>
                        <Text style={[s.previewBlockedSub, { color: C.tx3 }]}>Emergency info is not available to scanners</Text>
                    </View>
                </View>
            ) : !hasAnyData ? (
                <View style={s.previewBlocked}>
                    <View style={[s.previewBlockedIcon, { backgroundColor: C.s4, borderColor: C.bd }]}>
                        <Feather name="alert-circle" size={18} color={C.tx3} />
                    </View>
                    <View>
                        <Text style={[s.previewBlockedTitle, { color: C.tx2 }]}>No data to display</Text>
                        <Text style={[s.previewBlockedSub, { color: C.tx3 }]}>Fill in the emergency profile to make this useful</Text>
                    </View>
                </View>
            ) : (
                <View>
                    {show('blood_group') && emergency?.blood_group && (
                        <View style={[s.previewSection, { borderBottomColor: C.bd }]}>
                            <Text style={[s.previewSectionHead, { color: C.tx3 }]}>MEDICAL</Text>
                            <PreviewDataRow icon="droplet" label="Blood Group" value={emergency.blood_group} accent={C.primary} C={C} />
                            {show('allergies') && <PreviewDataRow icon="alert-triangle" label="Allergies" value={emergency?.allergies} accent={C.amb} C={C} />}
                            {show('conditions') && <PreviewDataRow icon="activity" label="Conditions" value={emergency?.conditions} accent={C.blue} C={C} />}
                            {show('medications') && <PreviewDataRow icon="package" label="Medications" value={emergency?.medications} accent={C.blue} C={C} last />}
                        </View>
                    )}
                    {(show('doctor_name') && emergency?.doctor_name) && (
                        <View style={[s.previewSection, { borderBottomColor: C.bd }]}>
                            <Text style={[s.previewSectionHead, { color: C.tx3 }]}>PHYSICIAN</Text>
                            <PreviewDataRow icon="user" label="Doctor" value={emergency.doctor_name} accent={C.blue} C={C} />
                            {show('doctor_phone') && <PreviewDataRow icon="phone" label="Doctor Phone" value={emergency?.doctor_phone} accent={C.ok} C={C} last />}
                        </View>
                    )}
                    {visibleContacts.length > 0 && (
                        <View style={[s.previewSection, { borderBottomColor: C.bd }]}>
                            <Text style={[s.previewSectionHead, { color: C.tx3 }]}>EMERGENCY CONTACTS</Text>
                            {visibleContacts.map((c, i) => (
                                <View key={c.id ?? i} style={[s.previewContact, i < visibleContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
                                    <View style={[s.previewContactAv, { backgroundColor: i === 0 ? C.primaryBg : C.blueBg, borderColor: i === 0 ? C.primaryBd : C.blueBd }]}>
                                        <Text style={[s.previewContactAvTx, { color: i === 0 ? C.primary : C.blue }]}>{c.name?.[0]?.toUpperCase() ?? '?'}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.previewContactName, { color: C.tx }]}>{c.name}</Text>
                                        <Text style={[s.previewContactRel, { color: C.tx3 }]}>{c.relationship ?? 'Guardian'}{c.priority === 1 ? '  ·  Primary' : ''}</Text>
                                    </View>
                                    <TouchableOpacity style={[s.previewCallBtn, { backgroundColor: C.okBg, borderColor: C.okBd }]} onPress={() => Linking.openURL(`tel:${c.phone}`)} activeOpacity={0.7}>
                                        <Feather name="phone-call" size={13} color={C.ok} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Footer */}
            <View style={[s.previewFooter, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
                <MaterialCommunityIcons name="shield-check" size={11} color={C.tx3} />
                <Text style={[s.previewFooterTx, { color: C.tx3 }]}>Powered by RESQID Guardian  ·  Emergency use only</Text>
            </View>
        </View>
    );
}

// ── Visibility selector ───────────────────────────────────────────────────────
function VisibilitySelector({ current, onChange, C }) {
    const getColor = (key) => {
        if (key === 'PUBLIC') return C.ok;
        if (key === 'MINIMAL') return C.amb;
        return C.red;
    };
    return (
        <View style={[s.visSeg, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            {Object.entries(VISIBILITY_CONFIG).map(([key, cfg], i, arr) => {
                const active = current === key;
                const color = getColor(key);
                return (
                    <TouchableOpacity
                        key={key}
                        style={[s.visSegItem, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }, active && { backgroundColor: color + '10' }]}
                        onPress={() => onChange(key)}
                        activeOpacity={0.75}
                    >
                        <View style={s.visSegLeft}>
                            <View style={[s.visSegIcon, { backgroundColor: active ? color + '18' : C.s4, borderColor: active ? color + '35' : C.bd }]}>
                                <Feather name={cfg.iconName} size={14} color={active ? color : C.tx3} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.visSegLabel, { color: active ? color : C.tx }]}>{cfg.label}</Text>
                                <Text style={[s.visSegSub, { color: C.tx3 }]} numberOfLines={1}>{cfg.detail}</Text>
                            </View>
                        </View>
                        <View style={[s.visSegCheck, active ? { backgroundColor: color, borderColor: color } : { backgroundColor: 'transparent', borderColor: C.bd2 }]}>
                            {active && <Feather name="check" size={10} color={C.white} />}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ── Field access table ────────────────────────────────────────────────────────
function FieldAccessTable({ visibility, hiddenFields, onToggle, C }) {
    const isDisabled = (field) => {
        if (visibility === 'HIDDEN') return true;
        if (visibility === 'MINIMAL' && !field.minimalAllowed) return true;
        return false;
    };
    return (
        <View style={[s.fieldTable, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={[s.fieldTableHead, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <Text style={[s.fieldTableHeadLbl, { color: C.tx3 }]}>FIELD</Text>
                <Text style={[s.fieldTableHeadLbl, { color: C.tx3 }]}>VISIBLE</Text>
            </View>
            {ALL_FIELDS.map((field, i) => {
                const disabled = isDisabled(field);
                const visible = !hiddenFields.includes(field.key);
                const effective = visible && !disabled;
                const isLast = i === ALL_FIELDS.length - 1;
                const prevCat = i > 0 ? ALL_FIELDS[i - 1].category : null;
                const showDiv = field.category !== prevCat && i > 0;
                return (
                    <View key={field.key}>
                        {showDiv && (
                            <View style={[s.fieldCategoryDivider, { borderBottomColor: C.bd }]}>
                                <Text style={[s.fieldCategoryTx, { color: C.tx3 }]}>{field.category.toUpperCase()}</Text>
                                <View style={[s.fieldCategoryLine, { backgroundColor: C.bd }]} />
                            </View>
                        )}
                        <View style={[s.fieldRow, !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd }, disabled && s.fieldRowDim]}>
                            <View style={[s.fieldDot, { backgroundColor: effective ? C.ok : disabled ? C.tx3 + '40' : C.tx3 }]} />
                            <Text style={[s.fieldLabel, { color: disabled ? C.tx3 : C.tx }]}>{field.label}</Text>
                            {disabled && visibility !== 'HIDDEN' && (
                                <View style={[s.fieldLockedTag, { backgroundColor: C.s3, borderColor: C.bd }]}>
                                    <Feather name="lock" size={9} color={C.tx3} />
                                    <Text style={[s.fieldLockedTx, { color: C.tx3 }]}>Minimal</Text>
                                </View>
                            )}
                            <View style={{ flex: 1 }} />
                            <Switch
                                value={effective}
                                onValueChange={() => !disabled && onToggle(field.key)}
                                disabled={disabled}
                                trackColor={{ false: C.s5, true: C.primary + '70' }}
                                thumbColor={effective ? C.primary : C.tx3}
                                ios_backgroundColor={C.s5}
                            />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

// ── Save bar ──────────────────────────────────────────────────────────────────
function SaveBar({ isDirty, saving, saved, onSave, C }) {
    if (!isDirty) return null;
    return (
        <Animated.View entering={FadeInUp.duration(280)} style={[s.saveBar, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={s.saveBarLeft}>
                <View style={[s.saveBarDot, { backgroundColor: saving ? C.amb : C.primary }]} />
                <Text style={[s.saveBarTx, { color: C.tx2 }]}>Unsaved changes</Text>
            </View>
            <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: saved ? C.ok : C.primary }, saving && { opacity: 0.6 }]}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={saving}
            >
                {saved
                    ? <Feather name="check" size={14} color={C.white} />
                    : <Text style={[s.saveBtnTx, { color: C.white }]}>{saving ? 'Saving…' : 'Save'}</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EmergencyScreen() {
    const { colors: C } = useTheme();
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

    const toggleField = (key) =>
        setHiddenFields((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);

    const handleSave = async () => {
        if (!student?.id) return;
        setSaving(true);
        try {
            await patchStudent(student.id, { card_visibility: { visibility, hidden_fields: hiddenFields } });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(0).duration(380)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.pageTitle, { color: C.tx }]}>Emergency Info</Text>
                        <Text style={[s.pageSub, { color: C.tx3 }]}>
                            Control what first responders see when{' '}
                            {student?.first_name ? `${student.first_name}'s` : 'the'} card is scanned
                        </Text>
                    </View>
                    <View style={[s.liveStatusPill, { backgroundColor: C.s3, borderColor: C.bd }]}>
                        <Text style={[s.liveStatusTx, { color: C.tx2 }]}>{VISIBILITY_CONFIG[visibility]?.label}</Text>
                    </View>
                </Animated.View>

                {/* Scanner preview */}
                <Animated.View entering={FadeInDown.delay(40).duration(380)}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>SCANNER PREVIEW</Text>
                    <Text style={[s.sectionDesc, { color: C.tx3 }]}>Live view of what responders see</Text>
                    <ScannerPreview student={student} emergency={emergency} contacts={contacts} visibility={visibility} hiddenFields={hiddenFields} C={C} />
                </Animated.View>

                {/* Visibility selector */}
                <Animated.View entering={FadeInDown.delay(80).duration(380)}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>ACCESS LEVEL</Text>
                    <Text style={[s.sectionDesc, { color: C.tx3 }]}>Set how much data is shared on scan</Text>
                    <VisibilitySelector current={visibility} onChange={setVisibility} C={C} />
                </Animated.View>

                {/* Field access */}
                {visibility !== 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(320)} layout={Layout.duration(260)}>
                        <Text style={[s.sectionHead, { color: C.tx3 }]}>FIELD ACCESS</Text>
                        <Text style={[s.sectionDesc, { color: C.tx3 }]}>
                            {visibility === 'MINIMAL' ? 'Only blood group and contacts available in Minimal mode' : 'Toggle individual fields'}
                        </Text>
                        <FieldAccessTable visibility={visibility} hiddenFields={hiddenFields} onToggle={toggleField} C={C} />
                    </Animated.View>
                )}

                {/* Hidden warning */}
                {visibility === 'HIDDEN' && (
                    <Animated.View entering={FadeIn.duration(280)} style={[s.hiddenWarn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                        <View style={[s.hiddenWarnIcon, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                            <Feather name="alert-triangle" size={15} color={C.amb} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.hiddenWarnTitle, { color: C.amb }]}>Hidden mode active</Text>
                            <Text style={[s.hiddenWarnBody, { color: C.amb }]}>
                                First responders will not see any emergency info. Only use this if you have another way to communicate this information.
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* Save bar */}
                <SaveBar isDirty={isDirty} saving={saving} saved={saved} onSave={handleSave} C={C} />

                {/* Safety note */}
                <Animated.View entering={FadeInDown.delay(160).duration(380)} style={[s.safetyNote, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                    <View style={[s.safetyNoteIcon, { backgroundColor: C.okBg }]}>
                        <Feather name="shield" size={13} color={C.ok} />
                    </View>
                    <Text style={[s.safetyNoteTx, { color: C.tx2 }]}>
                        We recommend keeping visibility set to{' '}
                        <Text style={{ color: C.ok, fontWeight: '800' }}>Public</Text>
                        {' '}— it gives first responders the best chance to help your child.
                    </Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

const s = StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 12 : 18, paddingBottom: 60, gap: 20 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    pageTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
    pageSub: { fontSize: 13, marginTop: 3, lineHeight: 18, fontWeight: '500' },
    liveStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, flexShrink: 0, marginTop: 4 },
    liveStatusTx: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
    sectionHead: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1, marginBottom: 2 },
    sectionDesc: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
    previewCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 20 }, android: { elevation: 10 } }) },
    previewTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    previewTopLeft: { gap: 3 },
    previewScanBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start' },
    previewScanDot: { width: 5, height: 5, borderRadius: 2.5 },
    previewScanTx: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    previewCaption: { fontSize: 11, fontWeight: '500' },
    previewVisBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    previewVisTx: { fontSize: 11, fontWeight: '800' },
    previewIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    previewAvatar: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
    previewAvatarTx: { fontSize: 17, fontWeight: '900' },
    previewIdentityBody: { flex: 1, gap: 5 },
    previewName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    previewMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    previewMetaChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
    previewMetaChipTx: { fontSize: 10.5, fontWeight: '600' },
    previewEmergencyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
    previewEmergencyTx: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
    previewSection: { borderBottomWidth: 1 },
    previewSectionHead: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    pdRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingHorizontal: 16, paddingVertical: 10 },
    pdRowBd: { borderBottomWidth: 1, borderBottomColor: _T.bd },
    pdIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    pdBody: { flex: 1, gap: 2 },
    pdLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    pdValue: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
    previewContact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    previewContactAv: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    previewContactAvTx: { fontSize: 13, fontWeight: '900' },
    previewContactName: { fontSize: 14, fontWeight: '700' },
    previewContactRel: { fontSize: 11.5, marginTop: 2 },
    previewCallBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    previewBlocked: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
    previewBlockedIcon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    previewBlockedTitle: { fontSize: 14.5, fontWeight: '800' },
    previewBlockedSub: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
    previewFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1 },
    previewFooterTx: { fontSize: 10, fontWeight: '500' },
    visSeg: { borderRadius: 17, borderWidth: 1, overflow: 'hidden' },
    visSegItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    visSegLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    visSegIcon: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    visSegLabel: { fontSize: 14.5, fontWeight: '800' },
    visSegSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    visSegCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    fieldTable: { borderRadius: 17, borderWidth: 1, overflow: 'hidden' },
    fieldTableHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
    fieldTableHeadLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.0 },
    fieldCategoryDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 },
    fieldCategoryTx: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
    fieldCategoryLine: { flex: 1, height: 1 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    fieldRowDim: { opacity: 0.4 },
    fieldDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
    fieldLabel: { fontSize: 14, fontWeight: '600' },
    fieldLockedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
    fieldLockedTx: { fontSize: 9.5, fontWeight: '600' },
    hiddenWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, borderRadius: 16, borderWidth: 1, padding: 16 },
    hiddenWarnIcon: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hiddenWarnTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    hiddenWarnBody: { fontSize: 13, opacity: 0.85, lineHeight: 18 },
    saveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    saveBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    saveBarDot: { width: 7, height: 7, borderRadius: 3.5 },
    saveBarTx: { fontSize: 13.5, fontWeight: '600' },
    saveBtn: { borderRadius: 11, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
    saveBtnTx: { fontSize: 13.5, fontWeight: '800' },
    safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, borderWidth: 1, padding: 15 },
    safetyNoteIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    safetyNoteTx: { fontSize: 13, flex: 1, lineHeight: 19, fontWeight: '500', paddingTop: 4 },
});