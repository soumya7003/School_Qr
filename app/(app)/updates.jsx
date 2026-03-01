/**
 * Updates Screen — Parent dashboard for managing child's emergency card profile.
 *
 * Schema models used:
 *   Student:              first_name, last_name, class, section, photo_url
 *   EmergencyProfile:     blood_group, allergies, conditions, medications,
 *                         doctor_name, doctor_phone, notes, visibility, is_visible
 *   EmergencyContact:     name, phone, relationship, priority, is_active
 *   StudentUpdateRequest: changes (Json), status, reject_reason, reviewed_at
 *   SchoolSettings:       allow_parent_edit
 *
 * UX decisions:
 *   - Tabbed sections (Child Info / Emergency / Contacts) so parents aren't overwhelmed
 *   - Blood group is a picker, not a free text field
 *   - Pending & rejected update requests shown as banners with context
 *   - Contacts are fully editable (add, edit, delete, reorder priority)
 *   - Submit sends a StudentUpdateRequest with changes as JSON diff
 *   - School edit lock respected via allow_parent_edit
 */

import Screen from '@/src/components/common/Screen';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
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
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUser = ({ color = colors.textTertiary }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
  </Svg>
);

const IconHeart = ({ color = colors.primary }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconPhone = ({ color = colors.textTertiary }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconPlus = ({ color = colors.primary }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

const IconEdit = ({ color = colors.textTertiary }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconTrash = ({ color = colors.primary }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={6} width={18} height={1.8} rx={0.9} stroke={color} strokeWidth={1.8} />
    <Path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconCheck = ({ color = colors.white }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconClock = ({ color = colors.warning }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconX = ({ color = colors.textTertiary }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconLock = ({ color = colors.textTertiary }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconCamera = ({ color = colors.primary }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={1.8} />
  </Svg>
);

// ─── Blood group picker data ──────────────────────────────────────────────────
// Common blood groups — picker prevents typos like "b+" or "B positive"
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Unknown'];

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'child', label: 'Child Info', icon: IconUser },
  { id: 'emergency', label: 'Medical', icon: IconHeart },
  { id: 'contacts', label: 'Contacts', icon: IconPhone },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Pending request banner ───────────────────────────────────────────────────
// StudentUpdateRequest: status PENDING | APPROVED | REJECTED, reject_reason
function RequestBanner({ requests = [] }) {
  const pending = requests.filter(r => r.status === 'PENDING');
  const rejected = requests.filter(r => r.status === 'REJECTED');
  if (!pending.length && !rejected.length) return null;

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.requestBannerWrap}>
      {pending.length > 0 && (
        <View style={styles.pendingBanner}>
          <IconClock color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              {pending.length} change{pending.length > 1 ? 's' : ''} waiting for school approval
            </Text>
            <Text style={styles.bannerSub}>
              Submitted {fmtDate(pending[0].created_at)} · usually takes 1–2 school days
            </Text>
          </View>
        </View>
      )}
      {rejected.map((r, i) => (
        <View key={r.id ?? i} style={styles.rejectedBanner}>
          <IconX color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rejectedTitle}>Update rejected by school</Text>
            {r.reject_reason ? (
              <Text style={styles.rejectedReason}>Reason: {r.reject_reason}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ label, hint, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, half, locked, keyboardType }) {
  return (
    <View style={[styles.field, half && styles.fieldHalf]}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {locked && <IconLock />}
      </View>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.fieldInputMulti,
          locked && styles.fieldInputLocked,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={!locked}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        keyboardType={keyboardType ?? 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

// ─── Blood group picker ───────────────────────────────────────────────────────
function BloodGroupPicker({ value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Blood Group</Text>
      <View style={styles.bloodGrid}>
        {BLOOD_GROUPS.map(bg => (
          <TouchableOpacity
            key={bg}
            style={[
              styles.bloodOption,
              value === bg && styles.bloodOptionSelected,
            ]}
            onPress={() => onChange(bg)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.bloodOptionText,
              value === bg && styles.bloodOptionTextSelected,
            ]}>
              {bg}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Photo picker row ─────────────────────────────────────────────────────────
// Student.photo_url — shows current photo or placeholder, tap to pick
function PhotoRow({ photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.photoRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.photoAvatar}>
        {/* In production: <Image source={{ uri: photoUrl }} style={styles.photoImg} /> */}
        <IconUser color={colors.textTertiary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.photoLabel}>
          {photoUrl ? 'Change Photo' : 'Add Photo'}
        </Text>
        <Text style={styles.photoSub}>
          {photoUrl ? 'Tap to update from gallery' : 'Helps responders identify your child faster'}
        </Text>
      </View>
      <View style={styles.photoCameraBtn}>
        <IconCamera color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Contact card ─────────────────────────────────────────────────────────────
// EmergencyContact: name, phone, relationship, priority, is_active
function ContactCard({ contact, onEdit, onDelete, index }) {
  const priorityColors = ['#E8342A', '#F59E0B', '#3B82F6'];
  const pc = priorityColors[contact.priority - 1] ?? colors.textTertiary;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(350)}
      layout={Layout.springify()}
      style={[styles.contactCard, !contact.is_active && styles.contactCardInactive]}
    >
      {/* Priority badge */}
      <View style={[styles.contactPriority, { backgroundColor: `${pc}18`, borderColor: `${pc}35` }]}>
        <Text style={[styles.contactPriorityText, { color: pc }]}>#{contact.priority}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={styles.contactNameRow}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {!contact.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactRel}>
          {contact.relationship ?? 'Guardian'}  ·  {contact.phone}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.contactActionBtn} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <IconEdit color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactActionBtn, styles.contactDeleteBtn]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <IconTrash color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Add / Edit contact modal ─────────────────────────────────────────────────
function ContactModal({ visible, contact, onSave, onClose }) {
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [relationship, setRelationship] = useState(contact?.relationship ?? '');

  // Reset when modal opens with new contact
  const handleOpen = () => {
    setName(contact?.name ?? '');
    setPhone(contact?.phone ?? '');
    setRelationship(contact?.relationship ?? '');
  };

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please enter both name and phone number.');
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
            <Text style={styles.modalTitle}>
              {contact?.id ? 'Edit Contact' : 'Add Emergency Contact'}
            </Text>
            <Text style={styles.modalSub}>
              This person will be called when your child's card is scanned in an emergency.
            </Text>

            <View style={styles.modalFields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Priya Sharma"
                  placeholderTextColor={colors.textTertiary}
                  selectionColor={colors.primary}
                  autoFocus
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  selectionColor={colors.primary}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Relationship</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="e.g. Mother, Father, Uncle..."
                  placeholderTextColor={colors.textTertiary}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} activeOpacity={0.8}>
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────
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
            activeOpacity={0.7}
          >
            <tab.icon color={isActive ? colors.primary : colors.textTertiary} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isDirty && !isActive && <View style={styles.tabDirtyDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UpdatesScreen() {
  const {
    student,
    emergencyProfile,
    contacts: rawContacts,
    updateRequests,
    schoolSettings,
    submitUpdateRequest,  // POST → StudentUpdateRequest with changes JSON
    addContact,
    updateContact,
    deleteContact,
  } = useProfileStore();

  const canEdit = schoolSettings?.allow_parent_edit !== false;

  // ── Tab state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('child');

  // ── Child Info — Student fields ────────────────────────────────
  const [firstName, setFirstName] = useState(student?.first_name ?? '');
  const [lastName, setLastName] = useState(student?.last_name ?? '');
  const [cls, setCls] = useState(student?.class ?? '');
  const [section, setSection] = useState(student?.section ?? '');

  // ── Medical — EmergencyProfile fields ─────────────────────────
  const [bloodGroup, setBloodGroup] = useState(emergencyProfile?.blood_group ?? '');
  const [allergies, setAllergies] = useState(emergencyProfile?.allergies ?? '');
  const [conditions, setConditions] = useState(emergencyProfile?.conditions ?? '');
  const [medications, setMedications] = useState(emergencyProfile?.medications ?? '');
  const [doctorName, setDoctorName] = useState(emergencyProfile?.doctor_name ?? '');
  const [doctorPhone, setDoctorPhone] = useState(emergencyProfile?.doctor_phone ?? '');
  const [notes, setNotes] = useState(emergencyProfile?.notes ?? '');

  // ── Contacts — EmergencyContact[] ─────────────────────────────
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [contactModal, setContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // ── Submit state ───────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Track which tabs have unsaved changes
  const childDirty = (
    firstName !== (student?.first_name ?? '') ||
    lastName !== (student?.last_name ?? '') ||
    cls !== (student?.class ?? '') ||
    section !== (student?.section ?? '')
  );
  const medDirty = (
    bloodGroup !== (emergencyProfile?.blood_group ?? '') ||
    allergies !== (emergencyProfile?.allergies ?? '') ||
    conditions !== (emergencyProfile?.conditions ?? '') ||
    medications !== (emergencyProfile?.medications ?? '') ||
    doctorName !== (emergencyProfile?.doctor_name ?? '') ||
    doctorPhone !== (emergencyProfile?.doctor_phone ?? '') ||
    notes !== (emergencyProfile?.notes ?? '')
  );
  const dirtyTabs = [
    ...(childDirty ? ['child'] : []),
    ...(medDirty ? ['emergency'] : []),
  ];

  const hasChanges = childDirty || medDirty;

  // ── Handlers ────────────────────────────────────────────────────

  const handleAddContact = () => {
    setEditingContact(null);
    setContactModal(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setContactModal(true);
  };

  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      // Update existing — EmergencyContact.id
      const updated = contacts.map(c =>
        c.id === editingContact.id ? { ...c, ...data } : c
      );
      setContacts(updated);
      updateContact?.({ ...editingContact, ...data });
    } else {
      // Add new — assign next priority
      const newContact = {
        id: `temp_${Date.now()}`, // replaced by real ID on save
        ...data,
        priority: contacts.length + 1,
        is_active: true,
      };
      setContacts([...contacts, newContact]);
      addContact?.(newContact);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Re-assign priorities after deletion
            const updated = contacts
              .filter(c => c.id !== contact.id)
              .map((c, i) => ({ ...c, priority: i + 1 }));
            setContacts(updated);
            deleteContact?.(contact.id);
          },
        },
      ]
    );
  };

  // Submit as StudentUpdateRequest.changes (JSON diff)
  const handleSubmit = async () => {
    if (!hasChanges) return;
    setSubmitting(true);

    const changes = {};
    if (childDirty) {
      changes.student = { first_name: firstName, last_name: lastName, class: cls, section };
    }
    if (medDirty) {
      changes.emergency = {
        blood_group: bloodGroup, allergies, conditions,
        medications, doctor_name: doctorName, doctor_phone: doctorPhone, notes,
      };
    }

    await submitUpdateRequest?.(changes);

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  // ── School edit lock screen ──────────────────────────────────────
  if (!canEdit) {
    return (
      <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
        <View style={styles.lockScreen}>
          <View style={styles.lockIcon}>
            <IconLock color={colors.textTertiary} />
          </View>
          <Text style={styles.lockTitle}>Editing Not Allowed</Text>
          <Text style={styles.lockSub}>
            Your school has disabled profile editing by parents. Contact your school administrator to make changes.
          </Text>
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

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>
            {student?.first_name ? `${student.first_name}'s Card` : 'Edit Profile'}
          </Text>
          <Text style={styles.pageSubtitle}>
            Changes go to school for approval before going live
          </Text>
        </View>
        {/* Approval info chip */}
        <View style={styles.approvalChip}>
          <IconClock color={colors.warning} />
          <Text style={styles.approvalChipText}>Needs Approval</Text>
        </View>
      </Animated.View>

      {/* ── Pending / rejected requests banner ── */}
      <View style={styles.bannerArea}>
        <RequestBanner requests={updateRequests ?? []} />
      </View>

      {/* ── Tab bar ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <TabBar
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          dirtyTabs={dirtyTabs}
        />
      </Animated.View>

      {/* ── Tab content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── TAB: CHILD INFO ── */}
        {activeTab === 'child' && (
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.tabContent}>

            {/* Photo — Student.photo_url */}
            <Section label="Photo" hint="Helps rescuers identify your child">
              <PhotoRow
                photoUrl={student?.photo_url}
                onPress={() => {/* wire expo-image-picker */ }}
              />
            </Section>

            {/* Name — Student.first_name, last_name */}
            <Section label="Name" hint="Contact school to change name">
              <View style={styles.fieldRow}>
                <Field
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  half
                  locked={false}
                />
                <Field
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  half
                />
              </View>
            </Section>

            {/* Class & Section — Student.class, Student.section */}
            <Section label="Class & Section">
              <View style={styles.fieldRow}>
                <Field
                  label="Class"
                  value={cls}
                  onChangeText={setCls}
                  placeholder="e.g. 6"
                  half
                />
                <Field
                  label="Section"
                  value={section}
                  onChangeText={setSection}
                  placeholder="e.g. A"
                  half
                />
              </View>
            </Section>

            {/* What happens after submit */}
            <View style={styles.approvalNote}>
              <Text style={styles.approvalNoteText}>
                📋  Name and class changes are submitted to your school admin for verification. Usually approved within 1–2 school days.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── TAB: MEDICAL (Emergency Profile) ── */}
        {activeTab === 'emergency' && (
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.tabContent}>

            {/* Blood group — EmergencyProfile.blood_group (picker) */}
            <Section label="Blood Group" hint="Critical for emergency medical care">
              <View style={styles.sectionCardInner}>
                <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} />
              </View>
            </Section>

            {/* Allergies — EmergencyProfile.allergies */}
            <Section label="Allergies" hint="Include food, medication, environment">
              <View style={styles.sectionCardInner}>
                <Field
                  label="Known Allergies"
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="e.g. Peanuts, Penicillin, Dust..."
                  multiline
                />
              </View>
            </Section>

            {/* Conditions — EmergencyProfile.conditions */}
            <Section label="Medical Conditions" hint="Asthma, epilepsy, diabetes etc.">
              <View style={styles.sectionCardInner}>
                <Field
                  label="Conditions"
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder="e.g. Asthma, Type 1 Diabetes..."
                  multiline
                />
              </View>
            </Section>

            {/* Medications — EmergencyProfile.medications */}
            <Section label="Current Medications">
              <View style={styles.sectionCardInner}>
                <Field
                  label="Medications"
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="e.g. Salbutamol inhaler (Blue), Metformin 500mg..."
                  multiline
                />
              </View>
            </Section>

            {/* Doctor — EmergencyProfile.doctor_name, doctor_phone */}
            <Section label="Doctor" hint="Child's regular physician">
              <View style={styles.sectionCardInner}>
                <View style={styles.fieldRow}>
                  <Field
                    label="Doctor's Name"
                    value={doctorName}
                    onChangeText={setDoctorName}
                    placeholder="Dr. Full Name"
                    half
                  />
                  <Field
                    label="Doctor's Phone"
                    value={doctorPhone}
                    onChangeText={setDoctorPhone}
                    placeholder="+91..."
                    half
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </Section>

            {/* Notes — EmergencyProfile.notes (exists in schema, missing from old UI) */}
            <Section label="Special Notes" hint="Anything a first responder must know">
              <View style={styles.sectionCardInner}>
                <Field
                  label="Notes for First Responders"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Always carries blue inhaler in bag. Do not give any nuts. Has a medical bracelet on left wrist."
                  multiline
                />
              </View>
            </Section>

          </Animated.View>
        )}

        {/* ── TAB: CONTACTS (EmergencyContact[]) ── */}
        {activeTab === 'contacts' && (
          <Animated.View entering={FadeInDown.delay(50).duration(350)} style={styles.tabContent}>

            {/* Priority explanation */}
            <View style={styles.priorityNote}>
              <Text style={styles.priorityNoteTitle}>#1 is called first</Text>
              <Text style={styles.priorityNoteText}>
                When someone scans the card, contacts are called in priority order — #1 first, then #2, then #3.
              </Text>
            </View>

            {/* Contact list — EmergencyContact[] sorted by priority */}
            {contacts.length === 0 ? (
              <View style={styles.emptyContacts}>
                <Text style={styles.emptyContactsTitle}>No contacts yet</Text>
                <Text style={styles.emptyContactsText}>
                  Add at least one emergency contact so someone can be reached when the card is scanned.
                </Text>
              </View>
            ) : (
              <View style={styles.contactList}>
                {[...contacts]
                  .sort((a, b) => a.priority - b.priority)
                  .map((c, i) => (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      index={i}
                      onEdit={handleEditContact}
                      onDelete={handleDeleteContact}
                    />
                  ))}
              </View>
            )}

            {/* Add contact button — max 5 contacts is a sensible limit */}
            {contacts.length < 5 && (
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={handleAddContact}
                activeOpacity={0.75}
              >
                <View style={styles.addContactIcon}>
                  <IconPlus color={colors.primary} />
                </View>
                <Text style={styles.addContactText}>
                  Add Emergency Contact
                </Text>
                <Text style={styles.addContactCount}>
                  {contacts.length}/5
                </Text>
              </TouchableOpacity>
            )}

            {/* Note about contacts not needing approval */}
            <View style={styles.approvalNote}>
              <Text style={styles.approvalNoteText}>
                ✅  Contact changes take effect immediately — no school approval needed.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Submit button — only shows if there are unsaved changes ── */}
        {(hasChanges || submitting) && activeTab !== 'contacts' && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.submitWrap}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                submitted && styles.submitBtnDone,
                submitting && styles.submitBtnLoading,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting || submitted}
            >
              {submitted ? (
                <View style={styles.submitBtnInner}>
                  <IconCheck color={colors.white} />
                  <Text style={styles.submitBtnText}>Submitted for Approval</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Changes for Approval →'}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.submitHint}>
              School admin will review and approve within 1–2 days
            </Text>
          </Animated.View>
        )}

      </ScrollView>
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
    paddingBottom: spacing[3],
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  approvalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    backgroundColor: colors.warningBg,
    borderRadius: radius.chipFull,
    borderWidth: 1,
    borderColor: `rgba(245,158,11,0.25)`,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1.5],
    marginTop: 2,
  },
  approvalChipText: {
    ...typography.labelXs,
    color: colors.warning,
    fontWeight: '700',
  },

  // ── Banner area ───────────────────────────────────────────────────
  bannerArea: {
    paddingHorizontal: spacing.screenH,
  },
  requestBannerWrap: { gap: spacing[2] },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2.5],
    backgroundColor: colors.warningBg,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: `rgba(245,158,11,0.25)`,
    padding: spacing[3],
  },
  bannerTitle: {
    ...typography.labelSm,
    color: colors.warning,
    fontWeight: '700',
  },
  bannerSub: {
    ...typography.labelXs,
    color: colors.warning,
    opacity: 0.8,
    marginTop: 2,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2.5],
    backgroundColor: colors.primaryBg,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: `rgba(232,52,42,0.2)`,
    padding: spacing[3],
  },
  rejectedTitle: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '700',
  },
  rejectedReason: {
    ...typography.labelXs,
    color: colors.primary,
    opacity: 0.85,
    marginTop: 2,
  },

  // ── Tab bar ───────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[2.5],
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: colors.primaryBg,
    borderColor: `rgba(232,52,42,0.3)`,
  },
  tabLabel: {
    ...typography.labelSm,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabDirtyDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },

  // ── Scroll ────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  tabContent: { gap: spacing[4] },

  // ── Section ───────────────────────────────────────────────────────
  section: { gap: spacing[1.5] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing[1],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.textTertiary,
  },
  sectionHint: {
    ...typography.labelXs,
    color: colors.textTertiary,
    opacity: 0.7,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionCardInner: {
    padding: spacing[4],
  },

  // ── Photo row ─────────────────────────────────────────────────────
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
  },
  photoAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.avatarLg,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  photoSub: {
    ...typography.labelXs,
    color: colors.textTertiary,
    marginTop: 3,
  },
  photoCameraBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `rgba(232,52,42,0.25)`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Fields ────────────────────────────────────────────────────────
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
  },
  field: {
    width: '100%',
    gap: spacing[1.5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldHalf: {
    width: '47%',
    paddingHorizontal: 0,
    borderBottomWidth: 0,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  fieldLabel: {
    ...typography.overline,
    color: colors.textTertiary,
    fontSize: 9,
    letterSpacing: 1,
  },
  fieldInput: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    backgroundColor: 'transparent',
    paddingVertical: spacing[1],
    paddingHorizontal: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    height: 36,
  },
  fieldInputMulti: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: spacing[1],
  },
  fieldInputLocked: {
    color: colors.textTertiary,
  },

  // ── Blood group picker ────────────────────────────────────────────
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  bloodOption: {
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 58,
    alignItems: 'center',
  },
  bloodOptionSelected: {
    backgroundColor: colors.primaryBg,
    borderColor: `rgba(232,52,42,0.5)`,
  },
  bloodOptionText: {
    ...typography.labelMd,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  bloodOptionTextSelected: {
    color: colors.primary,
  },

  // ── Approval note ─────────────────────────────────────────────────
  approvalNote: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3.5],
  },
  approvalNoteText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Priority note ─────────────────────────────────────────────────
  priorityNote: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: `rgba(59,130,246,0.2)`,
    padding: spacing[3.5],
    gap: spacing[1],
  },
  priorityNoteTitle: {
    ...typography.labelMd,
    color: colors.info,
    fontWeight: '700',
  },
  priorityNoteText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Contact list ──────────────────────────────────────────────────
  contactList: {
    gap: spacing[2],
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3.5],
  },
  contactCardInactive: {
    opacity: 0.5,
  },
  contactPriority: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactPriorityText: {
    ...typography.labelSm,
    fontWeight: '800',
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  contactName: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  inactiveBadge: {
    backgroundColor: colors.surface3,
    borderRadius: radius.chipFull,
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    ...typography.labelXs,
    color: colors.textTertiary,
    fontSize: 9,
  },
  contactRel: {
    ...typography.labelXs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  contactActionBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.surface3,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDeleteBtn: {
    backgroundColor: colors.primaryBg,
  },

  // ── Add contact button ────────────────────────────────────────────
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `rgba(232,52,42,0.3)`,
    padding: spacing[3.5],
  },
  addContactIcon: {
    width: 34,
    height: 34,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  addContactCount: {
    ...typography.labelXs,
    color: colors.textTertiary,
  },

  // ── Empty contacts ────────────────────────────────────────────────
  emptyContacts: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyContactsTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyContactsText: {
    ...typography.bodySm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Submit ────────────────────────────────────────────────────────
  submitWrap: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.btn,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  submitBtnDone: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  submitBtnLoading: {
    opacity: 0.7,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  submitBtnText: {
    ...typography.btnMd,
    color: colors.white,
    fontWeight: '700',
  },
  submitHint: {
    ...typography.labelXs,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // ── Contact modal ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    padding: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  modalSub: {
    ...typography.bodySm,
    color: colors.textTertiary,
    lineHeight: 18,
    marginTop: -spacing[1],
  },
  modalFields: { gap: 0 },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.btn,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
  modalSaveBtnText: {
    ...typography.btnMd,
    color: colors.white,
    fontWeight: '700',
  },

  // ── Lock screen ───────────────────────────────────────────────────
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  lockIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lockSub: {
    ...typography.bodyMd,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});