// src/components/qr/CardTabs.jsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function CardTabs({ isFlipped, onFlip, C }) {
    const { t } = useTranslation();

    return (
        <View style={[s.tabRow, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {[
                { label: t('qr.cardFront'), icon: 'credit-card-outline', active: !isFlipped, onPress: () => isFlipped && onFlip() },
                { label: t('qr.qrCode'), icon: 'qrcode-scan', active: isFlipped, onPress: () => !isFlipped && onFlip() },
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.label}
                    style={[s.tab, tab.active && { backgroundColor: C.s4, borderWidth: 1, borderColor: C.bd2 }]}
                    onPress={tab.onPress}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons name={tab.icon} size={13} color={tab.active ? C.tx : C.tx3} />
                    <Text style={[s.tabTx, { color: tab.active ? C.tx : C.tx3, fontWeight: tab.active ? '800' : '600' }]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    tabRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
    tabTx: { fontSize: 13 },
});