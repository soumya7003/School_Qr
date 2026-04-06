/**
 * app/(app)/updates.jsx
 * FIXED: Keyboard handling + clear instructions for first-time users
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

// ── Icons (unchanged) ─────────────────────────────────────────────────────────
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

// ── Step Bar ──────────────────────────────────────────────────────────────────
function StepBar({ current, completed, C }) {
  const { t } = useTranslation();
  const STEPS = [
    { id: 0, label: t('updates.stepStudent'), short: '01' },
    { id: 1, label: t('updates.stepMedical'), short: '02' },
    { id: 2, label: t('updates.stepContacts'), short: '03' },
    { id: 3, label: t('updates.stepReview'), short: '04' },
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

// ── Field Component with better keyboard handling ─────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, hint, required, C }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.bd2, C.primary]
  });

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={fld.wrap}>
        <View style={fld.labelRow}>
          <Text style={[fld.label, { color: C.tx3 }]}>{label}</Text>
          {required && <View style={[fld.reqDot, { backgroundColor: C.primary }]} />}
        </View>
        <Animated.View style={[fld.box, { borderColor, backgroundColor: C.s2 }]}>
          <TextInput
            ref={inputRef}
            style={[fld.input, { color: C.tx }, multiline && fld.inputMulti]}
            value={value || ''}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.tx3}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            keyboardType={keyboardType ?? 'default'}
            textAlignVertical={multiline ? 'top' : 'center'}
            selectionColor={C.primary}
          />
        </Animated.View>
        {hint && <Text style={[fld.hint, { color: C.tx3 }]}>{hint}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}
const fld = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  reqDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  box: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 44 },
  input: { ...typography.bodyMd, height: 42, paddingVertical: 0, fontSize: 15, paddingHorizontal: 0 },
  inputMulti: { height: 80, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' },
  hint: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});

// ── Section Card ──────────────────────────────────────────────────────────────
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

// ── Blood Picker ──────────────────────────────────────────────────────────────
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
          <Text style={[bl.warnText, { color: C.amb }]}>{t('updates.bloodGroupWarn')}</Text>
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

// ── Contact Card ──────────────────────────────────────────────────────────────
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
              <Text style={[ccc.firstTagText, { color: C.primary }]}>{t('updates.firstCall')}</Text>
            </View>
          )}
        </View>
        <Text style={[ccc.meta, { color: C.tx3 }]}>{contact.relationship || t('updates.fieldContactRel')} · {contact.phone}</Text>
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

// ── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ visible, contact, onSave, onClose, C }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rel, setRel] = useState('');
  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? '');
      setPhone(contact?.phone ?? '');
      setRel(contact?.relationship ?? '');
    }
  }, [visible, contact]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(t('updates.contactRequiredAlert'), t('updates.contactRequiredMsg'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim()) && !phone.trim().startsWith('+')) {
      Alert.alert(t('updates.contactInvalidPhone'), t('updates.contactInvalidPhoneMsg'));
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: rel.trim() });
    onClose();
  };

  const isEditing = !!contact?.id;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[cm.sheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={[cm.handle, { backgroundColor: C.s4 }]} />
            <View style={cm.sheetHead}>
              <View>
                <Text style={[cm.sheetTitle, { color: C.tx }]}>
                  {isEditing ? t('updates.contactModalEditTitle') : t('updates.contactModalAddTitle')}
                </Text>
                <Text style={[cm.sheetSub, { color: C.tx3 }]}>{t('updates.contactModalSub')}</Text>
              </View>
              <TouchableOpacity style={[cm.closeBtn, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={onClose}>
                <XSvg c={C.tx3} s={14} />
              </TouchableOpacity>
            </View>
            <View style={cm.fields}>
              <Field
                label={t('updates.fieldContactName')}
                value={name}
                onChangeText={setName}
                placeholder={t('updates.fieldContactNamePlaceholder')}
                required
                C={C}
              />
              <Field
                label={t('updates.fieldContactPhone')}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('updates.fieldContactPhonePlaceholder')}
                keyboardType="phone-pad"
                required
                C={C}
              />
              <Field
                label={t('updates.fieldContactRel')}
                value={rel}
                onChangeText={setRel}
                placeholder={t('updates.fieldContactRelPlaceholder')}
                C={C}
              />
            </View>
            <TouchableOpacity style={[cm.saveBtn, { backgroundColor: C.primary }]} onPress={handleSave} activeOpacity={0.85}>
              <CheckSvg c="#fff" s={14} />
              <Text style={cm.saveBtnText}>
                {isEditing ? t('updates.contactSaveEdit') : t('updates.contactSaveAdd')}
              </Text>
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

// ── Review Row ────────────────────────────────────────────────────────────────
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

// ── Nav Footer ────────────────────────────────────────────────────────────────
function NavFooter({ step, onBack, onNext, nextLabel, saving, canProceed, C }) {
  const { t } = useTranslation();
  const isFirst = step === 0;
  return (
    <View style={[nf.bar, { backgroundColor: C.s2, borderTopColor: C.bd }]}>
      <TouchableOpacity
        style={[nf.backBtn, { borderColor: C.bd2, backgroundColor: C.s3 }, isFirst && { opacity: 0 }]}
        onPress={onBack}
        disabled={isFirst}
        activeOpacity={0.7}
      >
        <ChevLeft c={C.tx2} s={16} />
        <Text style={[nf.backText, { color: C.tx2 }]}>{t('updates.back')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[nf.nextBtn, { backgroundColor: C.primary }, saving && { opacity: 0.6 }, !canProceed && { opacity: 0.4 }]}
        onPress={onNext}
        disabled={saving || !canProceed}
        activeOpacity={0.85}
      >
        <Text style={nf.nextText}>
          {saving ? t('updates.saving') : nextLabel}
        </Text>
        {!saving && (nextLabel === t('updates.next')
          ? <ChevRight c="#fff" s={15} />
          : <Text style={{ fontSize: 14 }}>⚡</Text>
        )}
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

// ── Instruction Banner for First-Time Users ───────────────────────────────────
function InstructionBanner({ currentStep, C }) {
  const { t } = useTranslation();

  const instructions = {
    0: { title: "📝 Add Student Details", message: "Enter your child's name and class information. This helps first responders identify them quickly." },
    1: { title: "🏥 Medical Information", message: "Add blood group, allergies, and medications. This could save your child's life in an emergency." },
    2: { title: "📞 Emergency Contacts", message: "Add at least 2 trusted contacts who will be called if your child's card is scanned." },
    3: { title: "✅ Review & Activate", message: "Review all information before activating your child's RESQID card." },
  };

  const current = instructions[currentStep] || instructions[0];

  return (
    <View style={[ib.wrap, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
      <Text style={[ib.title, { color: C.blue }]}>{current.title}</Text>
      <Text style={[ib.message, { color: C.tx2 }]}>{current.message}</Text>
    </View>
  );
}

const ib = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 6 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  message: { fontSize: 12, lineHeight: 18 },
});

// ── Progress Indicator ────────────────────────────────────────────────────────
function ProgressIndicator({ currentStep, totalSteps = 4, C }) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  return (
    <View style={[pi.wrap, { backgroundColor: C.s3, borderColor: C.bd }]}>
      <View style={[pi.bar, { width: `${progress}%`, backgroundColor: C.primary }]} />
      <Text style={[pi.text, { color: C.tx3 }]}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}

const pi = StyleSheet.create({
  wrap: { height: 32, borderRadius: 16, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 16 },
  text: { fontSize: 11, fontWeight: '600', zIndex: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function UpdatesScreen() {
  const { colors: C } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const student = useProfileStore(
    useShallow((s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null)
  );
  const ep = student?.emergency ?? null;
  const rawContacts = useMemo(
    () => student?.emergency?.contacts ?? [],
    [student?.emergency?.contacts]
  );

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

  const scrollRef = useRef(null);

  // Scroll to top when step changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  useEffect(() => {
    setFirstName(student?.first_name ?? '');
    setLastName(student?.last_name ?? '');
    setCls(student?.class ?? '');
    setSection(student?.section ?? '');
  }, [student]);

  useEffect(() => {
    setBloodGroup(BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? '');
    setAllergies(ep?.allergies ?? '');
    setConditions(ep?.conditions ?? '');
    setMedications(ep?.medications ?? '');
    setDoctorName(ep?.doctor_name ?? '');
    setDoctorPhone(ep?.doctor_phone ?? '');
    setNotes(ep?.notes ?? '');
  }, [ep]);

  useEffect(() => { setContacts(rawContacts ?? []); }, [rawContacts]);

  const canProceed = step === 0
    ? firstName.trim().length > 0 && lastName.trim().length > 0
    : true;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transitionStep = (n) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setStep(n);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Missing Information', 'Please enter your child\'s first and last name.');
      return;
    }
    if (step < 3) {
      setCompleted((p) => p.includes(step) ? p : [...p, step]);
      transitionStep(step + 1);
    } else {
      handleSubmitAll();
    }
  };

  const goBack = () => {
    if (step > 0) { transitionStep(step - 1); }
  };

  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      await patchStudent(student.id, {
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class: cls.trim(),
          section: section.trim(),
        },
        emergency: {
          blood_group: (BLOOD_GROUP_TO_ENUM[bloodGroup] ?? bloodGroup) || undefined,
          allergies: allergies.trim(),
          conditions: conditions.trim(),
          medications: medications.trim(),
          doctor_name: doctorName.trim(),
          ...(doctorPhone.trim()
            ? { doctor_phone: doctorPhone.trim().startsWith('+') ? doctorPhone.trim() : `+91${doctorPhone.trim().replace(/^0/, '')}` }
            : {}),
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
        // AuthProvider will redirect to home
      } else {
        Alert.alert('Profile Updated', 'Your child\'s information has been saved.');
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Save Failed', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      setContacts((p) => p.map((c) => c.id === editingContact.id ? { ...c, ...data } : c));
    } else {
      setContacts((p) => [
        ...p,
        { id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...data, priority: p.length + 1, is_active: true },
      ]);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            setContacts((p) =>
              p.filter((c) => c.id !== contact.id).map((c, i) => ({ ...c, priority: i + 1 }))
            ),
        },
      ]
    );
  };

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  const nextLabel = step === 3
    ? (isNewUser ? 'Activate Card' : 'Save Changes')
    : 'Continue';

  const headerTitle = isNewUser
    ? 'Complete Your Profile'
    : student?.first_name
      ? `Edit ${student.first_name}'s Profile`
      : 'Edit Profile';

  const classLabel = cls && section
    ? `${cls} · ${section}`
    : cls
      ? cls
      : 'Not set';

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ContactModal
        visible={modalVisible}
        contact={editingContact}
        onSave={handleSaveContact}
        onClose={() => setModalVisible(false)}
        C={C}
      />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: C.bd }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevLeft c={C.tx} s={20} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.tx }]}>{headerTitle}</Text>
        {isNewUser && (
          <View style={[s.newBadge, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
            <View style={[s.newDot, { backgroundColor: C.ok }]} />
            <Text style={[s.newText, { color: C.ok }]}>New</Text>
          </View>
        )}
      </View>

      {/* Progress Indicator (for new users) */}
      {isNewUser && <ProgressIndicator currentStep={step} C={C} />}

      {/* Step Bar */}
      <StepBar current={step} completed={completed} C={C} />

      {/* Instruction Banner */}
      {isNewUser && <InstructionBanner currentStep={step} C={C} />}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Step 0 — Student */}
            {step === 0 && (
              <View style={s.stepContent}>
                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>👤</Text>}
                  title="Child's Name"
                  subtitle="Required — as on school records"
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="e.g., Arjun"
                        required
                        C={C}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="e.g., Sharma"
                        required
                        C={C}
                      />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>🏫</Text>}
                  title="Class & Section"
                  subtitle="Optional — helps identify your child"
                  accent={C.blue}
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Class"
                        value={cls}
                        onChangeText={setCls}
                        placeholder="e.g., 6"
                        C={C}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Section"
                        value={section}
                        onChangeText={setSection}
                        placeholder="e.g., B"
                        C={C}
                      />
                    </View>
                  </View>
                </SectionCard>

                <View style={[s.note, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={{ fontSize: 12 }}>📌</Text>
                  <Text style={[s.noteText, { color: C.tx3 }]}>First and last name are required to proceed.</Text>
                </View>
              </View>
            )}

            {/* Step 1 — Medical */}
            {step === 1 && (
              <View style={s.stepContent}>
                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>🩸</Text>}
                  title="Blood Group"
                  subtitle="Critical for emergency response"
                  C={C}
                >
                  <BloodPicker value={bloodGroup} onChange={setBloodGroup} C={C} />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>⚠️</Text>}
                  title="Allergies"
                  subtitle="Any known allergies (medication, food, etc.)"
                  accent={C.amb}
                  C={C}
                >
                  <Field
                    label="Allergies"
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="e.g., Peanuts, Penicillin"
                    multiline
                    hint="List any allergies that responders should know"
                    C={C}
                  />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>🫁</Text>}
                  title="Medical Conditions"
                  accent={C.blue}
                  C={C}
                >
                  <Field
                    label="Conditions"
                    value={conditions}
                    onChangeText={setConditions}
                    placeholder="e.g., Asthma, Diabetes"
                    multiline
                    C={C}
                  />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>💊</Text>}
                  title="Medications"
                  accent={C.blue}
                  C={C}
                >
                  <Field
                    label="Medications"
                    value={medications}
                    onChangeText={setMedications}
                    placeholder="e.g., Inhaler, Insulin"
                    multiline
                    C={C}
                  />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>👨‍⚕️</Text>}
                  title="Family Doctor"
                  accent={C.ok}
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Doctor Name"
                        value={doctorName}
                        onChangeText={setDoctorName}
                        placeholder="Dr. Name"
                        C={C}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Doctor Phone"
                        value={doctorPhone}
                        onChangeText={setDoctorPhone}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                        C={C}
                      />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>📋</Text>}
                  title="Additional Notes"
                  subtitle="Any other important information"
                  C={C}
                >
                  <Field
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Special instructions for responders..."
                    multiline
                    C={C}
                  />
                </SectionCard>
              </View>
            )}

            {/* Step 2 — Contacts */}
            {step === 2 && (
              <View style={s.stepContent}>
                <View style={[s.callInfoBox, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={[s.callInfoTitle, { color: C.tx }]}>How Emergency Calls Work</Text>
                  {[
                    { color: PRIORITY_COLORS[0], text: "Call #1 — Primary contact gets called first" },
                    { color: PRIORITY_COLORS[1], text: "Call #2 — Secondary contact if first doesn't answer" },
                    { color: PRIORITY_COLORS[2], text: "Call #3 — Tertiary contact for backup" },
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
                    <Text style={[s.emptyTitle, { color: C.tx }]}>No Emergency Contacts</Text>
                    <Text style={[s.emptySub, { color: C.tx3 }]}>
                      Add at least one contact who will be called in an emergency.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {sortedContacts.map((c, i) => (
                      <ContactCard
                        key={c.id ?? `contact_${i}`}
                        contact={c}
                        index={i}
                        onEdit={(con) => { setEditContact(con); setModalVisible(true); }}
                        onDelete={handleDeleteContact}
                        C={C}
                      />
                    ))}
                  </View>
                )}

                {contacts.length < 5 && (
                  <TouchableOpacity
                    style={[s.addBtn, { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]}
                    onPress={() => { setEditContact(null); setModalVisible(true); }}
                    activeOpacity={0.75}
                  >
                    <View style={[s.addBtnIcon, { backgroundColor: C.primary }]}>
                      <PlusSvg c="#fff" s={18} />
                    </View>
                    <View>
                      <Text style={[s.addBtnLabel, { color: C.primary }]}>Add Emergency Contact</Text>
                      <Text style={[s.addBtnSub, { color: C.tx3 }]}>
                        {contacts.length} contact{contacts.length !== 1 ? 's' : ''} added
                      </Text>
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
                    <Text style={[s.reviewAvatarText, { color: C.primary }]}>
                      {firstName ? firstName[0].toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[s.reviewName, { color: C.tx }]}>
                      {`${firstName} ${lastName}`.trim() || 'Child'}
                    </Text>
                    <Text style={[s.reviewClass, { color: C.tx3 }]}>{classLabel}</Text>
                  </View>
                  <View style={[
                    s.reviewStatus,
                    { backgroundColor: completed.length >= 3 ? C.okBg : C.s3, borderColor: completed.length >= 3 ? C.okBd : C.bd },
                  ]}>
                    <View style={[s.reviewStatusDot, { backgroundColor: completed.length >= 3 ? C.ok : C.tx3 }]} />
                    <Text style={[s.reviewStatusText, { color: completed.length >= 3 ? C.ok : C.tx3 }]}>
                      {completed.length >= 3 ? 'Ready' : 'Draft'}
                    </Text>
                  </View>
                </View>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>👤</Text>}
                  title="Student Information"
                  C={C}
                >
                  <ReviewRow label="First Name" value={firstName} C={C} />
                  <ReviewRow label="Last Name" value={lastName} C={C} />
                  <ReviewRow label="Class" value={cls || 'Not set'} C={C} />
                  <ReviewRow label="Section" value={section || 'Not set'} C={C} />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>❤️</Text>}
                  title="Medical Information"
                  C={C}
                >
                  <ReviewRow label="Blood Group" value={bloodGroup || 'Not set'} C={C} />
                  <ReviewRow label="Allergies" value={allergies || 'None'} C={C} />
                  <ReviewRow label="Conditions" value={conditions || 'None'} C={C} />
                  <ReviewRow label="Medications" value={medications || 'None'} C={C} />
                  <ReviewRow label="Doctor" value={doctorName || 'Not set'} C={C} />
                  <ReviewRow label="Doctor Phone" value={doctorPhone || 'Not set'} C={C} />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>📞</Text>}
                  title={`Emergency Contacts (${contacts.length})`}
                  accent={C.blue}
                  C={C}
                >
                  {contacts.length === 0
                    ? <Text style={[s.noContacts, { color: C.tx3 }]}>No emergency contacts added</Text>
                    : sortedContacts.map((c, i) => (
                      <ReviewRow
                        key={c.id ?? `review_${i}`}
                        label={`${c.priority}. ${c.relationship || 'Contact'}`}
                        value={`${c.name} · ${c.phone}`}
                        C={C}
                      />
                    ))
                  }
                </SectionCard>

                <View style={[s.note, { backgroundColor: C.okBg, borderColor: C.okBd, flexDirection: 'row', gap: 8 }]}>
                  <Text style={{ fontSize: 14 }}>🛡️</Text>
                  <Text style={[s.noteText, { color: C.ok, flex: 1 }]}>
                    {isNewUser
                      ? 'Review all information carefully. This will be used in emergencies.'
                      : 'Update your child\'s information as needed.'}
                  </Text>
                </View>
              </View>
            )}

          </Animated.View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <NavFooter
        step={step}
        onBack={goBack}
        onNext={goNext}
        nextLabel={nextLabel}
        saving={saving}
        canProceed={canProceed}
        C={C}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenH, paddingTop: spacing[5], paddingBottom: spacing[3], borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, flex: 1, textAlign: 'center' },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  newDot: { width: 5, height: 5, borderRadius: 3 },
  newText: { fontSize: 11, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 18, gap: 14, paddingBottom: 30 },
  stepContent: { gap: 14 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  noteText: { fontSize: 11.5, flex: 1 },
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
  noContacts: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', padding: 12 },
});