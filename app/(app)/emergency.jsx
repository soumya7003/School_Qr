/**
 * app/(app)/emergency.jsx
 *
 * REFACTOR NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. SAVE BUG FIX — SaveBar is no longer inside the ScrollView. It is now a
 *    sticky footer rendered outside the scroll, always visible at the bottom of
 *    the screen the moment any setting changes. Users no longer need to scroll
 *    to the bottom to find the Save button.
 *
 * 2. THEME BUG FIX — PreviewDataRow was hardcoding `borderBottomColor: _T.bd`
 *    (the static dark token) instead of the live `C.bd` color value. This broke
 *    the separator on light theme. Removed the _T import entirely; all colors
 *    now flow through the `C` prop.
 *
 * 3. HEADER — Added a proper back chevron + title row so the screen has clear
 *    navigation context, matching the updates.jsx pattern.
 *
 * 4. VISIBILITY PILLS — Replaced the stacked list with a horizontal 3-segment
 *    pill selector at the top for faster scanning and one-tap switching. The
 *    detailed descriptions move to a collapsible info row below the selector.
 *
 * 5. SAVE ANIMATION — SaveBar no longer re-mounts on every dirty flip. It
 *    stays mounted after first appearance and uses opacity/translateY instead
 *    of entering/exiting to avoid the jarring remount animation.
 *
 * 6. FIELD TABLE — Added a per-field "What this shows" sublabel so users know
 *    exactly what data they're toggling without needing to remember the form.
 *
 * 7. PADDING — Added paddingBottom to ScrollView content to account for the
 *    sticky footer height so nothing is permanently obscured.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Animated,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AnimatedRN, {
    FadeIn,
    FadeInDown,
    Layout,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevLeft = ({ c, s = 20 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Visibility config ─────────────────────────────────────────────────────────
const VISIBILITY_CONFIG = {
    PUBLIC: { iconName: 'eye', tier: 0, fields: ['blood_group', 'allergies', 'conditions', 'medications', 'doctor_name', 'doctor_phone', 'notes', 'contacts'] },
    MINIMAL: { iconName: 'eye', tier: 1, fields: ['blood_group', 'contacts'] },
    HIDDEN: { iconName: 'eye-off', tier: 2, fields: [] },
};

const ALL_FIELD_KEYS = [
    { key: 'blood_group', labelKey: 'emergency.fieldBloodGroup', sublabel: 'e.g. A+, O−', categoryKey: 'emergency.categoryMedical', minimalAllowed: true },
    { key: 'allergies', labelKey: 'emergency.fieldAllergies', sublabel: 'Food, medication, environmental', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
    { key: 'conditions', labelKey: 'emergency.fieldConditions', sublabel: 'Asthma, diabetes, epilepsy…', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
    { key: 'medications', labelKey: 'emergency.fieldMedications', sublabel: 'Current prescriptions', categoryKey: 'emergency.categoryMedical', minimalAllowed: false },
    { key: 'doctor_name', labelKey: 'emergency.fieldDoctorName', sublabel: 'Family / consulting doctor', categoryKey: 'emergency.categoryPhysician', minimalAllowed: false },
    { key: 'doctor_phone', labelKey: 'emergency.fieldDoctorPhone', sublabel: 'Direct contact number', categoryKey: 'emergency.categoryPhysician', minimalAllowed: false },
    { key: 'notes', labelKey: 'emergency.fieldNotes', sublabel: 'Special instructions', categoryKey: 'emergency.categoryOther', minimalAllowed: false },
    { key: 'contacts', labelKey: 'emergency.fieldContacts', sublabel: 'Emergency call list', categoryKey: 'emergency.categoryContacts', minimalAllowed: true },
];

function isFieldVisible(fieldKey, visibility, hiddenFields = []) {
    if (visibility === 'HIDDEN') return false;
    if (visibility === 'MINIMAL') return VISIBILITY_CONFIG.MINIMAL.fields.includes(fieldKey) && !hiddenFields.includes(fieldKey);
    return !hiddenFields.includes(fieldKey);
}

// ── Preview data row ──────────────────────────────────────────────────────────
// FIX: borderBottomColor now uses C.bd (live theme) instead of the old hardcoded _T.bd
function PreviewDataRow({ icon, label, value, last, accent, C }) {
    if (!value) return null;
    return (
        <View style={[pr.row, !last && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
            <View style={[pr.icon, { backgroundColor: (accent ?? C.blue) + '18' }]}>
                <Feather name={icon} size={12} color={accent ?? C.blue} />
            </View>
            <View style={pr.body}>
                <Text style={[pr.label, { color: C.tx3 }]}>{label}</Text>
                <Text style={[pr.value, { color: C.tx }]}>{value}</Text>
            </View>
        </View>
    );
}
const pr = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingHorizontal: 16, paddingVertical: 10 },
    icon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    body: { flex: 1, gap: 2 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
    value: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
});

// ── Scanner preview card ──────────────────────────────────────────────────────
function ScannerPreview({ student, emergency, contacts, visibility, hiddenFields, C }) {
    const { t } = useTranslation();
    const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;
    const show = (key) => isFieldVisible(key, visibility, hiddenFields);

    const visibleContacts = show('contacts')
        ? (contacts ?? []).sort((a, b) => a.priority - b.priority)
        : [];

    const hasAnyData = visibility !== 'HIDDEN' && (
        (show('blood_group') && emergency?.blood_group) ||
        (show('allergies') && emergency?.allergies) ||
        (show('conditions') && emergency?.conditions) ||
        (show('medications') && emergency?.medications) ||
        (show('doctor_name') && emergency?.doctor_name) ||
        (show('notes') && emergency?.notes) ||
        visibleContacts.length > 0
    );

    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ') || t('updates.childTab');

    const visLabel = {
        PUBLIC: t('emergency.visPublicLabel'),
        MINIMAL: t('emergency.visMinimalLabel'),
        HIDDEN: t('emergency.visHiddenLabel'),
    }[visibility] ?? visibility;

    return (
        <View style={[pv.card, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            {/* Top bar */}
            <View style={[pv.topBar, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <View style={pv.topLeft}>
                    <View style={[pv.scanBadge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                        <View style={[pv.scanDot, { backgroundColor: C.primary }]} />
                        <Text style={[pv.scanTx, { color: C.primary }]}>{t('emergency.scannerViewLabel').toUpperCase()}</Text>
                    </View>
                    <Text style={[pv.caption, { color: C.tx3 }]}>{t('emergency.scannerViewCaption')}</Text>
                </View>
                <View style={[pv.visBadge, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
                    <Feather name={cfg.iconName} size={10} color={C.tx2} />
                    <Text style={[pv.visTx, { color: C.tx2 }]}>{visLabel}</Text>
                </View>
            </View>

            {/* Identity */}
            <View style={[pv.identity, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <View style={[pv.avatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                    <Text style={[pv.avatarTx, { color: C.primary }]}>
                        {[student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                    </Text>
                </View>
                <View style={pv.identityBody}>
                    <Text style={[pv.name, { color: C.tx }]}>{fullName}</Text>
                    <View style={pv.metaRow}>
                        {student?.class && (
                            <View style={[pv.metaChip, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
                                <Text style={[pv.metaChipTx, { color: C.tx3 }]}>
                                    {t('emergency.previewLabelClass')} {student.class}{student.section ? `-${student.section}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={[pv.emergencyPill, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                    <MaterialCommunityIcons name="medical-bag" size={11} color={C.primary} />
                    <Text style={[pv.emergencyTx, { color: C.primary }]}>{t('emergency.emergencyLabel')}</Text>
                </View>
            </View>

            {/* Data section */}
            {visibility === 'HIDDEN' ? (
                <View style={pv.blocked}>
                    <View style={[pv.blockedIcon, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Feather name="lock" size={18} color={C.red} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[pv.blockedTitle, { color: C.tx }]}>{t('emergency.hiddenTitle')}</Text>
                        <Text style={[pv.blockedSub, { color: C.tx3 }]}>{t('emergency.hiddenSub')}</Text>
                    </View>
                </View>
            ) : !hasAnyData ? (
                <View style={pv.blocked}>
                    <View style={[pv.blockedIcon, { backgroundColor: C.s4, borderColor: C.bd }]}>
                        <Feather name="alert-circle" size={18} color={C.tx3} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[pv.blockedTitle, { color: C.tx2 }]}>{t('emergency.noDataTitle')}</Text>
                        <Text style={[pv.blockedSub, { color: C.tx3 }]}>{t('emergency.noDataSub')}</Text>
                    </View>
                </View>
            ) : (
                <View>
                    {show('blood_group') && emergency?.blood_group && (
                        <View style={[pv.section, { borderBottomColor: C.bd }]}>
                            <Text style={[pv.sectionHead, { color: C.tx3 }]}>{t('emergency.previewMedicalHead').toUpperCase()}</Text>
                            <PreviewDataRow icon="droplet" label={t('emergency.previewLabelBloodGroup')} value={emergency.blood_group} accent={C.primary} C={C} />
                            {show('allergies') && <PreviewDataRow icon="alert-triangle" label={t('emergency.previewLabelAllergies')} value={emergency?.allergies} accent={C.amb} C={C} />}
                            {show('conditions') && <PreviewDataRow icon="activity" label={t('emergency.previewLabelConditions')} value={emergency?.conditions} accent={C.blue} C={C} />}
                            {show('medications') && <PreviewDataRow icon="package" label={t('emergency.previewLabelMedications')} value={emergency?.medications} accent={C.blue} C={C} last />}
                        </View>
                    )}
                    {show('doctor_name') && emergency?.doctor_name && (
                        <View style={[pv.section, { borderBottomColor: C.bd }]}>
                            <Text style={[pv.sectionHead, { color: C.tx3 }]}>{t('emergency.previewPhysicianHead').toUpperCase()}</Text>
                            <PreviewDataRow icon="user" label={t('emergency.previewLabelDoctor')} value={emergency.doctor_name} accent={C.blue} C={C} />
                            {show('doctor_phone') && <PreviewDataRow icon="phone" label={t('emergency.previewLabelDoctorPhone')} value={emergency?.doctor_phone} accent={C.ok} C={C} last />}
                        </View>
                    )}
                    {visibleContacts.length > 0 && (
                        <View style={[pv.section, { borderBottomColor: C.bd }]}>
                            <Text style={[pv.sectionHead, { color: C.tx3 }]}>{t('emergency.previewContactsHead').toUpperCase()}</Text>
                            {visibleContacts.map((c, i) => (
                                <View key={c.id ?? i} style={[pv.contact, i < visibleContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
                                    <View style={[pv.contactAv, { backgroundColor: i === 0 ? C.primaryBg : C.blueBg, borderColor: i === 0 ? C.primaryBd : C.blueBd }]}>
                                        <Text style={[pv.contactAvTx, { color: i === 0 ? C.primary : C.blue }]}>{c.name?.[0]?.toUpperCase() ?? '?'}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[pv.contactName, { color: C.tx }]}>{c.name}</Text>
                                        <Text style={[pv.contactRel, { color: C.tx3 }]}>
                                            {c.relationship ?? t('emergency.previewLabelGuardian')}
                                            {c.priority === 1 ? `  ·  ${t('emergency.previewLabelPrimary')}` : ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[pv.callBtn, { backgroundColor: C.okBg, borderColor: C.okBd }]}
                                        onPress={() => Linking.openURL(`tel:${c.phone}`)}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name="phone-call" size={13} color={C.ok} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Footer */}
            <View style={[pv.footer, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
                <MaterialCommunityIcons name="shield-check" size={11} color={C.tx3} />
                <Text style={[pv.footerTx, { color: C.tx3 }]}>{t('emergency.poweredBy')}</Text>
            </View>
        </View>
    );
}
const pv = StyleSheet.create({
    card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 }, android: { elevation: 8 } }) },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    topLeft: { gap: 3 },
    scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start' },
    scanDot: { width: 5, height: 5, borderRadius: 2.5 },
    scanTx: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    caption: { fontSize: 11, fontWeight: '500' },
    visBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    visTx: { fontSize: 11, fontWeight: '800' },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    avatar: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
    avatarTx: { fontSize: 17, fontWeight: '900' },
    identityBody: { flex: 1, gap: 5 },
    name: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    metaChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
    metaChipTx: { fontSize: 10.5, fontWeight: '600' },
    emergencyPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
    emergencyTx: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2 },
    section: { borderBottomWidth: 1 },
    sectionHead: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    contact: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    contactAv: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactAvTx: { fontSize: 13, fontWeight: '900' },
    contactName: { fontSize: 14, fontWeight: '700' },
    contactRel: { fontSize: 11.5, marginTop: 2 },
    callBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    blocked: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
    blockedIcon: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    blockedTitle: { fontSize: 14.5, fontWeight: '800' },
    blockedSub: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1 },
    footerTx: { fontSize: 10, fontWeight: '500' },
});

// ── Visibility selector (horizontal pill tabs) ────────────────────────────────
// Replaced the tall stacked list with a compact 3-segment horizontal pill so
// all options are visible at a glance with one-tap switching.
const VIS_OPTIONS = [
    { key: 'PUBLIC', labelKey: 'emergency.visPublicLabel', iconName: 'eye', detailKey: 'emergency.visPublicDetail' },
    { key: 'MINIMAL', labelKey: 'emergency.visMinimalLabel', iconName: 'eye', detailKey: 'emergency.visMinimalDetail' },
    { key: 'HIDDEN', labelKey: 'emergency.visHiddenLabel', iconName: 'eye-off', detailKey: 'emergency.visHiddenDetail' },
];

function getVisColor(key, C) {
    if (key === 'PUBLIC') return C.ok;
    if (key === 'MINIMAL') return C.amb;
    return C.red;
}

function VisibilitySelector({ current, onChange, C }) {
    const { t } = useTranslation();
    const currentMeta = VIS_OPTIONS.find((o) => o.key === current);
    const color = getVisColor(current, C);

    return (
        <View style={{ gap: 10 }}>
            {/* Pill tab row */}
            <View style={[vs.pillRow, { backgroundColor: C.s3, borderColor: C.bd }]}>
                {VIS_OPTIONS.map(({ key, labelKey, iconName }) => {
                    const active = current === key;
                    const c = getVisColor(key, C);
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[vs.pill, active && { backgroundColor: c + '18', borderColor: c + '40' }]}
                            onPress={() => onChange(key)}
                            activeOpacity={0.75}
                        >
                            <Feather name={iconName} size={13} color={active ? c : C.tx3} />
                            <Text style={[vs.pillTx, { color: active ? c : C.tx3 }, active && { fontWeight: '800' }]}>
                                {t(labelKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Detail card for active option */}
            <View style={[vs.detail, { backgroundColor: color + '0C', borderColor: color + '30' }]}>
                <View style={[vs.detailIconWrap, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                    <Feather name={currentMeta?.iconName ?? 'eye'} size={15} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[vs.detailTitle, { color }]}>{t(currentMeta?.labelKey ?? '')}</Text>
                    <Text style={[vs.detailBody, { color: C.tx2 }]}>{t(currentMeta?.detailKey ?? '')}</Text>
                </View>
            </View>
        </View>
    );
}
const vs = StyleSheet.create({
    pillRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
    pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
    pillTx: { fontSize: 12.5, fontWeight: '600' },
    detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
    detailIconWrap: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    detailTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.1, marginBottom: 3 },
    detailBody: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
});

// ── Field access table ────────────────────────────────────────────────────────
function FieldAccessTable({ visibility, hiddenFields, onToggle, C }) {
    const { t } = useTranslation();

    const isDisabled = (field) => {
        if (visibility === 'HIDDEN') return true;
        if (visibility === 'MINIMAL' && !field.minimalAllowed) return true;
        return false;
    };

    let lastCategory = null;

    return (
        <View style={[ft.table, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={[ft.tableHead, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                <Text style={[ft.tableHeadLbl, { color: C.tx3 }]}>FIELD</Text>
                <Text style={[ft.tableHeadLbl, { color: C.tx3 }]}>SHOW TO RESPONDERS</Text>
            </View>
            {ALL_FIELD_KEYS.map((field, i) => {
                const disabled = isDisabled(field);
                const visible = !hiddenFields.includes(field.key);
                const effective = visible && !disabled;
                const isLast = i === ALL_FIELD_KEYS.length - 1;
                const showCatHeader = field.categoryKey !== lastCategory;
                lastCategory = field.categoryKey;

                return (
                    <View key={field.key}>
                        {showCatHeader && i > 0 && (
                            <View style={[ft.catDivider, { borderBottomColor: C.bd }]}>
                                <Text style={[ft.catTx, { color: C.tx3 }]}>{t(field.categoryKey).toUpperCase()}</Text>
                                <View style={[ft.catLine, { backgroundColor: C.bd }]} />
                            </View>
                        )}
                        <View style={[
                            ft.row,
                            !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd },
                            disabled && ft.rowDim,
                        ]}>
                            {/* Status dot */}
                            <View style={[ft.dot, { backgroundColor: effective ? C.ok : disabled ? C.tx3 + '30' : C.tx3 + '50' }]} />
                            {/* Labels */}
                            <View style={{ flex: 1 }}>
                                <Text style={[ft.fieldLabel, { color: disabled ? C.tx3 : C.tx }]}>{t(field.labelKey)}</Text>
                                <Text style={[ft.fieldSub, { color: C.tx3 }]}>{field.sublabel}</Text>
                            </View>
                            {/* Locked tag in MINIMAL mode */}
                            {disabled && visibility !== 'HIDDEN' && (
                                <View style={[ft.lockedTag, { backgroundColor: C.s3, borderColor: C.bd }]}>
                                    <Feather name="lock" size={9} color={C.tx3} />
                                    <Text style={[ft.lockedTx, { color: C.tx3 }]}>{t('emergency.lockedMinimal')}</Text>
                                </View>
                            )}
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
const ft = StyleSheet.create({
    table: { borderRadius: 17, borderWidth: 1, overflow: 'hidden' },
    tableHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
    tableHeadLbl: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.0 },
    catDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8, borderBottomWidth: 1 },
    catTx: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
    catLine: { flex: 1, height: 1 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 10 },
    rowDim: { opacity: 0.4 },
    dot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
    fieldLabel: { fontSize: 14, fontWeight: '600' },
    fieldSub: { fontSize: 11, marginTop: 1, fontStyle: 'italic' },
    lockedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
    lockedTx: { fontSize: 9.5, fontWeight: '600' },
});

// ── Sticky save footer ────────────────────────────────────────────────────────
// FIX: This is now rendered *outside* the ScrollView as a fixed-position footer.
// Previously it lived inside the scroll and users couldn't find it after
// changing visibility at the top of the page.
function StickyFooter({ isDirty, saving, saved, onSave, C }) {
    const { t } = useTranslation();

    // Keep mounted but animate in/out so we avoid the remount flash
    const slideAnim = useRef(new Animated.Value(80)).current;
    const opacAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: isDirty ? 0 : 80,
                useNativeDriver: true,
                damping: 18,
                stiffness: 180,
            }),
            Animated.timing(opacAnim, {
                toValue: isDirty ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isDirty]);

    return (
        <Animated.View
            pointerEvents={isDirty ? 'auto' : 'none'}
            style={[sf.bar, { backgroundColor: C.s2, borderColor: C.bd2, transform: [{ translateY: slideAnim }], opacity: opacAnim }]}
        >
            <View style={sf.left}>
                <View style={[sf.dot, { backgroundColor: saving ? C.amb : C.primary }]} />
                <Text style={[sf.tx, { color: C.tx2 }]}>{t('emergency.unsavedChanges')}</Text>
            </View>
            <TouchableOpacity
                style={[sf.btn, { backgroundColor: saved ? C.ok : C.primary }, saving && { opacity: 0.6 }]}
                onPress={onSave}
                activeOpacity={0.85}
                disabled={saving}
            >
                {saved
                    ? <Feather name="check" size={14} color="#fff" />
                    : <Text style={sf.btnTx}>{saving ? t('emergency.saving') : t('emergency.save')}</Text>
                }
            </TouchableOpacity>
        </Animated.View>
    );
}
const sf = StyleSheet.create({
    bar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH, paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 34 : 18,
        borderTopWidth: 1,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 12 } }),
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 7, height: 7, borderRadius: 3.5 },
    tx: { fontSize: 13.5, fontWeight: '600' },
    btn: { borderRadius: 11, paddingHorizontal: 22, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minWidth: 80 },
    btnTx: { fontSize: 13.5, fontWeight: '800', color: '#fff' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function EmergencyScreen() {
    const { colors: C } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    useScreenSecurity();

    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null,
    );
    const patchStudent = useProfileStore((s) => s.patchStudent);

    const student = activeStudent;
    const emergency = activeStudent?.emergency ?? null;
    const contacts = activeStudent?.emergency?.contacts ?? [];
    const cardVis = activeStudent?.card_visibility ?? null;

    const [visibility, setVisibility] = useState(cardVis?.visibility ?? 'PUBLIC');
    const [hiddenFields, setHiddenFields] = useState(cardVis?.hidden_fields ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty =
        visibility !== (cardVis?.visibility ?? 'PUBLIC') ||
        JSON.stringify([...(hiddenFields ?? [])].sort()) !==
        JSON.stringify([...(cardVis?.hidden_fields ?? [])].sort());

    const toggleField = (key) =>
        setHiddenFields((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
        );

    const handleSave = async () => {
        if (!student?.id) return;
        setSaving(true);
        try {
            await patchStudent(student.id, { card_visibility: { visibility, hidden_fields: hiddenFields } });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch {
            Alert.alert(t('emergency.saveFailed'), t('emergency.saveFailedMsg'));
        } finally {
            setSaving(false);
        }
    };

    const visColor = getVisColor(visibility, C);

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            {/* ── Header ── */}
            <View style={[ms.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity style={ms.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <ChevLeft c={C.tx} s={20} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[ms.pageTitle, { color: C.tx }]}>{t('emergency.pageTitle')}</Text>
                    <Text style={[ms.pageSub, { color: C.tx3 }]}>
                        {student?.first_name
                            ? t('emergency.pageSub', { name: `${student.first_name}'s` })
                            : t('emergency.pageSubGeneric')}
                    </Text>
                </View>
                {/* Live visibility pill */}
                <View style={[ms.visPill, { backgroundColor: visColor + '12', borderColor: visColor + '35' }]}>
                    <View style={[ms.visDot, { backgroundColor: visColor }]} />
                    <Text style={[ms.visTx, { color: visColor }]}>
                        {{
                            PUBLIC: t('emergency.visPublicLabel'),
                            MINIMAL: t('emergency.visMinimalLabel'),
                            HIDDEN: t('emergency.visHiddenLabel'),
                        }[visibility]}
                    </Text>
                </View>
            </View>

            {/* ── Scrollable content ── */}
            {/*
        Extra paddingBottom (120) leaves room for the sticky footer.
        Without this, the Safety Note is permanently hidden behind the footer
        when isDirty is true.
      */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[ms.scroll, { paddingBottom: 120 }]}
            >
                {/* Scanner preview */}
                <AnimatedRN.View entering={FadeInDown.delay(0).duration(380)}>
                    <Text style={[ms.sectionHead, { color: C.tx3 }]}>
                        {t('emergency.sectionScannerPreview').toUpperCase()}
                    </Text>
                    <Text style={[ms.sectionDesc, { color: C.tx3 }]}>{t('emergency.sectionScannerDesc')}</Text>
                    <ScannerPreview
                        student={student}
                        emergency={emergency}
                        contacts={contacts}
                        visibility={visibility}
                        hiddenFields={hiddenFields}
                        C={C}
                    />
                </AnimatedRN.View>

                {/* Visibility selector */}
                <AnimatedRN.View entering={FadeInDown.delay(60).duration(380)}>
                    <Text style={[ms.sectionHead, { color: C.tx3 }]}>
                        {t('emergency.sectionAccessLevel').toUpperCase()}
                    </Text>
                    <Text style={[ms.sectionDesc, { color: C.tx3 }]}>{t('emergency.sectionAccessDesc')}</Text>
                    <VisibilitySelector current={visibility} onChange={setVisibility} C={C} />
                </AnimatedRN.View>

                {/* Field access */}
                {visibility !== 'HIDDEN' && (
                    <AnimatedRN.View entering={FadeIn.duration(320)} layout={Layout.duration(260)}>
                        <Text style={[ms.sectionHead, { color: C.tx3 }]}>
                            {t('emergency.sectionFieldAccess').toUpperCase()}
                        </Text>
                        <Text style={[ms.sectionDesc, { color: C.tx3 }]}>
                            {visibility === 'MINIMAL'
                                ? t('emergency.sectionFieldAccessDescMinimal')
                                : t('emergency.sectionFieldAccessDescPublic')}
                        </Text>
                        <FieldAccessTable
                            visibility={visibility}
                            hiddenFields={hiddenFields}
                            onToggle={toggleField}
                            C={C}
                        />
                    </AnimatedRN.View>
                )}

                {/* Hidden mode warning */}
                {visibility === 'HIDDEN' && (
                    <AnimatedRN.View
                        entering={FadeIn.duration(280)}
                        style={[ms.hiddenWarn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}
                    >
                        <View style={[ms.hiddenWarnIcon, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                            <Feather name="alert-triangle" size={15} color={C.amb} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[ms.hiddenWarnTitle, { color: C.amb }]}>{t('emergency.hiddenWarnTitle')}</Text>
                            <Text style={[ms.hiddenWarnBody, { color: C.amb }]}>{t('emergency.hiddenWarnBody')}</Text>
                        </View>
                    </AnimatedRN.View>
                )}

                {/* Safety note */}
                <AnimatedRN.View
                    entering={FadeInDown.delay(160).duration(380)}
                    style={[ms.safetyNote, { backgroundColor: C.okBg, borderColor: C.okBd }]}
                >
                    <View style={[ms.safetyIcon, { backgroundColor: C.okBg }]}>
                        <Feather name="shield" size={13} color={C.ok} />
                    </View>
                    <Text style={[ms.safetyTx, { color: C.tx2 }]}>{t('emergency.safetyNote')}</Text>
                </AnimatedRN.View>
            </ScrollView>

            {/*
        FIX: StickyFooter is rendered here — OUTSIDE the ScrollView — so it
        stays pinned at the bottom of the screen regardless of scroll position.
        The animated slide-up/down is handled inside StickyFooter via
        Animated.Value so it never remounts on dirty state changes.
      */}
            <StickyFooter
                isDirty={isDirty}
                saving={saving}
                saved={saved}
                onSave={handleSave}
                C={C}
            />
        </Screen>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.screenH, paddingTop: Platform.OS === 'ios' ? 10 : 16, paddingBottom: 14, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
    pageTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
    pageSub: { fontSize: 12, marginTop: 2, lineHeight: 17, fontWeight: '500' },
    visPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, flexShrink: 0 },
    visDot: { width: 5, height: 5, borderRadius: 2.5 },
    visTx: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
    scroll: { paddingHorizontal: spacing.screenH, paddingTop: 18, gap: 22 },
    sectionHead: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1, marginBottom: 2 },
    sectionDesc: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
    hiddenWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, borderRadius: 16, borderWidth: 1, padding: 16 },
    hiddenWarnIcon: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hiddenWarnTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    hiddenWarnBody: { fontSize: 13, opacity: 0.85, lineHeight: 18 },
    safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, borderWidth: 1, padding: 15 },
    safetyIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    safetyTx: { fontSize: 13, flex: 1, lineHeight: 19, fontWeight: '500', paddingTop: 4 },
});