// src/components/home/QuickActions.jsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function QuickActions({ onShowQR, onEditProfile, onScanHistory, C }) {
    const { t } = useTranslation();
    const actions = [
        { icon: 'qrcode-scan', label: t('home.showQR'), onPress: onShowQR, color: C.primary, bg: C.primaryBg },
        { icon: 'edit-2', label: t('home.editProfile'), onPress: onEditProfile, color: C.blue, bg: C.blueBg },
        { icon: 'activity', label: t('home.scanLogs'), onPress: onScanHistory, color: C.tx2, bg: C.s4 },
    ];

    return (
        <View style={styles.quickRow}>
            {actions.map((a, i) => (
                <TouchableOpacity key={i} style={[styles.quickCard, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={a.onPress}>
                    <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                        <Feather name={a.icon} size={22} color={a.color} />
                    </View>
                    <Text style={[styles.quickLabel, { color: C.tx }]}>{a.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    quickRow: { flexDirection: 'row', gap: 10 },
    quickCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
    quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { fontSize: 12, fontWeight: '600' },
});