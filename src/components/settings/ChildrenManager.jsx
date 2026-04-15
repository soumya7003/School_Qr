import { FlatList, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/features/profile/profile.store';
import NotionAvatar from '../common/NotionAvatar';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ChildrenManager({ onRemoveChild }) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const students = useProfileStore((s) => s.students);
  const activeStudentId = useProfileStore((s) => s.activeStudentId);
  const setActiveStudent = useProfileStore((s) => s.setActiveStudent);

  const handleRemove = (id, name) => {
    Alert.alert('Remove Child', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemoveChild({ id, name }) },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.childRow, { borderBottomColor: C.bd }]}
      onPress={() => setActiveStudent(item.id)}
      activeOpacity={0.7}
    >
      <NotionAvatar name={item.first_name} size={44} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: C.tx }]}>{item.first_name} {item.last_name}</Text>
        <Text style={[styles.class, { color: C.tx3 }]}>{item.class} – {item.section}</Text>
      </View>
      {activeStudentId === item.id && (
        <View style={[styles.activeBadge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
          <Text style={[styles.activeText, { color: C.primary }]}>Active</Text>
        </View>
      )}
      <TouchableOpacity onPress={() => handleRemove(item.id, item.first_name)} style={styles.removeBtn}>
        <Feather name="trash-2" size={18} color={C.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
        onPress={() => router.push('/add-child')}
      >
        <Feather name="plus" size={18} color={C.primary} />
        <Text style={[styles.addText, { color: C.primary }]}>Add Child</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 8 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  class: { fontSize: 12, marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  activeText: { fontSize: 10, fontWeight: '800' },
  removeBtn: { padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  addText: { fontSize: 14, fontWeight: '700' },
});