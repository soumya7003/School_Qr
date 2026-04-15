// src/components/profile/NavFooter.jsx
import { spacing } from '@/theme';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevLeft, ChevRight } from './icons/profile.icon.index';

export function NavFooter({ step, isNewUser, onBack, onNext, nextLabel, saving, canProceed, C }) {
    const isFirst = step === 0;

    return (
        <View style={[styles.bar, { backgroundColor: C.s2, borderTopColor: C.bd }]}>
            {(!isNewUser || step > 0) ? (
                <TouchableOpacity
                    style={[styles.backBtn, { borderColor: C.bd2, backgroundColor: C.s3 }, isFirst && { opacity: 0 }]}
                    onPress={onBack} disabled={isFirst} activeOpacity={0.7}
                >
                    <ChevLeft c={C.tx2} s={16} />
                    <Text style={[styles.backText, { color: C.tx2 }]}>Back</Text>
                </TouchableOpacity>
            ) : <View style={styles.backBtn} />}
            <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: C.primary }, (saving || !canProceed) && { opacity: 0.45 }]}
                onPress={onNext} disabled={saving || !canProceed} activeOpacity={0.85}
            >
                <Text style={styles.nextText}>{saving ? 'Saving…' : nextLabel}</Text>
                {!saving && (step < 3 ? <ChevRight c="#fff" s={15} /> : <Text style={{ fontSize: 14 }}>⚡</Text>)}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH, paddingTop: 14, paddingBottom: spacing[6],
        borderTopWidth: 1, gap: 10
    },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 13,
        paddingHorizontal: 18, borderRadius: 12, borderWidth: 1
    },
    backText: { fontSize: 14, fontWeight: '600' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: 12, paddingVertical: 15
    },
    nextText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});