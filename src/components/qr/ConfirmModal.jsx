// src/components/qr/ConfirmModal.jsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export function ConfirmModal({ visible, title, body, confirmLabel, confirmColor, onConfirm, onCancel, icon, warning, C }) {
    const { t } = useTranslation();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.overlay} onPress={onCancel}>
                <Animated.View entering={FadeInUp.duration(260)} style={[s.modalSheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
                    <View style={[s.modalIconBox, { backgroundColor: confirmColor + '18' }]}>{icon}</View>
                    <Text style={[s.modalTitle, { color: C.tx }]}>{title}</Text>
                    <Text style={[s.modalBody, { color: C.tx2 }]}>{body}</Text>
                    {warning && (
                        <View style={[s.modalWarn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                            <Feather name="alert-triangle" size={13} color={C.amb} />
                            <Text style={[s.modalWarnTx, { color: C.amb }]}>{warning}</Text>
                        </View>
                    )}
                    <View style={s.modalBtns}>
                        <TouchableOpacity
                            style={[s.modalCancelBtn, { backgroundColor: C.s3, borderColor: C.bd }]}
                            onPress={onCancel}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.modalCancelTx, { color: C.tx2 }]}>{t('qr.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.modalConfirmBtn, { backgroundColor: confirmColor }]}
                            onPress={onConfirm}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalConfirmTx}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalSheet: {
        borderRadius: 26,
        borderWidth: 1,
        padding: 28,
        width: '100%',
        gap: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.45, shadowRadius: 40 },
            android: { elevation: 24 }
        })
    },
    modalIconBox: { width: 66, height: 66, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
    modalBody: { fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
    modalWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, borderWidth: 1, padding: 13, width: '100%' },
    modalWarnTx: { fontSize: 12.5, flex: 1, lineHeight: 18 },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
    modalCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
    modalCancelTx: { fontSize: 15, fontWeight: '700' },
    modalConfirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    modalConfirmTx: { fontSize: 15, fontWeight: '800', color: '#fff' },
});