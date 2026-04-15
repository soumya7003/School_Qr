// src/components/home/HeroCard.jsx
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function getTokenMeta(status, t, C) {
    switch (status) {
        case 'ACTIVE': return { label: t('home.statusActive'), color: C.ok, bg: C.okBg, pulse: true };
        case 'INACTIVE': return { label: t('home.statusInactive'), color: C.tx3, bg: C.s4, pulse: false };
        case 'ISSUED': return { label: t('home.statusIssued'), color: C.amb, bg: C.ambBg, pulse: true };
        case 'REVOKED': return { label: t('home.statusRevoked'), color: C.red, bg: C.redBg, pulse: false };
        case 'EXPIRED': return { label: t('home.statusExpired'), color: C.red, bg: C.redBg, pulse: false };
        default: return { label: t('home.statusUnknown'), color: C.tx3, bg: C.s4, pulse: false };
    }
}

export function HeroCard({ student, token, onPress, C }) {
    const { t } = useTranslation();
    const meta = getTokenMeta(token?.status, t, C);
    const isActive = token?.status === 'ACTIVE';
    const name = student?.first_name ? `${student.first_name} ${student.last_name || ''}`.trim() : 'Child';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: C.s2, borderColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={[styles.heroAccent, { backgroundColor: C.primary }]} />
            <View style={styles.heroInner}>
                <View style={styles.heroAvatar}>
                    <Text style={[styles.heroAvatarText, { color: C.primary }]}>{initials || '?'}</Text>
                </View>
                <View style={styles.heroInfo}>
                    <Text style={[styles.heroName, { color: C.tx }]} numberOfLines={1}>{name}</Text>
                    <View style={styles.heroMetaRow}>
                        {student?.class && (
                            <View style={[styles.classChip, { backgroundColor: C.primaryBg }]}>
                                <Text style={[styles.classChipText, { color: C.primary }]}>
                                    {student.class}{student.section ? `-${student.section}` : ''}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
                            {meta.pulse && <View style={[styles.pulseDot, { backgroundColor: meta.color }]} />}
                            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardNumber, { color: C.tx3 }]}>
                        <MaterialCommunityIcons name="qrcode" size={11} color={C.tx3} />{' '}
                        {token?.card_number || t('home.noCard')}
                    </Text>
                </View>
                <MaterialCommunityIcons name="qrcode-scan" size={28} color={C.primary} />
            </View>
            {token?.expires_at && (
                <View style={[styles.heroFooter, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
                    <Feather name="clock" size={12} color={C.tx3} />
                    <Text style={[styles.footerText, { color: C.tx3 }]}>
                        {t('home.validUntil')} {fmtDate(token.expires_at)}
                    </Text>
                    <View style={[styles.footerDivider, { backgroundColor: C.bd }]} />
                    <Feather name="shield" size={12} color={isActive ? C.ok : C.tx3} />
                    <Text style={[styles.footerText, { color: isActive ? C.ok : C.tx3 }]}>
                        {isActive ? t('home.active') : t('home.inactive')}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    heroAccent: { height: 3, width: '100%' },
    heroInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    heroAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(232,52,42,0.12)', alignItems: 'center', justifyContent: 'center' },
    heroAvatarText: { fontSize: 20, fontWeight: '800' },
    heroInfo: { flex: 1, gap: 4 },
    heroName: { fontSize: 16, fontWeight: '700' },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    classChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    classChipText: { fontSize: 10, fontWeight: '700' },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '700' },
    pulseDot: { width: 5, height: 5, borderRadius: 2.5 },
    cardNumber: { fontSize: 10, marginTop: 2 },
    heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
    footerText: { fontSize: 11 },
    footerDivider: { width: 1, height: 12 },
});