import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export default function RemoveChildModal({ visible, childName, onConfirm, onCancel }) {
  const { colors: C } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
          <Text style={[styles.title, { color: C.tx }]}>Remove {childName}?</Text>
          <Text style={[styles.message, { color: C.tx3 }]}>This action cannot be undone.</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, { backgroundColor: C.s4 }]} onPress={onCancel}>
              <Text style={{ color: C.tx2 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: C.redBg }]} onPress={onConfirm}>
              <Text style={{ color: C.red }}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '80%', borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  message: { fontSize: 14 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
});