/**
 * UpdatesScreen — Edit profile + Onboarding mode
 *
 * Two modes:
 *   ONBOARDING (isNewUser = true):
 *     - Shows "Registration successful" banner
 *     - Save always visible on Child tab
 *     - After save: fetchAndPersist → setIsNewUser(false) → navigate home
 *
 *   EDIT (isNewUser = false):
 *     - Normal edit mode — save only visible when dirty
 *     - After save: toast only
 */

import Screen from "@/components/common/Screen";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { colors, radius, spacing, typography } from "@/theme";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

// ─── Icons ──────────────────────────────────────────────────────────────────

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
  Plus: ({ c = colors.white, s = 16 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" /></Svg>),
  Edit: ({ c = colors.textSecondary, s = 14 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" /><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>),
  Trash: ({ c = colors.primary, s = 14 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth={1.8} strokeLinecap="round" /></Svg>),
  Check: ({ c = colors.white, s = 16 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>),
  Flash: ({ c = "#10B981", s = 14 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>),
  Camera: ({ c = colors.primary, s = 20 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx={12} cy={13} r={4} stroke={c} strokeWidth={1.8} /></Svg>),
  X: ({ c = colors.primary, s = 14 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" /></Svg>),
  ChevronRight: ({ c = colors.textTertiary, s = 14 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>),
  Drop: ({ c = "#ef4444", s = 16 }) => (<Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>),
};

// ─── Constants ──────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−", "Unknown"];
const PRIORITY_COLORS = ["#E8342A", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

const TABS = [
  { id: "child", label: "Child", icon: "👤" },
  { id: "medical", label: "Medical", icon: "🏥" },
  { id: "contacts", label: "Contacts", icon: "📞" },
];

// ─── Onboarding Banner ──────────────────────────────────────────────────────

function OnboardingBanner() {
  return (
    <View style={styles.onboardingBanner}>
      <Text style={styles.onboardingEmoji}>🎉</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.onboardingTitle}>Registration successful!</Text>
        <Text style={styles.onboardingSubtitle}>
          Fill in your child's details to activate the emergency card. Start with the Child tab.
        </Text>
      </View>
    </View>
  );
}

// ─── Animated Save Toast ────────────────────────────────────────────────────

function SaveToast({ visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 10, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.toastDot} />
      <Text style={styles.toastText}>Saved to your child's card</Text>
    </Animated.View>
  );
}

// ─── Tab Bar ────────────────────────────────────────────────────────────────

function TabBar({ active, onChange, dirtyTabs }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const isDirty = dirtyTabs.includes(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
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

// ─── Field ──────────────────────────────────────────────────────────────────

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, hint }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.fieldBox, { borderColor }]}>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType ?? "default"}
          textAlignVertical={multiline ? "top" : "center"}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

function FieldRow({ children }) {
  return <View style={styles.fieldRow}>{children}</View>;
}

function Section({ emoji, title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionEmojiWrap}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function BloodPicker({ value, onChange }) {
  return (
    <View style={styles.bloodWrap}>
      <View style={styles.bloodRow}>
        {BLOOD_GROUPS.map((bg) => {
          const sel = value === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodChip, sel && styles.bloodChipSel]}
              onPress={() => onChange(bg)}
              activeOpacity={0.7}
            >
              <Text style={[styles.bloodChipText, sel && styles.bloodChipTextSel]}>{bg}</Text>
              {sel && <View style={styles.bloodDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {!value && (
        <Text style={styles.bloodWarning}>⚠ Select blood group — critical for emergencies</Text>
      )}
    </View>
  );
}

function PhotoRow({ photoUrl, onPress }) {
  return (
    <TouchableOpacity style={styles.photoRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.photoAvatar}>
        <Ic.User c={colors.textTertiary} s={26} />
        <View style={styles.photoBadge}>
          <Ic.Camera c={colors.white} s={9} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.photoLabel}>{photoUrl ? "Change Photo" : "Add Photo"}</Text>
        <Text style={styles.photoSub}>
          {photoUrl ? "Tap to update" : "Helps responders identify your child instantly"}
        </Text>
      </View>
      <Ic.ChevronRight c={colors.textTertiary} s={16} />
    </TouchableOpacity>
  );
}

function ContactCard({ contact, onEdit, onDelete, index }) {
  const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 60,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.contactCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.contactPriority, { backgroundColor: `${pc}18`, borderColor: `${pc}40` }]}>
        <Text style={[styles.contactPriorityText, { color: pc }]}>{contact.priority}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.contactTop}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {contact.priority === 1 && (
            <View style={[styles.contactBadge, { backgroundColor: `${pc}15`, borderColor: `${pc}30` }]}>
              <Text style={[styles.contactBadgeText, { color: pc }]}>First call</Text>
            </View>
          )}
        </View>
        <Text style={styles.contactMeta}>
          {contact.relationship ?? "Guardian"} · {contact.phone}
        </Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.contactBtn} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <Ic.Edit c={colors.textSecondary} s={13} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactBtn, styles.contactBtnRed]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <Ic.Trash c={colors.primary} s={13} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function ContactModal({ visible, contact, onSave, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? "");
      setPhone(contact?.phone ?? "");
      setRelationship(contact?.relationship ?? "");
    }
  }, [visible, contact]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Info", "Name and phone are required.");
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{contact?.id ? "Edit Contact" : "Add Contact"}</Text>
            <Text style={styles.sheetSub}>Called immediately when QR is scanned</Text>
            <View style={styles.sheetFields}>
              <Field label="Full Name" value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" />
              <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <Field label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="Mother / Father / Uncle…" />
            </View>
            <TouchableOpacity style={styles.sheetSaveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ic.Check c={colors.white} s={15} />
              <Text style={styles.sheetSaveBtnText}>
                {contact?.id ? "Save Changes" : "Add Contact"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function SaveButton({ visible, saving, onPress, label }) {
  if (!visible) return null;
  return (
    <View style={styles.saveBar}>
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnBusy]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? "Saving…" : label ?? "Save Changes"}</Text>
        {!saving && <Ic.Flash c={colors.white} s={14} />}
      </TouchableOpacity>
    </View>
  );
}

function Note({ children }) {
  return (
    <View style={styles.note}>
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function UpdatesScreen() {
  const router = useRouter();

  // Auth store
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);

  // Profile store
  const {
    student,
    emergencyProfile,
    contacts: rawContacts,
    updateStudentProfile,
    addContact,
    updateContact,
    deleteContact,
    fetchAndPersist,
  } = useProfileStore();

  // ── Tab state
  const [activeTab, setActiveTab] = useState("child");

  // ── Child fields
  const [firstName, setFirstName] = useState(student?.first_name ?? "");
  const [lastName, setLastName] = useState(student?.last_name ?? "");
  const [cls, setCls] = useState(student?.class ?? "");
  const [section, setSection] = useState(student?.section ?? "");

  // ── Medical fields
  const [bloodGroup, setBloodGroup] = useState(emergencyProfile?.blood_group ?? "");
  const [allergies, setAllergies] = useState(emergencyProfile?.allergies ?? "");
  const [conditions, setConditions] = useState(emergencyProfile?.conditions ?? "");
  const [medications, setMedications] = useState(emergencyProfile?.medications ?? "");
  const [doctorName, setDoctorName] = useState(emergencyProfile?.doctor_name ?? "");
  const [doctorPhone, setDoctorPhone] = useState(emergencyProfile?.doctor_phone ?? "");
  const [notes, setNotes] = useState(emergencyProfile?.notes ?? "");

  // ── Contacts
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  // ── Save states
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Sync fields when store updates (e.g. after fetchAndPersist)
  useEffect(() => {
    setFirstName(student?.first_name ?? "");
    setLastName(student?.last_name ?? "");
    setCls(student?.class ?? "");
    setSection(student?.section ?? "");
  }, [student]);

  useEffect(() => {
    setBloodGroup(emergencyProfile?.blood_group ?? "");
    setAllergies(emergencyProfile?.allergies ?? "");
    setConditions(emergencyProfile?.conditions ?? "");
    setMedications(emergencyProfile?.medications ?? "");
    setDoctorName(emergencyProfile?.doctor_name ?? "");
    setDoctorPhone(emergencyProfile?.doctor_phone ?? "");
    setNotes(emergencyProfile?.notes ?? "");
  }, [emergencyProfile]);

  useEffect(() => {
    setContacts(rawContacts ?? []);
  }, [rawContacts]);

  // ── Dirty tracking
  const childDirty =
    firstName !== (student?.first_name ?? "") ||
    lastName !== (student?.last_name ?? "") ||
    cls !== (student?.class ?? "") ||
    section !== (student?.section ?? "");

  const medDirty =
    bloodGroup !== (emergencyProfile?.blood_group ?? "") ||
    allergies !== (emergencyProfile?.allergies ?? "") ||
    conditions !== (emergencyProfile?.conditions ?? "") ||
    medications !== (emergencyProfile?.medications ?? "") ||
    doctorName !== (emergencyProfile?.doctor_name ?? "") ||
    doctorPhone !== (emergencyProfile?.doctor_phone ?? "") ||
    notes !== (emergencyProfile?.notes ?? "");

  const dirtyTabs = [
    ...(childDirty ? ["child"] : []),
    ...(medDirty ? ["medical"] : []),
  ];

  // ── Save button visibility
  // Onboarding: always show on Child tab (even if not "dirty" — first save needed)
  // Edit mode:  show only when tab has changes
  const saveVisible =
    activeTab !== "contacts" &&
    (isNewUser
      ? activeTab === "child"
      : activeTab === "child" ? childDirty
        : activeTab === "medical" ? medDirty
          : false);

  const saveLabel = isNewUser ? "Activate Card →" : "Save Changes";

  // ── Toast helper
  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // ── Save
  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "child") {
        await updateStudentProfile({
          student: {
            first_name: firstName,
            last_name: lastName,
            class: cls,
            section,
          },
        });

        // Onboarding completion
        if (isNewUser && firstName.trim()) {
          // fetchAndPersist already called inside updateStudentProfile
          // Just need to clear the flag and navigate
          await setIsNewUser(false);
          showToast();
          // Small delay so toast is visible before navigation
          setTimeout(() => router.replace("/(app)/home"), 1200);
          return;
        }
      } else if (activeTab === "medical") {
        await updateStudentProfile({
          emergency: {
            blood_group: bloodGroup,
            allergies,
            conditions,
            medications,
            doctor_name: doctorName,
            doctor_phone: doctorPhone,
            notes,
          },
        });
      }

      showToast();
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Contact handlers
  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      const updated = contacts.map((c) =>
        c.id === editingContact.id ? { ...c, ...data } : c,
      );
      setContacts(updated);
      updateContact?.({ ...editingContact, ...data });
    } else {
      const newContact = {
        id: `temp_${Date.now()}`,
        ...data,
        priority: contacts.length + 1,
        is_active: true,
      };
      setContacts((prev) => [...prev, newContact]);
      addContact?.(newContact);
    }
    showToast();
  };

  const handleDeleteContact = (contact) => {
    Alert.alert("Remove Contact", `Remove ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: () => {
          const updated = contacts
            .filter((c) => c.id !== contact.id)
            .map((c, i) => ({ ...c, priority: i + 1 }));
          setContacts(updated);
          deleteContact?.(contact.id);
          showToast();
        },
      },
    ]);
  };

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  return (
    <Screen bg={colors.screenBg} edges={["top", "left", "right"]}>
      <ContactModal
        visible={modalVisible}
        contact={editingContact}
        onSave={handleSaveContact}
        onClose={() => setModalVisible(false)}
      />

      {/* ── HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {student?.first_name && student.first_name !== "Student"
              ? `${student.first_name}'s Card`
              : "Update Card"}
          </Text>
          <Text style={styles.headerSub}>
            {isNewUser
              ? "Complete your child's profile to activate the card"
              : "Changes save instantly · no approvals needed"}
          </Text>
        </View>
        <SaveToast visible={toastVisible} />
      </View>

      {/* ── ONBOARDING BANNER */}
      {isNewUser && <OnboardingBanner />}

      {/* ── TABS */}
      <TabBar active={activeTab} onChange={setActiveTab} dirtyTabs={dirtyTabs} />

      {/* ── CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ CHILD TAB ══ */}
        {activeTab === "child" && (
          <View style={styles.tabContent}>
            <Section emoji="📷" title="Profile Photo" subtitle="Helps emergency responders identify your child">
              <PhotoRow photoUrl={student?.photo_url} onPress={() => { }} />
            </Section>
            <Section emoji="👤" title="Name">
              <FieldRow>
                <View style={{ flex: 1 }}>
                  <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Aanya" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Sharma" />
                </View>
              </FieldRow>
            </Section>
            <Section emoji="🏫" title="Class & Section">
              <FieldRow>
                <View style={{ flex: 1 }}>
                  <Field label="Class" value={cls} onChangeText={setCls} placeholder="e.g. 6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Section" value={section} onChangeText={setSection} placeholder="e.g. A" />
                </View>
              </FieldRow>
            </Section>
          </View>
        )}

        {/* ══ MEDICAL TAB ══ */}
        {activeTab === "medical" && (
          <View style={styles.tabContent}>
            <Section emoji="🩸" title="Blood Group" subtitle="Shown immediately when card is scanned">
              <BloodPicker value={bloodGroup} onChange={setBloodGroup} />
            </Section>
            <Section emoji="⚠️" title="Allergies" subtitle="Food, medication, environmental">
              <Field label="Known Allergies" value={allergies} onChangeText={setAllergies} placeholder="e.g. Peanuts, Penicillin…" multiline hint="Separate with commas" />
            </Section>
            <Section emoji="🫁" title="Medical Conditions">
              <Field label="Conditions" value={conditions} onChangeText={setConditions} placeholder="e.g. Asthma, Diabetes…" multiline />
            </Section>
            <Section emoji="💊" title="Medications" subtitle="Include dosage if possible">
              <Field label="Current Medications" value={medications} onChangeText={setMedications} placeholder="e.g. Salbutamol inhaler…" multiline />
            </Section>
            <Section emoji="👨‍⚕️" title="Family Doctor">
              <FieldRow>
                <View style={{ flex: 1 }}>
                  <Field label="Doctor's Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Full Name" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Phone" value={doctorPhone} onChangeText={setDoctorPhone} placeholder="+91 …" keyboardType="phone-pad" />
                </View>
              </FieldRow>
            </Section>
            <Section emoji="📝" title="Notes for Responders" subtitle="Shown on card when scanned">
              <Field label="Special Instructions" value={notes} onChangeText={setNotes} placeholder="e.g. Carries inhaler. Do NOT give nuts." multiline />
            </Section>
          </View>
        )}

        {/* ══ CONTACTS TAB ══ */}
        {activeTab === "contacts" && (
          <View style={styles.tabContent}>
            <View style={styles.callOrderCard}>
              <Text style={styles.callOrderTitle}>How emergency calls work</Text>
              <View style={styles.callOrderList}>
                {[
                  "#1 called immediately when card is scanned",
                  "#2 called if #1 doesn't answer",
                  "#3 and beyond as backup",
                ].map((step, i) => (
                  <View key={i} style={styles.callOrderItem}>
                    <View style={[styles.callOrderDot, { backgroundColor: PRIORITY_COLORS[i] }]} />
                    <Text style={styles.callOrderText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            {sortedContacts.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>📵</Text>
                <Text style={styles.emptyTitle}>No contacts yet</Text>
                <Text style={styles.emptySub}>
                  Add at least one contact — they'll be called the moment the card is scanned.
                </Text>
              </View>
            ) : (
              <View style={styles.contactList}>
                {sortedContacts.map((c, i) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    index={i}
                    onEdit={(contact) => { setEditingContact(contact); setModalVisible(true); }}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </View>
            )}

            {contacts.length < 5 && (
              <TouchableOpacity
                style={styles.addContactBtn}
                onPress={() => { setEditingContact(null); setModalVisible(true); }}
                activeOpacity={0.75}
              >
                <View style={styles.addContactIcon}>
                  <Ic.Plus c={colors.white} s={18} />
                </View>
                <View>
                  <Text style={styles.addContactLabel}>Add Emergency Contact</Text>
                  <Text style={styles.addContactSub}>{contacts.length}/5 contacts</Text>
                </View>
              </TouchableOpacity>
            )}

            <Note>⚡ Contact changes are live instantly on your child's card.</Note>
          </View>
        )}

        <View style={{ height: saveVisible ? 80 : 24 }} />
      </ScrollView>

      {/* ── SAVE BAR */}
      <SaveButton
        visible={saveVisible}
        saving={saving}
        onPress={handleSave}
        label={saveLabel}
      />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Onboarding banner
  onboardingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    backgroundColor: "#ECFDF5",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing[3.5],
  },
  onboardingEmoji: { fontSize: 22, marginTop: 2 },
  onboardingTitle: {
    ...typography.labelLg,
    color: "#059669",
    fontWeight: "700",
  },
  onboardingSubtitle: {
    ...typography.labelXs,
    color: "#059669",
    marginTop: 2,
    lineHeight: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  headerSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2 },

  // Toast
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderRadius: radius.chipFull,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  toastDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  toastText: { ...typography.labelXs, color: "#10B981", fontWeight: "700" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.screenH,
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1.5],
    paddingVertical: spacing[2.5],
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: "relative",
  },
  tabItemActive: { backgroundColor: colors.primaryBg, borderColor: `${colors.primary}50` },
  tabIcon: { fontSize: 13 },
  tabLabel: { ...typography.labelSm, color: colors.textTertiary, fontWeight: "600" },
  tabLabelActive: { color: colors.primary },
  tabDirtyDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  // Scroll
  scroll: { paddingHorizontal: spacing.screenH },
  tabContent: { gap: spacing[4] },

  // Section
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3.5],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: "700" },
  sectionSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 1 },
  sectionBody: { padding: spacing[4], gap: spacing[3] },

  // Field
  field: { gap: spacing[1.5] },
  fieldLabel: { ...typography.labelXs, color: colors.textTertiary, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", fontSize: 10 },
  fieldBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.screenBg,
  },
  fieldInput: { ...typography.bodyMd, color: colors.textPrimary, height: 42, paddingVertical: 0 },
  fieldInputMulti: { height: 80, paddingTop: spacing[2.5], paddingBottom: spacing[2], textAlignVertical: "top" },
  fieldHint: { ...typography.labelXs, color: colors.textTertiary, fontStyle: "italic" },
  fieldRow: { flexDirection: "row", gap: spacing[2] },

  // Blood picker
  bloodWrap: { gap: spacing[2.5] },
  bloodRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  bloodChip: {
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.screenBg,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
    position: "relative",
  },
  bloodChipSel: { backgroundColor: "rgba(232,52,42,0.07)", borderColor: colors.primary, borderWidth: 2 },
  bloodChipText: { ...typography.labelMd, color: colors.textSecondary, fontWeight: "700" },
  bloodChipTextSel: { color: colors.primary },
  bloodDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  bloodWarning: { ...typography.labelXs, color: colors.warning, fontWeight: "600" },

  // Photo row
  photoRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  photoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: { ...typography.labelLg, color: colors.textPrimary, fontWeight: "700" },
  photoSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2, lineHeight: 16 },

  // Contact card
  contactList: { gap: spacing[2] },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing[3.5],
  },
  contactPriority: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contactPriorityText: { ...typography.labelLg, fontWeight: "900" },
  contactTop: { flexDirection: "row", alignItems: "center", gap: spacing[2], flexWrap: "wrap" },
  contactName: { ...typography.labelLg, color: colors.textPrimary, fontWeight: "700" },
  contactBadge: { borderRadius: radius.chipFull, borderWidth: 1, paddingHorizontal: spacing[1.5], paddingVertical: 2 },
  contactBadgeText: { ...typography.labelXs, fontWeight: "700", fontSize: 9 },
  contactMeta: { ...typography.labelXs, color: colors.textTertiary, marginTop: 3 },
  contactActions: { flexDirection: "row", gap: spacing[1.5] },
  contactBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.surface3, alignItems: "center", justifyContent: "center" },
  contactBtnRed: { backgroundColor: colors.primaryBg },

  // Call order card
  callOrderCard: { backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1.5, borderColor: colors.border, padding: spacing[4], gap: spacing[3] },
  callOrderTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: "700" },
  callOrderList: { gap: spacing[2] },
  callOrderItem: { flexDirection: "row", alignItems: "center", gap: spacing[2.5] },
  callOrderDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  callOrderText: { ...typography.bodyMd, color: colors.textSecondary },

  // Add contact button
  addContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.cardSm,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: `${colors.primary}40`,
    backgroundColor: colors.surface,
  },
  addContactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addContactLabel: { ...typography.labelLg, color: colors.primary, fontWeight: "700" },
  addContactSub: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2 },

  // Empty contacts
  emptyWrap: { backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border, padding: spacing[8], alignItems: "center", gap: spacing[2] },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { ...typography.labelLg, color: colors.textPrimary, fontWeight: "700" },
  emptySub: { ...typography.bodySm, color: colors.textTertiary, textAlign: "center", lineHeight: 18 },

  // Note
  note: { backgroundColor: "#ECFDF5", borderRadius: radius.cardSm, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", padding: spacing[3.5] },
  noteText: { ...typography.bodySm, color: "#059669", lineHeight: 18 },

  // Save bar
  saveBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: radius.btn,
    paddingVertical: spacing[4],
  },
  saveBtnBusy: { opacity: 0.6 },
  saveBtnText: { ...typography.btnMd, color: colors.white, fontWeight: "700" },

  // Contact modal / sheet
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    padding: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  sheetHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing[1] },
  sheetTitle: { ...typography.h4, color: colors.textPrimary },
  sheetSub: { ...typography.bodySm, color: colors.textTertiary },
  sheetFields: { gap: spacing[2] },
  sheetSaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], backgroundColor: colors.primary, borderRadius: radius.btn, paddingVertical: spacing[4], marginTop: spacing[1] },
  sheetSaveBtnText: { ...typography.btnMd, color: colors.white, fontWeight: "700" },
});