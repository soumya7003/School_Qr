// src/components/qr/ActionButton.jsx
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ActionButton({ icon, label, sublabel, onPress, color, bg, border, disabled }) {
    return (
        <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: bg, borderColor: border }, disabled && s.actionBtnDim]}
            onPress={onPress}
            activeOpacity={disabled ? 1 : 0.75}
            disabled={disabled}
        >
            <View style={[s.actionBtnIcon, { backgroundColor: color + '18' }]}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[s.actionBtnLabel, { color }]}>{label}</Text>
                {sublabel ? <Text style={[s.actionBtnSub, { color }]}>{sublabel}</Text> : null}
            </View>
            <Feather name="chevron-right" size={14} color={color + '55'} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 17, borderWidth: 1, padding: 16 },
    actionBtnDim: { opacity: 0.4 },
    actionBtnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actionBtnLabel: { fontSize: 15, fontWeight: '800' },
    actionBtnSub: { fontSize: 12.5, marginTop: 3, lineHeight: 17, opacity: 0.6 },
});