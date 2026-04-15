import { StyleSheet } from 'react-native';
import { spacing } from '@/theme';

export const addChildStyles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
});