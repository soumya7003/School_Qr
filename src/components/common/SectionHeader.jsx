<<<<<<< HEAD
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
=======
// src/components/common/SectionHeader.jsx
import { colors } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';

export const SectionHeader = ({
    title,
    accent = colors.primary,
    subtitle,
    rightElement
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <View style={[styles.dot, { backgroundColor: accent }]} />
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textTertiary,
        marginLeft: 4,
    },
    rightElement: {
        marginLeft: 8,
    },
>>>>>>> a61112b7c51b11c853f8aac9f5c110140f83677c
});