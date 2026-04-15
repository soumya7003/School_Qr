import { ScrollView, View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import Screen from '@/components/common/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/features/profile/profile.store';
import { useProfileForm } from '@/features/profile/hooks';
import { PhotoUpload, BloodPicker } from '@/components/profile';
import { addChildStyles as styles } from '@/styles/add-child.style';
import { useRouter } from 'expo-router';

export default function AddChildScreen() {
  const { colors: C } = useTheme();
  const router = useRouter();
  const addStudent = useProfileStore((s) => s.addStudent);
  const { form, updateField } = useProfileForm();

  const handleSave = async () => {
    if (!form.first_name.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    const payload = {
      ...form,
      emergency: {
        blood_group: form.blood_group,
        allergies: form.allergies,
        conditions: form.conditions,
        medications: form.medications,
        doctor_name: form.doctor_name,
        doctor_phone: form.doctor_phone,
        notes: form.notes,
        contacts: [],
      },
    };
    await addStudent(payload);
    router.back();
  };

  return (
    <Screen bg={C.bg}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: C.tx }]}>Add New Child</Text>
        <Text style={[styles.subtitle, { color: C.tx3 }]}>Enter basic details to get started</Text>

        <PhotoUpload photoUrl={form.photo_url} onPhotoSelected={(uri) => updateField('photo_url', uri)} />
        <TextInput style={[styles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]} placeholder="First Name" value={form.first_name} onChangeText={(v) => updateField('first_name', v)} />
        <TextInput style={[styles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]} placeholder="Last Name" value={form.last_name} onChangeText={(v) => updateField('last_name', v)} />
        <TextInput style={[styles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]} placeholder="Class" value={form.class} onChangeText={(v) => updateField('class', v)} />
        <TextInput style={[styles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]} placeholder="Section" value={form.section} onChangeText={(v) => updateField('section', v)} />

        <Text style={{ color: C.tx2, marginBottom: 8 }}>Blood Group (optional)</Text>
        <BloodPicker value={form.blood_group} onChange={(v) => updateField('blood_group', v)} />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleSave}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Create Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}