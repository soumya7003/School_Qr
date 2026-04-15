// src/components/profile/SectionCard.jsx
import { StyleSheet, Text, View } from 'react-native';

export function SectionCard({ icon, title, subtitle, children, accent, C }) {
    const ac = accent ?? C.primary;

    return (
        <View style={[styles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[styles.head, { borderLeftColor: ac, borderBottomColor: C.bd }]}>
                <View style={[styles.iconWrap, { backgroundColor: ac + '12', borderColor: ac + '30' }]}>
                    {icon}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: C.tx }]}>{title}</Text>
                    {subtitle && <Text style={[styles.sub, { color: C.tx3 }]}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.body}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    head: {
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
        paddingVertical: 14, borderBottomWidth: 1, borderLeftWidth: 3
    },
    iconWrap: {
        width: 34, height: 34, borderRadius: 9, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center'
    },
    title: { fontSize: 13.5, fontWeight: '700' },
    sub: { fontSize: 11, marginTop: 1 },
    body: { padding: 16, gap: 14 },
});