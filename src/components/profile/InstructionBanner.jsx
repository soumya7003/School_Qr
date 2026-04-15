// src/components/profile/InstructionBanner.jsx
import { STEPS } from '@/constants/profile';
import { StyleSheet, Text, View } from 'react-native';

export function InstructionBanner({ currentStep, isNewUser, C }) {
    const meta = STEPS[currentStep]?.banner ?? STEPS[0].banner;

    return (
        <View style={[styles.wrap, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
            <View style={styles.titleRow}>
                <Text style={styles.emoji}>{meta.emoji}</Text>
                <Text style={[styles.title, { color: C.blue }]}>{meta.title}</Text>
                {isNewUser && (
                    <View style={[styles.badge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                        <Text style={[styles.badgeText, { color: C.primary }]}>REQUIRED</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.body, { color: C.tx2 }]}>{meta.body}</Text>
            <View style={styles.hintRow}>
                <View style={styles.hintCol}>
                    {meta.dos.map((d, i) => (
                        <View key={i} style={styles.hintItem}>
                            <Text style={[styles.hintDot, { color: C.ok }]}>✓</Text>
                            <Text style={[styles.hintText, { color: C.tx2 }]}>{d}</Text>
                        </View>
                    ))}
                </View>
                <View style={[styles.divider, { backgroundColor: C.bd }]} />
                <View style={styles.hintCol}>
                    {meta.donts.map((d, i) => (
                        <View key={i} style={styles.hintItem}>
                            <Text style={[styles.hintDot, { color: C.red }]}>✕</Text>
                            <Text style={[styles.hintText, { color: C.tx2 }]}>{d}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    emoji: { fontSize: 16 },
    title: { fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2, flex: 1 },
    badge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
    body: { fontSize: 12, lineHeight: 18 },
    hintRow: { flexDirection: 'row', gap: 10, paddingTop: 6 },
    hintCol: { flex: 1, gap: 5 },
    divider: { width: 1, marginVertical: 2 },
    hintItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
    hintDot: { fontSize: 11, fontWeight: '800', marginTop: 1 },
    hintText: { fontSize: 11, lineHeight: 16, flex: 1 },
});