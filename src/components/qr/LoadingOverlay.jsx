// src/components/qr/LoadingOverlay.jsx
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export function LoadingOverlay({ visible, C }) {
    const { t } = useTranslation();
    if (!visible) return null;

    return (
        <Animated.View entering={FadeIn.duration(150)} style={[s.loadingOverlay, { backgroundColor: C.bg + 'CC' }]}>
            <View style={[s.loadingBox, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
                <Text style={[s.loadingTx, { color: C.tx2 }]}>{t('common.loading')}</Text>
            </View>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    loadingBox: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 16 },
    loadingTx: { fontSize: 14, fontWeight: '600' },
});