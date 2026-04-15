import { View, Text } from 'react-native';
import { LockIcon } from './icons';
import { useTheme } from '@/providers/ThemeProvider';
import { styles } from '@/styles/visibility.style';

export default function FieldRow({ label, visible }) {
  const { colors: C } = useTheme();
  return (
    <View style={styles.fieldRow}>
      <View
        style={[
          styles.fieldDot,
          {
            backgroundColor: visible ? C.ok : C.s5,
            borderWidth: visible ? 0 : 1,
            borderColor: C.bd,
          },
        ]}
      />
      <Text style={[styles.fieldLabel, { color: visible ? C.tx2 : C.tx3 }]}>{label}</Text>
      {!visible && <LockIcon color={C.tx3} />}
    </View>
  );
}