// src/components/home/LastScanCard.jsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function fmtRelTime(iso, t) {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return t('home.daysAgo', { count: days });
    if (hours > 0) return t('home.hoursAgo', { count: hours });
    if (mins > 0) return t('home.minsAgo', { count: mins });
    return t('home.justNow');
}

export function LastScanCard({ scan, totalScans, onPress, C }) {
    const { t } = useTranslation();
    const hasScan = scan && scan.id;

    return (
        <View style={[styles.sectionCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: C.bd }]}>
                <Feather name="radio" size={14} color={C.tx3} />
                <Text style={[styles.sectionTitle, { color: C.tx3 }]}>{t('home.lastScan')}</Text>
                {totalScans > 0 && (
                    <TouchableOpacity onPress={onPress} style={styles.editBtn}>
                        <Text style={[styles.editText, { color: C.primary }]}>{t('home.viewAll', { count: totalScans })}</Text>
                        <Feather name="chevron-right" size={12} color={C.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {!hasScan ? (
                <View style={styles.emptyScan}>
                    <Feather name="maximize-2" size={28} color={C.tx3} />
                    <Text style={[styles.emptyTitle, { color: C.tx2 }]}>{t('home.noScansYet')}</Text>
                    <Text style={[styles.emptyDesc, { color: C.tx3 }]}>{t('home.noScansBody')}</Text>
                </View>
            ) : (
                <TouchableOpacity style={styles.scanRow} onPress={onPress}>
                    <View style={[styles.scanDot, { backgroundColor: scan.result === 'SUCCESS' ? C.ok : C.red }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.scanLabel, { color: C.tx }]}>
                            {scan.scan_purpose === 'EMERGENCY' ? '🆘 ' : ''}{scan.result || t('home.scan')}
                        </Text>
                        <Text style={[styles.scanMeta, { color: C.tx3 }]}>
                            {fmtRelTime(scan.created_at, t)} • {scan.ip_city || 'Unknown location'}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={C.tx3} />
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
    emptyScan: { alignItems: 'center', padding: 28, gap: 6 },
    emptyTitle: { fontSize: 14, fontWeight: '600' },
    emptyDesc: { fontSize: 12, textAlign: 'center' },
    scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    scanDot: { width: 8, height: 8, borderRadius: 4 },
    scanLabel: { fontSize: 14, fontWeight: '600' },
    scanMeta: { fontSize: 11, marginTop: 2 },
});