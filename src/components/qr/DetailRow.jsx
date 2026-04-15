// src/components/qr/DetailRow.jsx
import { StyleSheet, Text, View } from 'react-native';

export function DetailRow({ label, value, valueColor, last, C }) {
    return (
        <View style={[s.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
            <Text style={[s.detailLabel, { color: C.tx3 }]}>{label}</Text>
            <Text style={[s.detailValue, { color: valueColor ?? C.tx }]} numberOfLines={1}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, paddingVertical: 14 },
    detailLabel: { fontSize: 14, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: '700', maxWidth: '58%', textAlign: 'right' },
});