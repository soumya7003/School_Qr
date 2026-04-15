// src/components/profile/BloodPicker.jsx
import { BLOOD_GROUPS } from '@/constants/profile';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function BloodPicker({ value, onChange, C }) {
    return (
        <View style={{ gap: 10 }}>
            <View style={styles.grid}>
                {BLOOD_GROUPS.map((bg) => {
                    const sel = value === bg;
                    return (
                        <TouchableOpacity
                            key={bg}
                            style={[
                                styles.chip,
                                { borderColor: C.bd2, backgroundColor: C.s3 },
                                sel && { borderColor: C.primaryBd, backgroundColor: C.primaryBg }
                            ]}
                            onPress={() => onChange(bg)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.text, { color: sel ? C.primary : C.tx2 }]}>{bg}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {!value && (
                <View style={[styles.warn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                    <Text style={[styles.warnText, { color: C.amb }]}>
                        ⚠️  Tap a blood group above. This is shown to first responders.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1,
        minWidth: 54, alignItems: 'center', justifyContent: 'center'
    },
    text: { fontSize: 13, fontWeight: '700' },
    warn: { borderRadius: 8, borderWidth: 1, padding: 10 },
    warnText: { fontSize: 12, fontWeight: '600' },
});