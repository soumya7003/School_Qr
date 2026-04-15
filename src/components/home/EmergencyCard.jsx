// src/components/home/EmergencyCard.jsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function EmergencyCard({ emergency, contacts, onEdit, C }) {
    const { t } = useTranslation();
    const hasBloodGroup = emergency?.blood_group;
    const hasAllergy = emergency?.allergies;
    const topContacts = (contacts || []).slice(0, 2);

    return (
        <View style={[styles.sectionCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: C.bd }]}>
                <Feather name="heart" size={14} color={C.primary} />
                <Text style={[styles.sectionTitle, { color: C.tx3 }]}>{t('home.emergencyProfile')}</Text>
                <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
                    <Text style={[styles.editText, { color: C.primary }]}>{t('common.edit')}</Text>
                    <Feather name="chevron-right" size={12} color={C.primary} />
                </TouchableOpacity>
            </View>

            {hasBloodGroup && (
                <View style={[styles.bloodRow, { borderBottomColor: C.bd }]}>
                    <Text style={styles.bloodIcon}>🩸</Text>
                    <View>
                        <Text style={[styles.bloodLabel, { color: C.tx3 }]}>{t('updates.bloodGroup')}</Text>
                        <Text style={[styles.bloodValue, { color: C.primary }]}>{emergency.blood_group}</Text>
                    </View>
                    {hasAllergy && (
                        <View style={[styles.allergyBadge, { backgroundColor: C.ambBg }]}>
                            <Feather name="alert-triangle" size={10} color={C.amb} />
                            <Text style={[styles.allergyText, { color: C.amb }]} numberOfLines={1}>{emergency.allergies}</Text>
                        </View>
                    )}
                </View>
            )}

            {topContacts.map((c, i) => (
                <View key={c.id || i} style={[styles.contactRow, i === 0 && hasBloodGroup && { borderTopColor: C.bd }]}>
                    <View style={[styles.contactAvatar, { backgroundColor: C.primaryBg }]}>
                        <Text style={[styles.contactInitial, { color: C.primary }]}>{c.name?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.contactName, { color: C.tx }]}>{c.name}</Text>
                        <Text style={[styles.contactRelation, { color: C.tx3 }]}>{c.relationship || t('home.guardian')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.callBtn, { backgroundColor: C.okBg }]}
                        onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                        <Feather name="phone-call" size={14} color={C.ok} />
                    </TouchableOpacity>
                </View>
            ))}

            {!hasBloodGroup && contacts?.length === 0 && (
                <TouchableOpacity style={styles.emptyState} onPress={onEdit}>
                    <Feather name="alert-circle" size={20} color={C.amb} />
                    <Text style={[styles.emptyText, { color: C.amb }]}>{t('home.profileIncomplete')}</Text>
                    <Text style={[styles.emptySub, { color: C.tx3 }]}>{t('home.completeNow')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    sectionTitle: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    editText: { fontSize: 12, fontWeight: '600' },
    bloodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    bloodIcon: { fontSize: 24 },
    bloodLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    bloodValue: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
    allergyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    allergyText: { fontSize: 10, fontWeight: '600', maxWidth: 100 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    contactInitial: { fontSize: 16, fontWeight: '700' },
    contactName: { fontSize: 14, fontWeight: '600' },
    contactRelation: { fontSize: 11 },
    callBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', padding: 24, gap: 4 },
    emptyText: { fontSize: 14, fontWeight: '600' },
    emptySub: { fontSize: 12 },
});