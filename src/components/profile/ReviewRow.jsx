// src/components/profile/ReviewRow.jsx
import { StyleSheet, Text, View } from 'react-native';

export function ReviewRow({ label, value, required, C }) {
    const empty = !value || value === 'Not set' || value === 'None';

    return (
        <View style={[styles.row, { borderBottomColor: C.bd }]}>
            <Text style={[styles.label, { color: C.tx3 }]}>{label}</Text>
            <View style={{ flex: 2, alignItems: 'flex-end' }}>
                {empty && required ? (
                    <View style={[styles.missingChip, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Text style={[styles.missingText, { color: C.red }]}>Missing</Text>
                    </View>
                ) : (
                    <Text style={[styles.value, { color: empty ? C.tx3 : C.tx }, empty && styles.empty]}>
                        {value || '—'}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1 },
    label: { fontSize: 12, flex: 1, fontWeight: '600' },
    value: { fontSize: 13, textAlign: 'right', fontWeight: '600' },
    empty: { fontStyle: 'italic', fontWeight: '400' },
    missingChip: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
    missingText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});