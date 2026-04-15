import { View, Text, StyleSheet } from 'react-native';

export const SectionHeader = ({ title, accent, style }) => (
  <View style={[styles.container, style]}>
    <View style={[styles.dot, { backgroundColor: accent }]} />
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});