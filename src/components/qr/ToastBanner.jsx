// src/components/qr/ToastBanner.jsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function ToastBanner({ action, C }) {
    const { t } = useTranslation();

    const map = {
        blocked: { label: t('qr.toastBlocked'), color: C.primary, bg: C.primaryBg, bd: C.primaryBd, icon: 'lock' },
        unblocked: { label: t('qr.toastUnblocked'), color: C.ok, bg: C.okBg, bd: C.okBd, icon: 'unlock' },
        revoked: { label: t('qr.toastRevoked'), color: C.red, bg: C.redBg, bd: C.redBd, icon: 'alert-triangle' },
        activated: { label: t('qr.toastActivated'), color: C.ok, bg: C.okBg, bd: C.okBd, icon: 'zap' },
    };

    const toast = map[action];
    if (!toast) return null;

    return (
        <Animated.View entering={FadeInDown.duration(280)} style={[s.toast, { backgroundColor: toast.bg, borderColor: toast.bd }]}>
            <View style={[s.toastIcon, { backgroundColor: toast.color + '20' }]}>
                <Feather name={toast.icon} size={13} color={toast.color} />
            </View>
            <Text style={[s.toastTx, { color: toast.color }]}>{toast.label}</Text>
        </Animated.View>
    );
}

const s = StyleSheet.create({
    toast: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, borderWidth: 1, padding: 13 },
    toastIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    toastTx: { fontSize: 13.5, fontWeight: '700', flex: 1 },
});