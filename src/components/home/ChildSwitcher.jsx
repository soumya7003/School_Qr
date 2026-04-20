// src/components/home/ChildSwitcher.jsx
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export function ChildSwitcher({ students, activeStudentId, onSelect, C }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
            {students.map((s) => (
                <TouchableOpacity
                    key={s.id}
                    style={[
                        styles.childCard,
                        {
                            backgroundColor: s.id === activeStudentId ? C.primaryBg : C.s2,
                            borderColor: s.id === activeStudentId ? C.primaryBd : C.bd,
                        }
                    ]}
                    onPress={() => onSelect(s.id)}
                >
                    <Text style={[styles.childInitial, { color: s.id === activeStudentId ? C.primary : C.tx }]}>
                        {s.first_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                    <Text style={[styles.childName, { color: s.id === activeStudentId ? C.primary : C.tx }]} numberOfLines={1}>
                        {s.first_name || 'Child'}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    childScroll: { flexDirection: 'row', marginVertical: 4 },
    childCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
    childInitial: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', fontSize: 14, fontWeight: '700', marginRight: 8 },
    childName: { fontSize: 13, fontWeight: '600' },
});