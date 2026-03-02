/**
 * Updates Screen — Redesigned for parents.
 * Clean, warm, trustworthy — parents update their child's card regularly.
 *
 * Key UX improvements:
 *  - Larger touch targets, clearer labels
 *  - Input cards replace raw underline fields — feels safe and complete
 *  - Blood group picker is visually prominent (critical info)
 *  - Contacts tab shows call-order visually with colored priority rings
 *  - Sticky submit bar at bottom — always visible when dirty
 *  - Section icons so parents instantly know what each group is about
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/theme';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp, Layout } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ic = {
  User: ({ c = colors.textTertiary, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={1.8} />
    </Svg>
  ),
  Heart: ({ c = colors.primary, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Phone: ({ c = colors.textTertiary, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
  Plus: ({ c = colors.white, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  ),
  Edit: ({ c = colors.textSecondary, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Trash: ({ c = colors.primary, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
  Check: ({ c = colors.white, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Clock: ({ c = colors.warning, s = 15 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={c} strokeWidth={1.8} />
      <Path d="M12 6v6l4 2" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
  X: ({ c = colors.primary, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  ),
  Lock: ({ c = colors.textTertiary, s = 36 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={11} width={18} height={11} rx={2} stroke={c} strokeWidth={1.6} />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  ),
  Camera: ({ c = colors.primary, s = 20 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={c} strokeWidth={1.8} />
    </Svg>
  ),
  Drop: ({ c = '#ef4444', s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Pill: ({ c = '#8b5cf6', s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M10.5 20.5l10-10a5 5 0 00-7.07-7.07l-10 10a5 5 0 007.07 7.07z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.5 8.5l7 7" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
  Doctor: ({ c = '#0ea5e9', s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke={c} strokeWidth={1.8} />
      <Path d="M8 9V7a4 4 0 018 0v2M12 13v3m-1.5-1.5h3"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
  Note: ({ c = '#f59e0b', s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  ),
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Unknown'];

// Priority ring colors: #1 red, #2 amber, #3 blue, #4 violet, #5 emerald
const PRIORITY_COLORS = ['#E8342A', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'];

const TABS = [
  { id: 'child', label: 'Child', emoji: '👤', Icon: ({ active }) => <Ic.User c={active ? colors.primary : colors.textTertiary} s={16} /> },
  { id: 'emergency', label: 'Medical', emoji: '🏥', Icon: ({ active }) => <Ic.Heart c={active ? colors.primary : colors.textTertiary} s={16} /> },
  { id: 'contacts', label: 'Contacts', emoji: '📞', Icon: ({ active }) => <Ic.Phone c={active ? colors.primary : colors.textTertiary} s={16} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Request Banner ───────────────────────────────────────────────────────────

function RequestBanner({ requests = [] }) {
  const pending = requests.filter(r => r.status === 'PENDING');
  const rejected = requests.filter(r => r.status === 'REJECTED');
  if (!pending.length && !rejected.length) return null;

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.bannerStack}>
      {pending.length > 0 && (
        <View style={styles.pendingBanner}>
          <View style={styles.bannerIconWrap}>
            <Ic.Clock c={colors.warning} s={15} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {pending.length} update{pending.length > 1 ? 's' : ''} awaiting school approval
            </Text>
            {pending[0].created_at && (
              <Text style={styles.bannerSub}>Submitted {fmtDate(pending[0].created_at)} · takes 1–2 school days</Text>
            )}
          </View>
        </View>
      )}
      {rejected.map((r, i) => (
        <View key={r.id ?? i} style={styles.rejectedBanner}>
          <View style={[styles.bannerIconWrap, { backgroundColor: `${colors.primary}15` }]}>
            <Ic.X c={colors.primary} s={14} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rejectedTitle}>School rejected your update</Text>
            {r.reject_reason && (
              <Text style={styles.rejectedReason}>
                {`"${r.reject_reason}"`}
              </Text>
            )}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange, dirtyTabs }) {
  return (
    <View style={styles.tabBar}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const isDirty = dirtyTabs.includes(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.75}
          >
            <tab.Icon active={isActive} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            {isDirty && !isActive && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── InputCard — replaces raw underline field ─────────────────────────────────
// Feels like filling out a proper form, not a settings tweak

function InputCard({ label, value, onChangeText, placeholder, multiline, keyboardType, locked, hint, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputCard, focused && styles.inputCardFocused, locked && styles.inputCardLocked]}>
      <View style={styles.inputCardHeader}>
        <View style={styles.inputCardLabelRow}>
          {icon && <View style={styles.inputCardIcon}>{icon}</View>}
          <Text style={styles.inputCardLabel}>{label}</Text>
        </View>
        {locked && (
          <View style={styles.lockedBadge}>
            <Ic.Lock c={colors.textTertiary} s={10} />
            <Text style={styles.lockedBadgeText}>School managed</Text>
          </View>
        )}
      </View>
      <TextInput
        style={[styles.inputCardField, multiline && styles.inputCardFieldMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        editable={!locked}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        keyboardType={keyboardType ?? 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hint && !focused && <Text style={styles.inputCardHint}>{hint}</Text>}
    </View>
  );
}

// ─── Row pair (two InputCards side by side) ───────────────────────────────────

function InputRow({ children }) {
  return <View style={styles.inputRow}>{children}</View>;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHead({ emoji, title, subtitle }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionHeadEmoji}>{emoji}</Text>
      <View>
        <Text style={styles.sectionHeadTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionHeadSub}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ─── Blood Group Picker ───────────────────────────────────────────────────────

function BloodGroupPicker({ value, onChange }) {
  return (
    <View style={styles.bloodWrap}>
      <View style={styles.bloodLabelRow}>
        <Ic.Drop c="#ef4444" s={15} />
        <Text style={styles.bloodLabel}>Blood Group</Text>
        <Text style={styles.bloodSub}>— tap to select</Text>
      </View>
      <View style={styles.bloodGrid}>
        {BLOOD_GROUPS.map(bg => {
          const sel = value === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodChip, sel && styles.bloodChipSel]}
              onPress={() => onChange(bg)}
              activeOpacity={0.7}
            >
              {sel && (
                <View style={styles.bloodCheckDot}>
                  <Ic.Check c={colors.white} s={8} />
                </View>
              )}
              <Text style={[styles.bloodChipText, sel && styles.bloodChipTextSel]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!value && (
        <Text style={styles.bloodRequired}>⚠ Required — critical for emergency care</Text>
      )}
    </View>
  );
}

// ─── Photo Row ────────────────────────────────────────────────────────────────

function PhotoRow({ photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.photoRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.photoAvatar}>
        <Ic.User c={colors.textTertiary} s={28} />
        <View style={styles.photoEditBadge}>
          <Ic.Camera c={colors.white} s={10} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.photoLabel}>{photoUrl ? 'Change Photo' : 'Add Child Photo'}</Text>
        <Text style={styles.photoSub}>
          {photoUrl
            ? 'Tap to update from gallery'
            : 'Helps emergency responders identify your child instantly'}
        </Text>
      </View>
      <View style={styles.photoCta}>
        <Text style={styles.photoCtaText}>Tap</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, onEdit, onDelete, index }) {
  const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
  const isFirst = contact.priority === 1;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 70).duration(350)}
      layout={Layout.springify()}
      style={[styles.contactCard, isFirst && styles.contactCardFirst, !contact.is_active && styles.contactCardInactive]}
    >
      {/* Priority ring */}
      <View style={[styles.contactRing, { borderColor: pc, backgroundColor: `${pc}12` }]}>
        <Text style={[styles.contactRingText, { color: pc }]}>{contact.priority}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={styles.contactTopRow}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {isFirst && (
            <View style={styles.firstBadge}>
              <Text style={styles.firstBadgeText}>Called first</Text>
            </View>
          )}
          {!contact.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactDetail}>
          {contact.relationship ?? 'Guardian'}  ·  {contact.phone}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.contactBtn} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <Ic.Edit c={colors.textSecondary} s={14} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactBtn, styles.contactBtnDanger]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <Ic.Trash c={colors.primary} s={14} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Contact Modal ────────────────────────────────────────────────────────────

function ContactModal({ visible, contact, onSave, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleOpen = () => {
    setName(contact?.name ?? '');
    setPhone(contact?.phone ?? '');
    setRelationship(contact?.relationship ?? '');
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Info', 'Name and phone number are required.');
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleOpen}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ic.Phone c={colors.primary} s={20} />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {contact?.id ? 'Edit Contact' : 'Add Emergency Contact'}
                </Text>
                <Text style={styles.modalSub}>
                  Called immediately when the card is scanned
                </Text>
              </View>
            </View>

            {/* Fields */}
            <View style={styles.modalFields}>
              <InputCard label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" />
              <InputCard label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <InputCard label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="Mother / Father / Uncle…" />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ic.Check c={colors.white} s={16} />
              <Text style={styles.modalSaveBtnText}>
                {contact?.id ? 'Save Changes' : 'Add Contact'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Info Note ────────────────────────────────────────────────────────────────

function InfoNote({ children, type = 'info' }) {
  const cfg = {
    info: { bg: colors.infoBg, border: 'rgba(59,130,246,0.2)', text: colors.info },
    warning: { bg: colors.warningBg, border: 'rgba(245,158,11,0.2)', text: colors.warning },
    success: { bg: colors.successBg, border: 'rgba(16,185,129,0.2)', text: colors.success },
  }[type];
  return (
    <View style={[styles.infoNote, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.infoNoteText, { color: cfg.text }]}>{children}</Text>
    </View>
  );
}

// ─── Sticky Submit Bar ────────────────────────────────────────────────────────

function SubmitBar({ hasChanges, submitting, submitted, onSubmit }) {
  if (!hasChanges && !submitting && !submitted) return null;
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.submitBar}>
      <TouchableOpacity
        style={[
          styles.submitBtn,
          submitted && styles.submitBtnDone,
          submitting && styles.submitBtnBusy,
        ]}
        onPress={onSubmit}
        activeOpacity={0.85}
        disabled={submitting || submitted}
      >
        {submitted ? (
          <>
            <Ic.Check c={colors.success} s={16} />
            <Text style={[styles.submitBtnText, { color: colors.success }]}>Sent for Approval</Text>
          </>
        ) : (
          <Text style={styles.submitBtnText}>
            {submitting ? 'Submitting…' : 'Submit Changes for Approval →'}
          </Text>
        )}
      </TouchableOpacity>
      {!submitted && (
        <Text style={styles.submitNote}>School reviews within 1–2 school days</Text>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UpdatesScreen() {
  const {
    student, emergencyProfile,
    contacts: rawContacts, updateRequests, schoolSettings,
    submitUpdateRequest, addContact, updateContact, deleteContact,
  } = useProfileStore();

  const canEdit = schoolSettings?.allow_parent_edit !== false;

  // Tab
  const [activeTab, setActiveTab] = useState('child');

  // Child Info
  const [firstName, setFirstName] = useState(student?.first_name ?? '');
  const [lastName, setLastName] = useState(student?.last_name ?? '');
  const [cls, setCls] = useState(student?.class ?? '');
  const [section, setSection] = useState(student?.section ?? '');

  // Medical
  const [bloodGroup, setBloodGroup] = useState(emergencyProfile?.blood_group ?? '');
  const [allergies, setAllergies] = useState(emergencyProfile?.allergies ?? '');
  const [conditions, setConditions] = useState(emergencyProfile?.conditions ?? '');
  const [medications, setMedications] = useState(emergencyProfile?.medications ?? '');
  const [doctorName, setDoctorName] = useState(emergencyProfile?.doctor_name ?? '');
  const [doctorPhone, setDoctorPhone] = useState(emergencyProfile?.doctor_phone ?? '');
  const [notes, setNotes] = useState(emergencyProfile?.notes ?? '');

  // Contacts
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [contactModal, setContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dirty tracking
  const childDirty = firstName !== (student?.first_name ?? '') || lastName !== (student?.last_name ?? '') || cls !== (student?.class ?? '') || section !== (student?.section ?? '');
  const medDirty = bloodGroup !== (emergencyProfile?.blood_group ?? '') || allergies !== (emergencyProfile?.allergies ?? '') || conditions !== (emergencyProfile?.conditions ?? '') || medications !== (emergencyProfile?.medications ?? '') || doctorName !== (emergencyProfile?.doctor_name ?? '') || doctorPhone !== (emergencyProfile?.doctor_phone ?? '') || notes !== (emergencyProfile?.notes ?? '');
  const dirtyTabs = [...(childDirty ? ['child'] : []), ...(medDirty ? ['emergency'] : [])];
  const hasChanges = childDirty || medDirty;

  // Handlers
  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      const updated = contacts.map(c => c.id === editingContact.id ? { ...c, ...data } : c);
      setContacts(updated);
      updateContact?.({ ...editingContact, ...data });
    } else {
      const newC = { id: `temp_${Date.now()}`, ...data, priority: contacts.length + 1, is_active: true };
      setContacts([...contacts, newC]);
      addContact?.(newC);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: () => {
          const updated = contacts.filter(c => c.id !== contact.id).map((c, i) => ({ ...c, priority: i + 1 }));
          setContacts(updated);
          deleteContact?.(contact.id);
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!hasChanges) return;
    setSubmitting(true);
    const changes = {};
    if (childDirty) changes.student = { first_name: firstName, last_name: lastName, class: cls, section };
    if (medDirty) changes.emergency = { blood_group: bloodGroup, allergies, conditions, medications, doctor_name: doctorName, doctor_phone: doctorPhone, notes };
    await submitUpdateRequest?.(changes);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // Lock screen
  if (!canEdit) {
    return (
      <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
        <View style={styles.lockScreen}>
          <View style={styles.lockIconWrap}>
            <Ic.Lock c={colors.textTertiary} s={36} />
          </View>
          <Text style={styles.lockTitle}>Editing Disabled</Text>
          <Text style={styles.lockSub}>Your school has locked profile editing. Contact your school administrator to make changes.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
      <ContactModal
        visible={contactModal}
        contact={editingContact}
        onSave={handleSaveContact}
        onClose={() => setContactModal(false)}
      />

      {/* ── HEADER ── */}
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>
            {student?.first_name ? `${student.first_name}'s Profile` : 'Update Profile'}
          </Text>
          <Text style={styles.pageSubtitle}>Keep your child's card up to date</Text>
        </View>
        <View style={styles.approvalBadge}>
          <Ic.Clock c={colors.warning} s={12} />
          <Text style={styles.approvalBadgeText}>Needs Approval</Text>
        </View>
      </Animated.View>

      {/* ── BANNERS ── */}
      {(updateRequests?.length ?? 0) > 0 && (
        <View style={styles.bannerArea}>
          <RequestBanner requests={updateRequests} />
        </View>
      )}

      {/* ── TABS ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} dirtyTabs={dirtyTabs} />
      </Animated.View>

      {/* ── CONTENT ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ═══ TAB: CHILD INFO ═══ */}
        {activeTab === 'child' && (
          <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.tabContent}>

            <SectionHead emoji="📷" title="Profile Photo" subtitle="Helps first responders identify your child quickly" />
            <PhotoRow
              photoUrl={student?.photo_url}
              onPress={() => { /* wire expo-image-picker */ }}
            />

            <SectionHead emoji="👤" title="Full Name" subtitle="Changes require school verification" />
            <InputRow>
              <View style={{ flex: 1 }}>
                <InputCard label="First Name" value={firstName} onChangeText={setFirstName} placeholder="e.g. Aanya" />
              </View>
              <View style={{ flex: 1 }}>
                <InputCard label="Last Name" value={lastName} onChangeText={setLastName} placeholder="e.g. Sharma" />
              </View>
            </InputRow>

            <SectionHead emoji="🏫" title="Class & Section" />
            <InputRow>
              <View style={{ flex: 1 }}>
                <InputCard label="Class" value={cls} onChangeText={setCls} placeholder="e.g. 6" />
              </View>
              <View style={{ flex: 1 }}>
                <InputCard label="Section" value={section} onChangeText={setSection} placeholder="e.g. A" />
              </View>
            </InputRow>

            <InfoNote type="warning">
              📋  Name and class changes are sent to your school for verification. Usually approved within 1–2 school days.
            </InfoNote>

          </Animated.View>
        )}

        {/* ═══ TAB: MEDICAL ═══ */}
        {activeTab === 'emergency' && (
          <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.tabContent}>

            {/* Blood Group — most critical, shown first with prominent picker */}
            <SectionHead emoji="🩸" title="Blood Group" subtitle="Critical — shared with emergency staff immediately" />
            <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} />

            {/* Allergies */}
            <SectionHead emoji="⚠️" title="Allergies" subtitle="Food, medication, environment — be specific" />
            <InputCard
              label="Known Allergies"
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Peanuts, Penicillin, Dust mites, Latex…"
              multiline
              hint="Separate multiple allergies with commas"
            />

            {/* Medical Conditions */}
            <SectionHead emoji="🫁" title="Medical Conditions" />
            <InputCard
              label="Conditions"
              value={conditions}
              onChangeText={setConditions}
              placeholder="e.g. Asthma, Type 1 Diabetes, Epilepsy…"
              multiline
            />

            {/* Medications */}
            <SectionHead emoji="💊" title="Current Medications" />
            <InputCard
              label="Medications"
              value={medications}
              onChangeText={setMedications}
              placeholder="e.g. Salbutamol inhaler (Blue) for asthma, Metformin 500mg after meals…"
              multiline
              hint="Include dosage and when taken if possible"
            />

            {/* Doctor */}
            <SectionHead emoji="👨‍⚕️" title="Family Doctor" subtitle="First point of contact in a medical emergency" />
            <InputRow>
              <View style={{ flex: 1 }}>
                <InputCard label="Doctor's Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Full Name" />
              </View>
              <View style={{ flex: 1 }}>
                <InputCard label="Doctor's Phone" value={doctorPhone} onChangeText={setDoctorPhone} placeholder="+91 …" keyboardType="phone-pad" />
              </View>
            </InputRow>

            {/* Notes */}
            <SectionHead emoji="📝" title="Notes for First Responders" subtitle="Anything critical they must know immediately" />
            <InputCard
              label="Special Instructions"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Always carries blue inhaler in school bag. Has medical bracelet on left wrist. Do NOT give any nut-based products."
              multiline
              hint="The more specific, the better — this is shown on the emergency card"
            />

          </Animated.View>
        )}

        {/* ═══ TAB: CONTACTS ═══ */}
        {activeTab === 'contacts' && (
          <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.tabContent}>

            {/* Call order explanation */}
            <View style={styles.callOrderCard}>
              <Text style={styles.callOrderTitle}>📞 How emergency calls work</Text>
              <View style={styles.callOrderSteps}>
                {(['#1 called first — answer immediately', '#2 called if #1 doesn\'t answer', '#3 and beyond as backup']).map((step, i) => (
                  <View key={i} style={styles.callOrderStep}>
                    <View style={[styles.callOrderDot, { backgroundColor: PRIORITY_COLORS[i] }]} />
                    <Text style={styles.callOrderText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Contact list */}
            {contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyEmoji}>📵</Text>
                <Text style={styles.emptyTitle}>No contacts added yet</Text>
                <Text style={styles.emptySub}>Add at least one emergency contact. They'll be called the moment your child's card is scanned.</Text>
              </View>
            ) : (
              <View style={styles.contactList}>
                {[...contacts].sort((a, b) => a.priority - b.priority).map((c, i) => (
                  <ContactCard
                    key={c.id} contact={c} index={i}
                    onEdit={(contact) => { setEditingContact(contact); setContactModal(true); }}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </View>
            )}

            {contacts.length < 5 && (
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={() => { setEditingContact(null); setContactModal(true); }}
                activeOpacity={0.75}
              >
                <View style={styles.addContactIconWrap}>
                  <Ic.Plus c={colors.white} s={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addContactLabel}>Add Emergency Contact</Text>
                  <Text style={styles.addContactSub}>{contacts.length}/5 contacts added</Text>
                </View>
              </TouchableOpacity>
            )}

            <InfoNote type="success">
              ✅  Contact changes go live immediately — no school approval needed.
            </InfoNote>

          </Animated.View>
        )}

        {/* Bottom padding for sticky bar */}
        <View style={{ height: hasChanges ? 90 : 20 }} />
      </ScrollView>

      {/* ── STICKY SUBMIT BAR — floats above scroll ── */}
      {activeTab !== 'contacts' && (
        <SubmitBar
          hasChanges={hasChanges}
          submitting={submitting}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
      )}
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // ── Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
  },
  headerLeft: { flex: 1, gap: 2 },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageSubtitle: { ...typography.bodySm, color: colors.textTertiary },
  approvalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warningBg,
    borderRadius: radius.chipFull, borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    paddingHorizontal: spacing[2.5], paddingVertical: spacing[1.5],
    marginTop: 4,
  },
  approvalBadgeText: { ...typography.labelXs, color: colors.warning, fontWeight: '700' },

  // ── Banners ───────────────────────────────────────────────────────
  bannerArea: { paddingHorizontal: spacing.screenH, paddingBottom: spacing[2] },
  bannerStack: { gap: spacing[2] },
  bannerIconWrap: {
    width: 30, height: 30, borderRadius: radius.md,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.warningBg, borderRadius: radius.cardSm,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: spacing[3],
  },
  bannerTitle: { ...typography.labelSm, color: colors.warning, fontWeight: '700' },
  bannerSub: { ...typography.labelXs, color: colors.warning, opacity: 0.8, marginTop: 2 },
  rejectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.primaryBg, borderRadius: radius.cardSm,
    borderWidth: 1, borderColor: 'rgba(232,52,42,0.25)', padding: spacing[3],
  },
  rejectedTitle: { ...typography.labelSm, color: colors.primary, fontWeight: '700' },
  rejectedReason: { ...typography.labelXs, color: colors.primary, opacity: 0.8, marginTop: 2, fontStyle: 'italic' },

  // ── Tab bar ───────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[1.5],
    paddingVertical: spacing[2.5], borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, position: 'relative',
  },
  tabItemActive: {
    backgroundColor: colors.primaryBg,
    borderColor: 'rgba(232,52,42,0.35)',
  },
  tabLabel: { ...typography.labelSm, color: colors.textTertiary, fontWeight: '600' },
  tabLabelActive: { color: colors.primary },
  tabDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.warning,
    borderWidth: 1.5, borderColor: colors.surface,
  },

  // ── Scroll ────────────────────────────────────────────────────────
  scroll: { paddingHorizontal: spacing.screenH, paddingBottom: spacing[4] },
  tabContent: { gap: spacing[3] },

  // ── Section Head ──────────────────────────────────────────────────
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[2], marginTop: spacing[2],
  },
  sectionHeadEmoji: { fontSize: 18, lineHeight: 24 },
  sectionHeadTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  sectionHeadSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 1 },

  // ── Input Card ────────────────────────────────────────────────────
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1.5, borderColor: colors.border,
    padding: spacing[4], gap: spacing[2],
  },
  inputCardFocused: { borderColor: colors.primary },
  inputCardLocked: { backgroundColor: colors.surface3, borderColor: colors.border, opacity: 0.7 },
  inputCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputCardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  inputCardIcon: { opacity: 0.7 },
  inputCardLabel: { ...typography.overline, color: colors.textTertiary, fontSize: 10, letterSpacing: 0.8 },
  lockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.surface3, borderRadius: radius.chipFull,
    paddingHorizontal: spacing[1.5], paddingVertical: 2,
  },
  lockedBadgeText: { ...typography.labelXs, color: colors.textTertiary, fontSize: 9 },
  inputCardField: {
    ...typography.bodyMd, color: colors.textPrimary,
    paddingVertical: 0, height: 34,
  },
  inputCardFieldMulti: { height: 80, textAlignVertical: 'top', paddingTop: 2 },
  inputCardHint: { ...typography.labelXs, color: colors.textTertiary, fontStyle: 'italic' },

  // ── Input Row (side by side) ──────────────────────────────────────
  inputRow: { flexDirection: 'row', gap: spacing[2] },

  // ── Photo ─────────────────────────────────────────────────────────
  photoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing[4],
  },
  photoAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface3, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  photoEditBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, borderWidth: 2,
    borderColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  photoLabel: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  photoSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 3, lineHeight: 16 },
  photoCta: {
    backgroundColor: colors.primaryBg, borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(232,52,42,0.25)',
    paddingHorizontal: spacing[2.5], paddingVertical: spacing[1.5],
  },
  photoCtaText: { ...typography.labelXs, color: colors.primary, fontWeight: '700' },

  // ── Blood Group Picker ────────────────────────────────────────────
  bloodWrap: {
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing[4], gap: spacing[3],
  },
  bloodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  bloodLabel: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  bloodSub: { ...typography.labelXs, color: colors.textTertiary },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  bloodChip: {
    paddingHorizontal: spacing[4], paddingVertical: spacing[2.5],
    borderRadius: radius.md, backgroundColor: colors.surface3,
    borderWidth: 1.5, borderColor: colors.border,
    minWidth: 62, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bloodChipSel: {
    backgroundColor: 'rgba(232,52,42,0.08)',
    borderColor: colors.primary, borderWidth: 2,
  },
  bloodCheckDot: {
    position: 'absolute', top: -5, right: -5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.primary, borderWidth: 2,
    borderColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  bloodChipText: { ...typography.labelMd, color: colors.textSecondary, fontWeight: '700' },
  bloodChipTextSel: { color: colors.primary },
  bloodRequired: { ...typography.labelXs, color: colors.warning, fontWeight: '600' },

  // ── Info Note ─────────────────────────────────────────────────────
  infoNote: {
    borderRadius: radius.cardSm, borderWidth: 1,
    padding: spacing[3.5],
  },
  infoNoteText: { ...typography.bodySm, lineHeight: 18 },

  // ── Call order card ───────────────────────────────────────────────
  callOrderCard: {
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[3],
  },
  callOrderTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  callOrderSteps: { gap: spacing[2] },
  callOrderStep: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5] },
  callOrderDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  callOrderText: { ...typography.bodyMd, color: colors.textSecondary },

  // ── Contact list ──────────────────────────────────────────────────
  contactList: { gap: spacing[2] },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 1.5, borderColor: colors.border, padding: spacing[3.5],
  },
  contactCardFirst: { borderColor: `${PRIORITY_COLORS[0]}40` },
  contactCardInactive: { opacity: 0.45 },
  contactRing: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  contactRingText: { ...typography.h4, fontWeight: '900' },
  contactTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  contactName: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  firstBadge: {
    backgroundColor: `${PRIORITY_COLORS[0]}15`,
    borderRadius: radius.chipFull, borderWidth: 1,
    borderColor: `${PRIORITY_COLORS[0]}30`,
    paddingHorizontal: spacing[1.5], paddingVertical: 2,
  },
  firstBadgeText: { ...typography.labelXs, color: PRIORITY_COLORS[0], fontWeight: '700', fontSize: 9 },
  inactiveBadge: {
    backgroundColor: colors.surface3, borderRadius: radius.chipFull,
    paddingHorizontal: spacing[1.5], paddingVertical: 2,
  },
  inactiveBadgeText: { ...typography.labelXs, color: colors.textTertiary, fontSize: 9 },
  contactDetail: { ...typography.labelXs, color: colors.textTertiary, marginTop: 3 },
  contactActions: { flexDirection: 'row', gap: spacing[1.5] },
  contactBtn: {
    width: 34, height: 34, borderRadius: radius.md,
    backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center',
  },
  contactBtnDanger: { backgroundColor: colors.primaryBg },

  // ── Add contact button ────────────────────────────────────────────
  addContactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(232,52,42,0.35)', padding: spacing[4],
  },
  addContactIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addContactLabel: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  addContactSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2 },

  // ── Empty contacts ────────────────────────────────────────────────
  emptyContacts: {
    backgroundColor: colors.surface, borderRadius: radius.cardSm,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing[8], alignItems: 'center', gap: spacing[2],
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: '700' },
  emptySub: { ...typography.bodySm, color: colors.textTertiary, textAlign: 'center', lineHeight: 18 },

  // ── Sticky submit bar ─────────────────────────────────────────────
  submitBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[3], paddingBottom: spacing[5],
    gap: spacing[1.5],
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[2],
    backgroundColor: colors.primary, borderRadius: radius.btn,
    paddingVertical: spacing[4],
  },
  submitBtnDone: {
    backgroundColor: colors.successBg,
    borderWidth: 1.5, borderColor: colors.success,
  },
  submitBtnBusy: { opacity: 0.65 },
  submitBtnText: { ...typography.btnMd, color: colors.white, fontWeight: '700' },
  submitNote: { ...typography.labelXs, color: colors.textTertiary, textAlign: 'center' },

  // ── Contact modal ─────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.cardLg, borderTopRightRadius: radius.cardLg,
    padding: spacing[5], paddingBottom: spacing[8], gap: spacing[4],
  },
  modalHandle: {
    width: 36, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing[1],
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  modalHeaderIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.primaryBg, borderWidth: 1,
    borderColor: 'rgba(232,52,42,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { ...typography.h4, color: colors.textPrimary },
  modalSub: { ...typography.bodySm, color: colors.textTertiary, marginTop: 2 },
  modalFields: { gap: spacing[2] },
  modalSaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2],
    backgroundColor: colors.primary, borderRadius: radius.btn, paddingVertical: spacing[4],
  },
  modalSaveBtnText: { ...typography.btnMd, color: colors.white, fontWeight: '700' },

  // ── Lock screen ───────────────────────────────────────────────────
  lockScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8], gap: spacing[4],
  },
  lockIconWrap: {
    width: 80, height: 80, backgroundColor: colors.surface3,
    borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  lockTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  lockSub: { ...typography.bodyMd, color: colors.textTertiary, textAlign: 'center', lineHeight: 22 },
});