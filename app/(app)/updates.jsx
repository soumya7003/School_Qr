/**
 * app/(app)/updates.jsx — fully i18n-wired
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, typography } from '@/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Animated, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckSvg = ({ c = '#fff', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevRight = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevLeft = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusSvg = ({ c = '#fff', s = 18 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);
const XSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const TrashSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);
const EditSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Unknown'];
const BLOOD_GROUP_TO_ENUM = {
  'A+': 'A_POS', 'A−': 'A_NEG', 'A-': 'A_NEG', 'B+': 'B_POS', 'B−': 'B_NEG', 'B-': 'B_NEG',
  'O+': 'O_POS', 'O−': 'O_NEG', 'O-': 'O_NEG', 'AB+': 'AB_POS', 'AB−': 'AB_NEG', 'AB-': 'AB_NEG',
  'Unknown': 'UNKNOWN', 'A_POS': 'A_POS', 'A_NEG': 'A_NEG', 'B_POS': 'B_POS', 'B_NEG': 'B_NEG',
  'O_POS': 'O_POS', 'O_NEG': 'O_NEG', 'AB_POS': 'AB_POS', 'AB_NEG': 'AB_NEG', 'UNKNOWN': 'UNKNOWN',
};
const BLOOD_GROUP_FROM_ENUM = {
  'A_POS': 'A+', 'A_NEG': 'A−', 'B_POS': 'B+', 'B_NEG': 'B−',
  'O_POS': 'O+', 'O_NEG': 'O−', 'AB_POS': 'AB+', 'AB_NEG': 'AB−', 'UNKNOWN': 'Unknown',
};
const PRIORITY_COLORS = ['#F97316', '#FBBF24', '#60A5FA', '#A78BFA', '#22C55E'];

// ── Step bar ──────────────────────────────────────────────────────────────────
function StepBar({ current, completed, C }) {
  const { t } = useTranslation();
  const STEPS = [
    { id: 0, label: t('updates_extra.stepStudent'), short: '01' },
    { id: 1, label: t('updates_extra.stepMedical'), short: '02' },
    { id: 2, label: t('updates_extra.stepContacts'), short: '03' },
    { id: 3, label: t('updates_extra.stepReview'), short: '04' },
  ];
  return (
    <View style={[sb.wrap, { backgroundColor: C.s2, borderBottomColor: C.bd }]}>
      {STEPS.map((step, i) => {
        const isActive = i === current;
        const isDone = completed.includes(i);
        return (
          <View key={step.id} style={sb.stepGroup}>
            {i > 0 && <View style={[sb.line, { backgroundColor: C.bd2 }, (isDone || isActive) && { backgroundColor: C.primary }]} />}
            <View style={[sb.circle, { borderColor: C.bd2, backgroundColor: C.s3 }, isActive && { borderColor: C.primary, backgroundColor: C.primaryBg }, isDone && { borderColor: C.okBd, backgroundColor: C.okBg }]}>
              {isDone ? <CheckSvg c="#22C55E" s={10} /> : <Text style={[sb.circleNum, { color: isActive ? C.primary : C.tx3 }]}>{step.short}</Text>}
            </View>
            <Text style={[sb.label, { color: isDone ? C.ok : isActive ? C.tx : C.tx3 }]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.screenH, paddingVertical: spacing[4], borderBottomWidth: 1, gap: 0 },
  stepGroup: { alignItems: 'center', flex: 1, position: 'relative' },
  line: { position: 'absolute', top: 13, right: '50%', left: '-50%', height: 1 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6, zIndex: 1 },
  circleNum: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
});

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, hint, required, C }) {
  const anim = useRef(new Animated.Value(0)).current;
  const animate = (to) => Animated.timing(anim, { toValue: to, duration: 160, useNativeDriver: false }).start();
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [C.bd2, C.primary] });
  return (
    <View style={fld.wrap}>
      <View style={fld.labelRow}>
        <Text style={[fld.label, { color: C.tx3 }]}>{label}</Text>
        {required && <View style={[fld.reqDot, { backgroundColor: C.primary }]} />}
      </View>
      <Animated.View style={[fld.box, { borderColor, backgroundColor: C.s2 }]}>
        <TextInput
          style={[fld.input, { color: C.tx }, multiline && fld.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.tx3}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType ?? 'default'}
          textAlignVertical={multiline ? 'top' : 'center'}
          selectionColor={C.primary}
          onFocus={() => animate(1)}
          onBlur={() => animate(0)}
        />
      </Animated.View>
      {hint && <Text style={[fld.hint, { color: C.tx3 }]}>{hint}</Text>}
    </View>
  );
}
const fld = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  reqDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  box: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 },
  input: { ...typography.bodyMd, height: 44, paddingVertical: 0, fontSize: 14.5 },
  inputMulti: { height: 84, paddingTop: 12, paddingBottom: 10, textAlignVertical: 'top' },
  hint: { fontSize: 11, fontStyle: 'italic' },
});

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, accent, C }) {
  const ac = accent ?? C.primary;
  return (
    <View style={[sc.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
      <View style={[sc.head, { borderLeftColor: ac, borderBottomColor: C.bd }]}>
        <View style={[sc.iconWrap, { backgroundColor: ac + '12', borderColor: ac + '30' }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[sc.title, { color: C.tx }]}>{title}</Text>
          {subtitle && <Text style={[sc.sub, { color: C.tx3 }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={sc.body}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderLeftWidth: 3 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontWeight: '700' },
  sub: { fontSize: 11, marginTop: 1 },
  body: { padding: 16, gap: 14 },
});

// ── Blood picker ──────────────────────────────────────────────────────────────
function BloodPicker({ value, onChange, C }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      <View style={bl.grid}>
        {BLOOD_GROUPS.map((bg) => {
          const sel = value === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[bl.chip, { borderColor: C.bd2, backgroundColor: C.s3 }, sel && { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]}
              onPress={() => onChange(bg)}
              activeOpacity={0.7}
            >
              <Text style={[bl.text, { color: sel ? C.primary : C.tx2 }]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!value && (
        <View style={[bl.warn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
          <Text style={[bl.warnText, { color: C.amb }]}>{t('updates_extra.bloodGroupWarn')}</Text>
        </View>
      )}
    </View>
  );
}
const bl = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, minWidth: 54, justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '700' },
  warn: { borderRadius: 8, borderWidth: 1, padding: 10 },
  warnText: { fontSize: 12, fontWeight: '600' },
});

// ── Contact card ──────────────────────────────────────────────────────────────
function ContactCard({ contact, index, onEdit, onDelete, C }) {
  const { t } = useTranslation();
  const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay: index * 55, useNativeDriver: true, tension: 85, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[ccc.card, { backgroundColor: C.s3, borderColor: C.bd, transform: [{ scale: scaleAnim }] }]}>
      <View style={[ccc.priority, { backgroundColor: pc + '18', borderColor: pc + '35' }]}>
        <Text style={[ccc.priorityNum, { color: pc }]}>{contact.priority}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={ccc.top}>
          <Text style={[ccc.name, { color: C.tx }]}>{contact.name}</Text>
          {contact.priority === 1 && (
            <View style={[ccc.firstTag, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
              <Text style={[ccc.firstTagText, { color: C.primary }]}>{t('updates_extra.firstCall')}</Text>
            </View>
          )}
        </View>
        <Text style={[ccc.meta, { color: C.tx3 }]}>{contact.relationship || t('home.guardian')} · {contact.phone}</Text>
      </View>
      <View style={ccc.actions}>
        <TouchableOpacity style={[ccc.btn, { backgroundColor: C.s4, borderColor: C.bd }]} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <EditSvg c={C.tx2} s={12} />
        </TouchableOpacity>
        <TouchableOpacity style={[ccc.btn, { backgroundColor: C.redBg, borderColor: C.redBd }]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <TrashSvg c={C.red} s={12} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const ccc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  priority: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  priorityNum: { fontSize: 13, fontWeight: '900' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 13.5, fontWeight: '700' },
  firstTag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  firstTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  meta: { fontSize: 11.5, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Contact modal ─────────────────────────────────────────────────────────────
function ContactModal({ visible, contact, onSave, onClose, C }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rel, setRel] = useState('');
  useEffect(() => {
    if (visible) { setName(contact?.name ?? ''); setPhone(contact?.phone ?? ''); setRel(contact?.relationship ?? ''); }
  }, [visible, contact]);
  const handleSave = () => {
    if (!name.trim() || !phone.trim()) { Alert.alert(t('updates_extra.contactRequiredAlert'), t('updates_extra.contactRequiredMsg')); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { Alert.alert(t('updates_extra.contactInvalidPhone'), t('updates_extra.contactInvalidPhoneMsg')); return; }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: rel.trim() });
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[cm.sheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={[cm.handle, { backgroundColor: C.s4 }]} />
            <View style={cm.sheetHead}>
              <View>
                <Text style={[cm.sheetTitle, { color: C.tx }]}>{contact?.id ? t('updates_extra.contactModalEditTitle') : t('updates_extra.contactModalAddTitle')}</Text>
                <Text style={[cm.sheetSub, { color: C.tx3 }]}>{t('updates_extra.contactModalSub')}</Text>
              </View>
              <TouchableOpacity style={[cm.closeBtn, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={onClose}>
                <XSvg c={C.tx3} s={14} />
              </TouchableOpacity>
            </View>
            <View style={cm.fields}>
              <Field label={t('updates_extra.fieldContactName')} value={name} onChangeText={setName} placeholder={t('updates_extra.fieldContactNamePlaceholder')} required C={C} />
              <Field label={t('updates_extra.fieldContactPhone')} value={phone} onChangeText={setPhone} placeholder={t('updates_extra.fieldContactPhonePlaceholder')} keyboardType="phone-pad" required C={C} />
              <Field label={t('updates_extra.fieldContactRel')} value={rel} onChangeText={setRel} placeholder={t('updates_extra.fieldContactRelPlaceholder')} C={C} />
            </View>
            <TouchableOpacity style={[cm.saveBtn, { backgroundColor: C.primary }]} onPress={handleSave} activeOpacity={0.85}>
              <CheckSvg c="#fff" s={14} />
              <Text style={cm.saveBtnText}>{contact?.id ? t('updates_extra.contactSaveEdit') : t('updates_extra.contactSaveAdd')}</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, padding: 20, paddingBottom: 36, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sheetSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15, marginTop: 4 },
  saveBtnText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});

// ── Review row ────────────────────────────────────────────────────────────────
function ReviewRow({ label, value, C }) {
  const empty = !value;
  return (
    <View style={[rv.row, { borderBottomColor: C.bd }]}>
      <Text style={[rv.label, { color: C.tx3 }]}>{label}</Text>
      <Text style={[rv.value, { color: empty ? C.tx3 : C.tx }, empty && rv.empty]}>{value || '—'}</Text>
    </View>
  );
}
const rv = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderBottomWidth: 1 },
  label: { fontSize: 12, flex: 1, fontWeight: '600' },
  value: { fontSize: 13, flex: 2, textAlign: 'right', fontWeight: '600' },
  empty: { fontStyle: 'italic', fontWeight: '400' },
});

// ── Nav footer ────────────────────────────────────────────────────────────────
function NavFooter({ step, onBack, onNext, nextLabel, saving, canProceed, C }) {
  const { t } = useTranslation();
  const isFirst = step === 0;
  return (
    <View style={[nf.bar, { backgroundColor: C.s2, borderTopColor: C.bd }]}>
      <TouchableOpacity style={[nf.backBtn, { borderColor: C.bd2, backgroundColor: C.s3 }, isFirst && { opacity: 0 }]} onPress={onBack} disabled={isFirst} activeOpacity={0.7}>
        <ChevLeft c={C.tx2} s={16} />
        <Text style={[nf.backText, { color: C.tx2 }]}>{t('updates_extra.back')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[nf.nextBtn, { backgroundColor: C.primary }, saving && { opacity: 0.6 }, !canProceed && { opacity: 0.4 }]}
        onPress={onNext}
        disabled={saving || !canProceed}
        activeOpacity={0.85}
      >
        <Text style={nf.nextText}>{saving ? t('updates_extra.saving') : nextLabel}</Text>
        {!saving && (nextLabel === t('updates_extra.next') ? <ChevRight c="#fff" s={15} /> : <Text style={{ fontSize: 14 }}>⚡</Text>)}
      </TouchableOpacity>
    </View>
  );
}
const nf = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenH, paddingTop: 14, paddingBottom: spacing[6], borderTopWidth: 1, gap: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
  backText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15 },
  nextText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UpdatesScreen() {
  const { colors: C } = useTheme();
  const { t } = useTranslation();
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const student = useProfileStore(
    useShallow((s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null)
  );
  const ep = student?.emergency ?? null;
  const rawContacts = useMemo(() => student?.emergency?.contacts ?? [], [student?.emergency?.contacts]);

  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(student?.first_name ?? '');
  const [lastName, setLastName] = useState(student?.last_name ?? '');
  const [cls, setCls] = useState(student?.class ?? '');
  const [section, setSection] = useState(student?.section ?? '');
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? '');
  const [allergies, setAllergies] = useState(ep?.allergies ?? '');
  const [conditions, setConditions] = useState(ep?.conditions ?? '');
  const [medications, setMedications] = useState(ep?.medications ?? '');
  const [doctorName, setDoctorName] = useState(ep?.doctor_name ?? '');
  const [doctorPhone, setDoctorPhone] = useState(ep?.doctor_phone ?? '');
  const [notes, setNotes] = useState(ep?.notes ?? '');
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditContact] = useState(null);

  useEffect(() => { setFirstName(student?.first_name ?? ''); setLastName(student?.last_name ?? ''); setCls(student?.class ?? ''); setSection(student?.section ?? ''); }, [student]);
  useEffect(() => { setBloodGroup(BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? ''); setAllergies(ep?.allergies ?? ''); setConditions(ep?.conditions ?? ''); setMedications(ep?.medications ?? ''); setDoctorName(ep?.doctor_name ?? ''); setDoctorPhone(ep?.doctor_phone ?? ''); setNotes(ep?.notes ?? ''); }, [ep]);
  useEffect(() => { setContacts(rawContacts ?? []); }, [rawContacts]);

  const scrollRef = useRef(null);
  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const canProceed = step === 0 ? firstName.trim().length > 0 && lastName.trim().length > 0 : true;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const transitionStep = (n) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setStep(n); slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert(t('updates_extra.requiredAlert'), t('updates_extra.requiredAlertMsg'));
      return;
    }
    if (step < 3) { setCompleted((p) => p.includes(step) ? p : [...p, step]); transitionStep(step + 1); scrollTop(); }
    else handleSubmitAll();
  };
  const goBack = () => { if (step > 0) { transitionStep(step - 1); scrollTop(); } };

  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      await patchStudent(student.id, {
        student: { first_name: firstName.trim(), last_name: lastName.trim(), class: cls.trim(), section: section.trim() },
        emergency: {
          blood_group: (BLOOD_GROUP_TO_ENUM[bloodGroup] ?? bloodGroup) || undefined,
          allergies: allergies.trim(), conditions: conditions.trim(),
          medications: medications.trim(), doctor_name: doctorName.trim(),
          ...(doctorPhone.trim() ? { doctor_phone: doctorPhone.trim().startsWith('+') ? doctorPhone.trim() : `+91${doctorPhone.trim().replace(/^0/, '')}` } : {}),
          notes: notes.trim(),
        },
        contacts: contacts.map((c, i) => ({
          ...(c.id && !c.id.startsWith('tmp_') ? { id: c.id } : {}),
          name: c.name,
          phone: c.phone?.startsWith('+') ? c.phone : `+91${c.phone?.replace(/^0/, '') ?? ''}`,
          relationship: c.relationship,
          priority: i + 1,
        })),
      });
      setCompleted([0, 1, 2, 3]);
      if (isNewUser) {
        await setIsNewUser(false);
        fetchAndPersist?.().catch(() => { });
      } else {
        Alert.alert(t('updates_extra.saveSuccess'), t('updates_extra.saveSuccessMsg'));
      }
    } catch {
      Alert.alert(t('updates_extra.saveError'), t('updates_extra.saveErrorMsg'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = (data) => {
    if (editingContact?.id) setContacts((p) => p.map((c) => c.id === editingContact.id ? { ...c, ...data } : c));
    else setContacts((p) => [...p, { id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...data, priority: p.length + 1, is_active: true }]);
  };
  const handleDeleteContact = (contact) => {
    Alert.alert(t('updates_extra.removeContact'), t('updates_extra.removeContactMsg', { name: contact.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => setContacts((p) => p.filter((c) => c.id !== contact.id).map((c, i) => ({ ...c, priority: i + 1 }))) },
    ]);
  };
  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  const nextLabel = step === 3
    ? (isNewUser ? t('updates_extra.activateCardBtn') : t('updates_extra.saveAll'))
    : t('updates_extra.next');

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ContactModal visible={modalVisible} contact={editingContact} onSave={handleSaveContact} onClose={() => setModalVisible(false)} C={C} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.bd }]}>
        <Text style={[s.headerTitle, { color: C.tx }]}>
          {isNewUser ? t('updates_extra.activateCard') : (student?.first_name ? t('updates.title', { name: student.first_name }) : t('updates_extra.updateProfile'))}
        </Text>
        {isNewUser && (
          <View style={[s.newBadge, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
            <View style={[s.newDot, { backgroundColor: C.ok }]} />
            <Text style={[s.newText, { color: C.ok }]}>{t('updates_extra.newBadge')}</Text>
          </View>
        )}
      </View>

      <StepBar current={step} completed={completed} C={C} />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Step 0 — Student */}
          {step === 0 && (
            <View style={s.stepContent}>
              {isNewUser && (
                <View style={[s.onboardBanner, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                  <Text style={{ fontSize: 15 }}>🛡️</Text>
                  <Text style={[s.onboardBannerText, { color: C.ok }]}>{t('updates_extra.onboardBanner')}</Text>
                </View>
              )}
              <SectionCard icon={<Text style={{ fontSize: 15 }}>👤</Text>} title={t('updates_extra.studentNameTitle')} subtitle={t('updates_extra.studentNameSub')} C={C}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldFirstName')} value={firstName} onChangeText={setFirstName} placeholder={t('updates_extra.fieldFirstNamePlaceholder')} required C={C} /></View>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldLastName')} value={lastName} onChangeText={setLastName} placeholder={t('updates_extra.fieldLastNamePlaceholder')} required C={C} /></View>
                </View>
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>🏫</Text>} title={t('updates_extra.classSectionTitle')} accent={C.blue} C={C}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldClass')} value={cls} onChangeText={setCls} placeholder={t('updates_extra.fieldClassPlaceholder')} C={C} /></View>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldSection')} value={section} onChangeText={setSection} placeholder={t('updates_extra.fieldSectionPlaceholder')} C={C} /></View>
                </View>
              </SectionCard>
              <View style={[s.note, { backgroundColor: C.s2, borderColor: C.bd }]}>
                <Text style={[s.noteText, { color: C.tx3 }]}>{t('updates_extra.requiredNote')}</Text>
              </View>
            </View>
          )}

          {/* Step 1 — Medical */}
          {step === 1 && (
            <View style={s.stepContent}>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>🩸</Text>} title={t('updates_extra.bloodGroupTitle')} subtitle={t('updates_extra.bloodGroupSub')} C={C}>
                <BloodPicker value={bloodGroup} onChange={setBloodGroup} C={C} />
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>⚠️</Text>} title={t('updates_extra.allergiesTitle')} subtitle={t('updates_extra.allergiesSub')} accent={C.amb} C={C}>
                <Field label={t('updates_extra.fieldAllergies')} value={allergies} onChangeText={setAllergies} placeholder={t('updates_extra.fieldAllergiesPlaceholder')} multiline hint={t('updates_extra.allergiesHint')} C={C} />
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>🫁</Text>} title={t('updates_extra.conditionsTitle')} accent={C.blue} C={C}>
                <Field label={t('updates_extra.fieldConditions')} value={conditions} onChangeText={setConditions} placeholder={t('updates_extra.fieldConditionsPlaceholder')} multiline C={C} />
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>💊</Text>} title={t('updates_extra.medicationsTitle')} accent={C.blue} C={C}>
                <Field label={t('updates_extra.fieldMedications')} value={medications} onChangeText={setMedications} placeholder={t('updates_extra.fieldMedicationsPlaceholder')} multiline C={C} />
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>👨‍⚕️</Text>} title={t('updates_extra.doctorTitle')} accent={C.ok} C={C}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldDoctorName')} value={doctorName} onChangeText={setDoctorName} placeholder={t('updates_extra.fieldDoctorNamePlaceholder')} C={C} /></View>
                  <View style={{ flex: 1 }}><Field label={t('updates_extra.fieldDoctorPhone')} value={doctorPhone} onChangeText={setDoctorPhone} placeholder={t('updates_extra.fieldDoctorPhone')} keyboardType="phone-pad" C={C} /></View>
                </View>
              </SectionCard>
              <SectionCard icon={<Text style={{ fontSize: 15 }}>📋</Text>} title={t('updates_extra.responderNotesTitle')} subtitle={t('updates_extra.responderNotesSub')} C={C}>
                <Field label={t('updates_extra.fieldNotes')} value={notes} onChangeText={setNotes} placeholder={t('updates_extra.fieldNotesPlaceholder')} multiline C={C} />
              </SectionCard>
            </View>
          )}

          {/* Step 2 — Contacts */}
          {step === 2 && (
            <View style={s.stepContent}>
              <View style={[s.callInfoBox, { backgroundColor: C.s2, borderColor: C.bd }]}>
                <Text style={[s.callInfoTitle, { color: C.tx }]}>{t('updates_extra.howCallsWork')}</Text>
                {[
                  { color: PRIORITY_COLORS[0], text: t('updates_extra.callInfo1') },
                  { color: PRIORITY_COLORS[1], text: t('updates_extra.callInfo2') },
                  { color: PRIORITY_COLORS[2], text: t('updates_extra.callInfo3') },
                ].map((item, i) => (
                  <View key={i} style={s.callInfoRow}>
                    <View style={[s.callInfoDot, { backgroundColor: item.color }]} />
                    <Text style={[s.callInfoText, { color: C.tx2 }]}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {sortedContacts.length === 0 ? (
                <View style={[s.emptyContacts, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={{ fontSize: 28 }}>📵</Text>
                  <Text style={[s.emptyTitle, { color: C.tx }]}>{t('updates_extra.noContactsTitle')}</Text>
                  <Text style={[s.emptySub, { color: C.tx3 }]}>{t('updates_extra.noContactsSub')}</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {sortedContacts.map((c, i) => (
                    <ContactCard key={c.id ?? `contact_${i}`} contact={c} index={i} onEdit={(con) => { setEditContact(con); setModalVisible(true); }} onDelete={handleDeleteContact} C={C} />
                  ))}
                </View>
              )}

              {contacts.length < 5 && (
                <TouchableOpacity style={[s.addBtn, { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]} onPress={() => { setEditContact(null); setModalVisible(true); }} activeOpacity={0.75}>
                  <View style={[s.addBtnIcon, { backgroundColor: C.primary }]}><PlusSvg c="#fff" s={18} /></View>
                  <View>
                    <Text style={[s.addBtnLabel, { color: C.primary }]}>{t('updates_extra.addContact')}</Text>
                    <Text style={[s.addBtnSub, { color: C.tx3 }]}>{t('updates_extra.contactsCount', { count: contacts.length })}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <View style={s.stepContent}>
              <View style={[s.reviewHeader, { backgroundColor: C.s2, borderColor: C.bd }]}>
                <View style={[s.reviewAvatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                  <Text style={[s.reviewAvatarText, { color: C.primary }]}>{firstName ? firstName[0].toUpperCase() : '?'}</Text>
                </View>
                <View>
                  <Text style={[s.reviewName, { color: C.tx }]}>{`${firstName} ${lastName}`.trim() || t('updates.title', { name: '' }).trim()}</Text>
                  <Text style={[s.reviewClass, { color: C.tx3 }]}>
                    {cls && section ? `Class ${cls}-${section}` : cls ? `Class ${cls}` : t('updates_extra.classNotSet')}
                  </Text>
                </View>
                <View style={[s.reviewStatus, { backgroundColor: completed.length >= 3 ? C.okBg : C.s3, borderColor: completed.length >= 3 ? C.okBd : C.bd }]}>
                  <View style={[s.reviewStatusDot, { backgroundColor: completed.length >= 3 ? C.ok : C.tx3 }]} />
                  <Text style={[s.reviewStatusText, { color: completed.length >= 3 ? C.ok : C.tx3 }]}>
                    {completed.length >= 3 ? t('updates_extra.statusReady') : t('updates_extra.statusDraft')}
                  </Text>
                </View>
              </View>

              <SectionCard icon={<Text style={{ fontSize: 15 }}>👤</Text>} title={t('updates_extra.reviewStudentTitle')} C={C}>
                <ReviewRow label={t('updates_extra.reviewFieldFirstName')} value={firstName} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldLastName')} value={lastName} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldClass')} value={cls} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldSection')} value={section} C={C} />
              </SectionCard>

              <SectionCard icon={<Text style={{ fontSize: 15 }}>❤️</Text>} title={t('updates_extra.reviewMedicalTitle')} C={C}>
                <ReviewRow label={t('updates_extra.reviewFieldBloodGroup')} value={bloodGroup} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldAllergies')} value={allergies} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldConditions')} value={conditions} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldMedications')} value={medications} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldDoctor')} value={doctorName} C={C} />
                <ReviewRow label={t('updates_extra.reviewFieldDoctorPhone')} value={doctorPhone} C={C} />
              </SectionCard>

              <SectionCard icon={<Text style={{ fontSize: 15 }}>📞</Text>} title={t('updates_extra.reviewContactsTitle', { count: contacts.length })} accent={C.blue} C={C}>
                {contacts.length === 0
                  ? <Text style={[s.noContacts, { color: C.tx3 }]}>{t('updates_extra.reviewNoContacts')}</Text>
                  : sortedContacts.map((c, i) => (
                    <ReviewRow
                      key={c.id ?? `review_${i}`}
                      label={t('updates_extra.reviewContactLabel', { priority: c.priority, relationship: c.relationship || t('home.guardian') })}
                      value={`${c.name} · ${c.phone}`}
                      C={C}
                    />
                  ))
                }
              </SectionCard>

              <View style={[s.note, { backgroundColor: C.okBg, borderColor: C.okBd, flexDirection: 'row', gap: 8 }]}>
                <Text style={{ fontSize: 14 }}>🛡️</Text>
                <Text style={[s.noteText, { color: C.ok, flex: 1 }]}>
                  {isNewUser ? t('updates_extra.reviewNoteNew') : t('updates_extra.reviewNoteEdit')}
                </Text>
              </View>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 16 }} />
      </ScrollView>

      <NavFooter step={step} onBack={goBack} onNext={goNext} nextLabel={nextLabel} saving={saving} canProceed={canProceed} C={C} />
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenH, paddingTop: spacing[5], paddingBottom: spacing[3], borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  newDot: { width: 5, height: 5, borderRadius: 3 },
  newText: { fontSize: 11, fontWeight: '700' },
  onboardBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  onboardBannerText: { fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '500' },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 18, gap: 14 },
  stepContent: { gap: 14 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  noteText: { fontSize: 11.5 },
  callInfoBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  callInfoTitle: { fontSize: 13, fontWeight: '700' },
  callInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  callInfoDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  callInfoText: { fontSize: 12.5, flex: 1 },
  emptyContacts: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed' },
  addBtnIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addBtnLabel: { fontSize: 14, fontWeight: '700' },
  addBtnSub: { fontSize: 11.5, marginTop: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 16 },
  reviewAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewAvatarText: { fontSize: 20, fontWeight: '900' },
  reviewName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  reviewClass: { fontSize: 12, marginTop: 2 },
  reviewStatus: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  reviewStatusDot: { width: 5, height: 5, borderRadius: 3 },
  reviewStatusText: { fontSize: 11, fontWeight: '700' },
  noContacts: { fontSize: 13, fontStyle: 'italic' },
});