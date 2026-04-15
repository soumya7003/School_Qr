import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/features/profile/profile.store';
import NotionAvatar from '../common/NotionAvatar';

export default function ParentHeader() {
  const { colors: C } = useTheme();
  const parentName = useProfileStore((s) => s.user?.name) || 'Parent';

  return (
    <View style={[styles.container, { borderBottomColor: C.bd }]}>
      <NotionAvatar name={parentName} size={52} />
      <View style={styles.textWrap}>
        <Text style={[styles.greeting, { color: C.tx3 }]}>Welcome back,</Text>
        <Text style={[styles.name, { color: C.tx }]}>{parentName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  textWrap: { flex: 1 },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800', marginTop: 2 },
});