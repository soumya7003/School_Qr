// src/components/profile/ContactCard.jsx
import { PRIORITY_COLORS } from '@/constants/profile';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EditSvg, TrashSvg } from './icons/profile.icon.index';

export function ContactCard({ contact, index, onEdit, onDelete, C }) {
    const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1, delay: index * 55, useNativeDriver: true, tension: 85, friction: 8
        }).start();
    }, []);

    return (
        <Animated.View style={[
            styles.card,
            { backgroundColor: C.s3, borderColor: C.bd, transform: [{ scale: scaleAnim }] }
        ]}>
            <View style={[styles.priority, { backgroundColor: pc + '18', borderColor: pc + '35' }]}>
                <Text style={[styles.priorityNum, { color: pc }]}>{contact.priority}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.top}>
                    <Text style={[styles.name, { color: C.tx }]}>{contact.name}</Text>
                    {contact.priority === 1 && (
                        <View style={[styles.firstTag, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                            <Text style={[styles.firstTagText, { color: C.primary }]}>FIRST CALL</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.meta, { color: C.tx3 }]}>
                    {contact.relationship || 'Contact'} · {contact.phone}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: C.s4, borderColor: C.bd }]}
                    onPress={() => onEdit(contact)}
                    activeOpacity={0.7}
                >
                    <EditSvg c={C.tx2} s={12} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: C.redBg, borderColor: C.redBd }]}
                    onPress={() => onDelete(contact)}
                    activeOpacity={0.7}
                >
                    <TrashSvg c={C.red} s={12} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
    priority: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    priorityNum: { fontSize: 13, fontWeight: '900' },
    top: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    name: { fontSize: 13.5, fontWeight: '700' },
    firstTag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
    firstTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
    meta: { fontSize: 11.5, marginTop: 3 },
    actions: { flexDirection: 'row', gap: 6 },
    btn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});