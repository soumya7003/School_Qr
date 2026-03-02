/**
 * Updates Screen — Edit profile form + emergency info.
 * Matches Flow 02 (Edit Profile Form) from the UI/UX spec.
 */

import Button from '@/src/components/common/Button';
import Screen from '@/src/components/common/Screen';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────
const UserIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke={colors.textTertiary} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={12} cy={7} r={4}
      stroke={colors.textTertiary} strokeWidth={1.8} />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14"
      stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5"
      stroke={colors.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ label }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

// ── Form field ────────────────────────────────────────────────────────────────
function FormField({ label, value, onChangeText, placeholder, half, multiline }) {
  return (
    <View style={[styles.formField, half && styles.formFieldHalf]}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
      />
    </View>
  );
}

// ── Contact row ───────────────────────────────────────────────────────────────
function ContactRow({ contact }) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIcon}>
        <UserIcon />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactRel}>{contact.relationship} · {contact.phone}</Text>
      </View>
      <View style={styles.priorityBadge}>
        <Text style={styles.priorityText}>P{contact.priority}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function UpdatesScreen() {
  const { student, emergencyProfile, contacts, updateEmergencyProfile } = useProfileStore();

  const [firstName, setFirstName] = useState(student?.first_name ?? '');
  const [lastName, setLastName] = useState(student?.last_name ?? '');
  const [cls, setCls] = useState(student?.class ?? '');
  const [section, setSection] = useState(student?.section ?? '');
  const [bloodGroup, setBloodGroup] = useState(emergencyProfile?.blood_group ?? '');
  const [allergies, setAllergies] = useState(emergencyProfile?.allergies ?? '');
  const [conditions, setConditions] = useState(emergencyProfile?.conditions ?? '');
  const [medications, setMedications] = useState(emergencyProfile?.medications ?? '');
  const [doctorName, setDoctorName] = useState(emergencyProfile?.doctor_name ?? '');
  const [doctorPhone, setDoctorPhone] = useState(emergencyProfile?.doctor_phone ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateEmergencyProfile({
      blood_group: bloodGroup,
      allergies,
      conditions,
      medications,
      doctor_name: doctorName,
      doctor_phone: doctorPhone,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Edit Details</Text>
            <Text style={styles.pageSubtitle}>Changes submitted for school approval</Text>
          </View>
          <View style={styles.autoSaveChip}>
            <Text style={styles.autoSaveText}>AUTO-SAVE ON</Text>
          </View>
        </Animated.View>

        {/* Photo upload placeholder */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.photoRow}>
          <View style={styles.photoPicker}>
            <View style={styles.photoIcon}><UserIcon /></View>
            <View>
              <Text style={styles.photoTitle}>Student Photo</Text>
              <Text style={styles.photoSub}>Tap to upload from gallery</Text>
            </View>
          </View>
        </Animated.View>

        {/* Basic info */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <SectionTitle label="Basic Info" />
          <View style={styles.formGrid}>
            <FormField label="FIRST NAME" value={firstName} onChangeText={setFirstName} half />
            <FormField label="LAST NAME" value={lastName} onChangeText={setLastName} half />
            <FormField label="CLASS" value={cls} onChangeText={setCls} half />
            <FormField label="SECTION" value={section} onChangeText={setSection} half />
          </View>
        </Animated.View>

        {/* Emergency info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <SectionTitle label="Emergency Info" />
          <View style={styles.formGrid}>
            <FormField
              label="BLOOD GROUP"
              value={bloodGroup}
              onChangeText={setBloodGroup}
              placeholder="e.g. B+"
            />
            <FormField
              label="ALLERGIES"
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Peanuts, Penicillin..."
              multiline
            />
            <FormField
              label="MEDICAL CONDITIONS"
              value={conditions}
              onChangeText={setConditions}
              placeholder="e.g. Asthma, Diabetes..."
              multiline
            />
            <FormField
              label="MEDICATIONS"
              value={medications}
              onChangeText={setMedications}
              placeholder="e.g. Salbutamol inhaler..."
              multiline
            />
            <FormField label="DOCTOR NAME" value={doctorName} onChangeText={setDoctorName} half placeholder="Full name" />
            <FormField label="DOCTOR PHONE" value={doctorPhone} onChangeText={setDoctorPhone} half placeholder="+91" />
          </View>
        </Animated.View>

        {/* Emergency contacts */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <SectionTitle label="Emergency Contacts" />
          <View style={styles.contactsList}>
            {contacts.map((c) => <ContactRow key={c.id} contact={c} />)}
          </View>
          <TouchableOpacity style={styles.addContact} activeOpacity={0.7}>
            <PlusIcon />
            <Text style={styles.addContactText}>Add another contact</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Save button */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: spacing[2] }}>
          <Button
            label={saved ? '✓ Saved!' : 'Save & Continue →'}
            onPress={handleSave}
            style={saved ? { opacity: 0.8 } : {}}
          />
        </Animated.View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[5],
  },

  // ── Header ────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  autoSaveChip: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.chipFull,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  autoSaveText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 9,
  },

  // ── Photo ─────────────────────────────────────
  photoRow: {},
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `rgba(232,52,42,0.3)`,
    borderRadius: radius.cardSm,
    padding: spacing[4],
  },
  photoIcon: {
    width: 52,
    height: 52,
    backgroundColor: colors.surface3,
    borderRadius: radius.avatarLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoTitle: {
    ...typography.labelLg,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  photoSub: {
    ...typography.labelSm,
    color: colors.textTertiary,
  },

  // ── Section title ─────────────────────────────
  sectionTitle: {
    ...typography.overline,
    color: colors.primary,
    marginBottom: spacing[3],
  },

  // ── Form grid ─────────────────────────────────
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2.5],
  },
  formField: {
    width: '100%',
    gap: spacing[1.5],
  },
  formFieldHalf: {
    width: '47.5%',
  },
  formLabel: {
    ...typography.overline,
    color: colors.textTertiary,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 42,
    paddingHorizontal: spacing[3],
    color: colors.textPrimary,
    ...typography.bodySm,
  },
  formInputMulti: {
    height: 72,
    paddingTop: spacing[2.5],
    textAlignVertical: 'top',
  },

  // ── Contacts ──────────────────────────────────
  contactsList: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
  },
  contactIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    ...typography.labelLg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contactRel: {
    ...typography.labelXs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  priorityBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    ...typography.labelXs,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  addContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addContactText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
  },
});