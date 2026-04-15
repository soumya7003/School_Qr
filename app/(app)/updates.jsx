// app/(app)/updates.jsx - FIXED
import Screen from '@/components/common/Screen';
import {
  BloodPicker,
  ChevLeft,
  ContactCard,
  ContactModal,
  Field,
  InstructionBanner,
  NavFooter,
  PhotoUpload,
  PlusSvg,
  ProgressBar,
  ReviewRow,
  SectionCard,
  StepBar,
} from '@/components/profile/profile.index';
import { BLOOD_GROUP_TO_ENUM, PRIORITY_COLORS } from '@/constants/profile';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useContactManagement,
  usePhotoUpload,
  useProfileForm,
  useProfileSteps
} from '@/features/profile/hooks/profile.hooks.index';
import { useProfileStore } from '@/features/profile/profile.store';
import { useBiometricStore } from '@/store/biometricStore'; // ← NEW
import { useTheme } from '@/providers/ThemeProvider';
import { updatesStyles as s } from '@/styles/updates.style';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

// Camera icon inline
const CameraIcon = ({ c, s = 20 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8} />
  </Svg>
);

export default function UpdatesScreen() {
  const { colors: C } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const students = useProfileStore((s) => s.students);
  const isHydrated = useProfileStore((s) => s.isHydrated);

  const student = useProfileStore(
    useShallow((s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null)
  );

  const {
    firstName, setFirstName, lastName, setLastName, cls, setCls, section, setSection,
    profileImage, setProfileImage, bloodGroup, setBloodGroup, allergies, setAllergies,
    conditions, setConditions, medications, setMedications, doctorName, setDoctorName,
    doctorPhone, setDoctorPhone, notes, setNotes, sortedContacts, canProceed, setContacts,
  } = useProfileForm(student);

  const { uploading, uploadPhotoToCloudflare, getPhotoUrl } = usePhotoUpload(student?.id);
  const {
    contacts, modalVisible, setModalVisible, editingContact,
    handleSaveContact, handleDeleteContact, openAddModal, openEditModal,
  } = useContactManagement(sortedContacts);

  const {
    step, completed, goNext, goBack, markAllCompleted,
  } = useProfileSteps(0);

  const scrollRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Sync contacts
  useEffect(() => { setContacts(contacts); }, [contacts]);

  // Redirect if no children
  useEffect(() => {
    if (isHydrated && !isNewUser && students.length === 0) {
      Alert.alert('No Children Linked', 'Please add a child from Settings to continue.', [
        { text: 'Go to Settings', onPress: () => router.replace('/settings') }
      ]);
    }
  }, [students.length, isHydrated, isNewUser]);

  // Block Android back during onboarding
  useEffect(() => {
    if (!isNewUser) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) { goBack(); return true; }
      Alert.alert('Complete Profile First', 'You need to add your child\'s details before you can use RESQID.', [{ text: 'OK' }]);
      return true;
    });
    return () => sub.remove();
  }, [isNewUser, step]);

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); }, [step]);

  const handleNext = () => {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Name Required', "Please enter your child's first and last name to continue.");
      return;
    }
    if (step < 3) {
      goNext(() => true);
    } else {
      handleSubmitAll();
    }
  };

  const handleSubmitAll = async () => {
    if (!student) {
      Alert.alert('Error', 'No student selected');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = student?.photo_url;
      if (profileImage && profileImage.startsWith('file://')) {
        finalPhotoUrl = await uploadPhotoToCloudflare(profileImage);
      }

      const payload = {
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class: cls.trim(),
          section: section.trim(),
          photo_url: finalPhotoUrl,
        },
        emergency: {
          blood_group: (BLOOD_GROUP_TO_ENUM[bloodGroup] ?? bloodGroup) || undefined,
          allergies: allergies.trim(),
          conditions: conditions.trim(),
          medications: medications.trim(),
          doctor_name: doctorName.trim(),
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
      };

      await patchStudent(student.id, payload);
      markAllCompleted();

      if (isNewUser) {
        await setIsNewUser(false);
        fetchAndPersist?.().catch(() => { });
      } else {
        Alert.alert('Profile Updated ✓', "Your child's information has been saved.");
      }
    } catch (err) {
      Alert.alert('Save Failed', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = isNewUser ? 'Complete Your Profile' : student?.first_name ? `Edit ${student.first_name}'s Profile` : 'Edit Profile';
  const classLabel = cls && section ? `Class ${cls} · ${section}` : cls ? `Class ${cls}` : 'No class set';
  const nextLabel = step === 3 ? (isNewUser ? 'Activate Card' : 'Save Changes') : 'Continue';

  // Empty state guard
  if (!student && !isNewUser && students.length === 0) {
    return (
      <Screen bg={C.bg} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: C.tx }}>No Children Linked</Text>
          <Text style={{ textAlign: 'center', color: C.tx3, marginBottom: 20 }}>
            Please add a child from Settings to continue.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => router.replace('/(app)/settings')}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  if (!student && !isNewUser && students.length > 0) {
    return (
      <Screen bg={C.bg} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 16, color: C.tx3 }}>Loading profile...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ContactModal visible={modalVisible} contact={editingContact} onSave={handleSaveContact} onClose={() => setModalVisible(false)} C={C} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={[s.header, { borderBottomColor: C.bd }]}>
          {(!isNewUser || step > 0) ? (
            <TouchableOpacity onPress={isNewUser ? goBack : router.back} style={s.backBtn}>
              <ChevLeft c={C.tx} s={20} />
            </TouchableOpacity>
          ) : <View style={s.backBtn} />}
          <Text style={[s.headerTitle, { color: C.tx }]}>{headerTitle}</Text>
          {isNewUser ? (
            <View style={[s.badge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
              <View style={[s.badgeDot, { backgroundColor: C.primary }]} />
              <Text style={[s.badgeText, { color: C.primary }]}>Setup</Text>
            </View>
          ) : <View style={s.backBtn} />}
        </View>
        {isNewUser && <ProgressBar currentStep={step} C={C} />}
        <StepBar current={step} completed={completed} C={C} />
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <InstructionBanner currentStep={step} isNewUser={isNewUser} C={C} />
          <View>
            {step === 0 && (
              <View style={s.stepContent}>
                <SectionCard icon={<CameraIcon c={C.primary} s={16} />} title="Profile Photo" subtitle="Optional but recommended — helps identify your child" C={C}>
                  <PhotoUpload imageUri={profileImage} onImageChange={setProfileImage} uploading={uploading || saving} C={C} />
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>👤</Text>} title="Child's Name" subtitle="Required — match the name on school records" C={C}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="e.g., Arjun" required C={C} /></View>
                    <View style={{ flex: 1 }}><Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="e.g., Sharma" required C={C} /></View>
                  </View>
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>🏫</Text>} title="Class & Section" subtitle="Optional — helps identify your child quickly" accent={C.blue} C={C}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><Field label="Class" value={cls} onChangeText={setCls} placeholder="e.g., 6" C={C} /></View>
                    <View style={{ flex: 1 }}><Field label="Section" value={section} onChangeText={setSection} placeholder="e.g., B" C={C} /></View>
                  </View>
                </SectionCard>
              </View>
            )}
            {step === 1 && (
              <View style={s.stepContent}>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>🩸</Text>} title="Blood Group" subtitle="Critical for emergency response" C={C}>
                  <BloodPicker value={bloodGroup} onChange={setBloodGroup} C={C} />
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>⚠️</Text>} title="Allergies" accent={C.amb} C={C}>
                  <Field label="Known Allergies" value={allergies} onChangeText={setAllergies} placeholder="e.g., Peanuts, Penicillin" multiline C={C} />
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>🫁</Text>} title="Medical Conditions" accent={C.blue} C={C}>
                  <Field label="Conditions" value={conditions} onChangeText={setConditions} placeholder="e.g., Asthma, Diabetes" multiline C={C} />
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>💊</Text>} title="Medications" accent={C.blue} C={C}>
                  <Field label="Current Medications" value={medications} onChangeText={setMedications} placeholder="e.g., Ventolin Inhaler" multiline C={C} />
                </SectionCard>
                <SectionCard icon={<Text style={{ fontSize: 15 }}>👨‍⚕️</Text>} title="Family Doctor" accent={C.ok} C={C}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}><Field label="Doctor Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Name" C={C} /></View>
                    <View style={{ flex: 1 }}><Field label="Doctor's Phone" value={doctorPhone} onChangeText={setDoctorPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" C={C} /></View>
                  </View>
                </SectionCard>
              </View>
            )}
            {step === 2 && (
              <View style={s.stepContent}>
                <View style={[s.callInfoBox, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={[s.callInfoTitle, { color: C.tx }]}>How Emergency Calls Work</Text>
                  {PRIORITY_COLORS.slice(0, 3).map((color, i) => (
                    <View key={i} style={s.callInfoRow}>
                      <View style={[s.callInfoDot, { backgroundColor: color }]} />
                      <Text style={[s.callInfoText, { color: C.tx2 }]}>Priority {i + 1} — Called {i === 0 ? 'first' : i === 1 ? 'if #1 does not answer' : 'backup contact'}</Text>
                    </View>
                  ))}
                </View>
                {contacts.length === 0 ? (
                  <View style={[s.emptyContacts, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Text style={{ fontSize: 32 }}>📵</Text>
                    <Text style={[s.emptyTitle, { color: C.tx }]}>No Emergency Contacts Added</Text>
                    <TouchableOpacity style={[s.emptyAddBtn, { backgroundColor: C.primary }]} onPress={openAddModal}>
                      <PlusSvg c="#fff" s={16} />
                      <Text style={s.emptyAddBtnText}>Add First Contact</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {contacts.map((c, i) => (
                      <ContactCard key={c.id ?? `contact_${i}`} contact={c} index={i} onEdit={openEditModal} onDelete={handleDeleteContact} C={C} />
                    ))}
                  </View>
                )}
                {contacts.length > 0 && contacts.length < 5 && (
                  <TouchableOpacity style={[s.addBtn, { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]} onPress={openAddModal}>
                    <View style={[s.addBtnIcon, { backgroundColor: C.primary }]}><PlusSvg c="#fff" s={18} /></View>
                    <View><Text style={[s.addBtnLabel, { color: C.primary }]}>Add Another Contact</Text></View>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {step === 3 && (
              <View style={s.stepContent}>
                <View style={[s.reviewHeader, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={s.reviewAvatarImg} />
                  ) : (
                    <View style={[s.reviewAvatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                      <Text style={[s.reviewAvatarText, { color: C.primary }]}>{firstName[0]?.toUpperCase() || '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reviewName, { color: C.tx }]}>{`${firstName} ${lastName}`.trim()}</Text>
                    <Text style={[s.reviewClass, { color: C.tx3 }]}>{classLabel}</Text>
                  </View>
                </View>
                <SectionCard icon={<Text>👤</Text>} title="Student Information" C={C}>
                  <ReviewRow label="First Name" value={firstName} required C={C} />
                  <ReviewRow label="Last Name" value={lastName} required C={C} />
                </SectionCard>
                <SectionCard icon={<Text>❤️</Text>} title="Medical Information" C={C}>
                  <ReviewRow label="Blood Group" value={bloodGroup} C={C} />
                  <ReviewRow label="Allergies" value={allergies || 'None'} C={C} />
                </SectionCard>
                <SectionCard icon={<Text>📞</Text>} title={`Emergency Contacts (${contacts.length})`} C={C}>
                  {contacts.map((c, i) => (
                    <ReviewRow key={c.id ?? i} label={`#${c.priority} ${c.relationship || 'Contact'}`} value={`${c.name} · ${c.phone}`} C={C} />
                  ))}
                </SectionCard>
              </View>
            )}
          </View>
        </ScrollView>
        <NavFooter step={step} isNewUser={isNewUser} onBack={goBack} onNext={handleNext} nextLabel={nextLabel} saving={saving || uploading} canProceed={canProceed} C={C} />
      </KeyboardAvoidingView>
    </Screen>
  );
}