/**
 * app/(app)/scan-history.jsx
 *
 * FIXES vs original:
 *   - Was only showing lastScan (1 item max) from store
 *   - Now calls profileApi.getScanHistory() paginated API directly
 *   - Infinite scroll with cursor pagination
 *   - Filter tabs hit the real API filter param
 *   - Refresh control re-fetches from page 1
 *   - All colors from useTheme().colors
 */

import Screen from '@/components/common/Screen';
import { profileApi } from '@/features/profile/profile.api';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────
const BackIcon = ({ color }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function resultMeta(result, C) {
    switch (result) {
        case 'SUCCESS': return { color: C.ok, bg: C.okBg, label: 'Success' };
        case 'INVALID': return { color: C.primary, bg: C.primaryBg, label: 'Invalid' };
        case 'REVOKED': return { color: C.red, bg: C.redBg, label: 'Revoked' };
        case 'EXPIRED': return { color: C.amb, bg: C.ambBg, label: 'Expired' };
        case 'INACTIVE': return { color: C.tx3, bg: C.s4, label: 'Inactive' };
        case 'RATE_LIMITED': return { color: C.amb, bg: C.ambBg, label: 'Rate Limited' };
        case 'ERROR': return { color: C.red, bg: C.redBg, label: 'Error' };
        default: return { color: C.tx3, bg: C.s4, label: result ?? '—' };
    }
}

function purposeMeta(purpose) {
    if (purpose === 'EMERGENCY') return { label: 'Emergency Scan', emoji: '🆘' };
    if (purpose === 'REGISTRATION') return { label: 'Card Registration', emoji: '🔗' };
    return { label: 'General Scan', emoji: '👁' };
}

function fmtRelTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
}

function fmtFull(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function locationStr(scan) {
    const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location unknown';
}

// Filter label → API filter param
const FILTERS = [
    { label: 'All', api: 'all' },
    { label: 'Emergency', api: 'emergency' },
    { label: 'Success', api: 'success' },
    { label: 'Flagged', api: 'flagged' },
];

// ── Anomaly card ──────────────────────────────────────────────────────────────
function AnomalyCard({ anomaly, C }) {
    return (
        <View style={[st.anomalyCard, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
            <View style={st.anomalyHeader}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={C.amb} strokeWidth={1.8} strokeLinejoin="round" />
                    <Path d="M12 9v4M12 17h.01" stroke={C.amb} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
                <Text style={[st.anomalyLabel, { color: C.amb }]}>Suspicious Activity</Text>
                {anomaly.resolved && (
                    <View style={[st.resolvedBadge, { backgroundColor: C.okBg }]}>
                        <Text style={[st.resolvedText, { color: C.ok }]}>Resolved</Text>
                    </View>
                )}
            </View>
            <Text style={[st.anomalyReason, { color: C.tx2 }]}>{anomaly.reason}</Text>
            <Text style={[st.anomalyTime, { color: C.tx3 }]}>{fmtFull(anomaly.created_at)}</Text>
        </View>
    );
}

// ── Filter tab ────────────────────────────────────────────────────────────────
function FilterTab({ label, active, onPress, C }) {
    return (
        <TouchableOpacity
            style={[st.filterTab, { backgroundColor: C.s2, borderColor: C.bd }, active && { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[st.filterTabText, { color: active ? C.white : C.tx2 }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ── Scan row ──────────────────────────────────────────────────────────────────
function ScanRow({ scan, index, C }) {
    const [expanded, setExpanded] = useState(false);
    const meta = resultMeta(scan.result, C);
    const purpose = purposeMeta(scan.scan_purpose);
    const loc = locationStr(scan);

    return (
        <Animated.View entering={FadeInDown.delay(index * 30).duration(300)} layout={Layout.springify()}>
            <TouchableOpacity
                style={[st.scanRow, { borderBottomColor: C.bd }, scan.result !== 'SUCCESS' && { backgroundColor: C.primaryBg + '50' }]}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.75}
            >
                <View style={[st.resultDot, { backgroundColor: meta.color }]} />
                <View style={{ flex: 1 }}>
                    <View style={st.scanRowTop}>
                        <Text style={[st.scanPurposeText, { color: C.tx }]}>{purpose.emoji}  {purpose.label}</Text>
                        <View style={[st.resultBadge, { backgroundColor: meta.bg }]}>
                            <Text style={[st.resultBadgeText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                    </View>
                    <View style={st.scanMetaRow}>
                        <Text style={[st.scanMetaText, { color: C.tx3 }]}>{loc}</Text>
                        <Text style={[st.scanMetaDot, { color: C.tx3 }]}>·</Text>
                        <Text style={[st.scanMetaText, { color: C.tx3 }]}>{fmtRelTime(scan.created_at)}</Text>
                    </View>
                </View>
                <Text style={[st.chevron, { color: C.tx3 }, expanded && st.chevronOpen]}>›</Text>
            </TouchableOpacity>

            {expanded && (
                <Animated.View entering={FadeInDown.duration(220)} style={[st.scanDetail, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
                    <View style={st.detailGrid}>
                        <DetailCell label="Date & Time" value={fmtFull(scan.created_at)} C={C} />
                        <DetailCell label="Result" value={meta.label} valueColor={meta.color} C={C} />
                        <DetailCell label="Purpose" value={purpose.label} C={C} />
                        <DetailCell label="Location" value={loc} C={C} />
                    </View>
                </Animated.View>
            )}
        </Animated.View>
    );
}

function DetailCell({ label, value, valueColor, C }) {
    return (
        <View style={st.detailCell}>
            <Text style={[st.detailLabel, { color: C.tx3 }]}>{label}</Text>
            <Text style={[st.detailValue, { color: valueColor ?? C.tx2 }]}>{value}</Text>
        </View>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ScanHistoryScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    // Anomalies still come from store (already fetched in /me)
    const anomaly = useProfileStore((s) => s.anomaly);
    const anomalies = anomaly ? [anomaly] : [];
    const unresolved = anomalies.filter((a) => !a.resolved);

    // Scan history — loaded from paginated API (NOT from store)
    const [scans, setScans] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const loadScans = useCallback(async (reset = false, filterOverride) => {
        const filter = filterOverride ?? activeFilter;
        if (loading && !reset) return;

        if (reset) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await profileApi.getScanHistory({
                cursor: reset ? undefined : cursor,
                limit: 20,
                filter,
            });

            setScans((prev) => reset ? result.scans : [...prev, ...result.scans]);
            setCursor(result.nextCursor ?? null);
            setHasMore(result.hasMore ?? false);
        } catch {
            // fail silently — show whatever was loaded
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, cursor, loading]);

    // Initial load + reload on filter change
    useEffect(() => {
        setScans([]);
        setCursor(null);
        setHasMore(false);
        loadScans(true, activeFilter);
    }, [activeFilter]);

    const handleRefresh = () => loadScans(true);
    const handleLoadMore = () => { if (hasMore && !loading) loadScans(false); };

    const handleFilterChange = (apiFilter) => {
        if (apiFilter === activeFilter) return;
        setActiveFilter(apiFilter);
    };

    const ListHeader = () => (
        <>
            {/* Stats */}
            <Animated.View entering={FadeInDown.delay(60).duration(360)} style={st.statsRow}>
                {[
                    { num: scans.length + (hasMore ? '+' : ''), label: 'Loaded', accent: false },
                    { num: scans.filter((s) => s.scan_purpose === 'EMERGENCY').length, label: 'Emergency', accent: scans.some((s) => s.scan_purpose === 'EMERGENCY') },
                    { num: unresolved.length, label: 'Anomalies', accent: unresolved.length > 0 },
                    { num: scans[0] ? fmtRelTime(scans[0].created_at) : '—', label: 'Last Scan', accent: false },
                ].map((item) => (
                    <View key={item.label} style={[st.statCard, { backgroundColor: item.accent ? C.primaryBg : C.s2, borderColor: item.accent ? C.primaryBd : C.bd }]}>
                        <Text style={[st.statNum, { color: item.accent ? C.primary : C.tx }]}>{item.num}</Text>
                        <Text style={[st.statLabel, { color: C.tx3 }]}>{item.label}</Text>
                    </View>
                ))}
            </Animated.View>

            {/* Anomalies */}
            {unresolved.length > 0 && (
                <Animated.View entering={FadeInDown.delay(100).duration(360)} style={{ gap: 8 }}>
                    <Text style={[st.sectionLabel, { color: C.tx3 }]}>⚠️  Suspicious Activity</Text>
                    {unresolved.map((a, i) => <AnomalyCard key={a.id ?? i} anomaly={a} C={C} />)}
                </Animated.View>
            )}

            {/* Filters */}
            <Animated.View entering={FadeInDown.delay(130).duration(360)}>
                <View style={st.filterRow}>
                    {FILTERS.map((f) => (
                        <FilterTab key={f.api} label={f.label} active={activeFilter === f.api} onPress={() => handleFilterChange(f.api)} C={C} />
                    ))}
                </View>
            </Animated.View>
        </>
    );

    const ListEmpty = () => (
        <Animated.View entering={FadeInUp.delay(160).duration(360)} style={st.empty}>
            <View style={[st.emptyIcon, { backgroundColor: C.s2, borderColor: C.bd }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={C.tx3} strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
            </View>
            <Text style={[st.emptyTitle, { color: C.tx }]}>No scans yet</Text>
            <Text style={[st.emptyText, { color: C.tx3 }]}>When someone scans your child's card, it will appear here.</Text>
        </Animated.View>
    );

    const ListFooter = () => (
        <View style={{ paddingVertical: 16 }}>
            {loading && !refreshing && (
                <ActivityIndicator size="small" color={C.primary} />
            )}
            {!hasMore && scans.length > 0 && (
                <View style={[st.privacyNote, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Circle cx={12} cy={12} r={10} stroke={C.ok} strokeWidth={1.8} />
                        <Path d="M9 12l2 2 4-4" stroke={C.ok} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={[st.privacyNoteText, { color: C.tx3 }]}>
                        All {scans.length} scan{scans.length !== 1 ? 's' : ''} loaded. Logs stored securely for 12 months.
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(300)} style={[st.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity style={[st.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon color={C.tx} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[st.pageTitle, { color: C.tx }]}>Scan History</Text>
                    <Text style={[st.pageSubtitle, { color: C.tx3 }]}>Every time your card was scanned</Text>
                </View>
            </Animated.View>

            <FlatList
                data={scans}
                keyExtractor={(item, i) => item.id ?? String(i)}
                renderItem={({ item, index }) => <ScanRow scan={item} index={index} C={C} />}
                ListHeaderComponent={<ListHeader />}
                ListEmptyComponent={!loading && !refreshing ? <ListEmpty /> : null}
                ListFooterComponent={<ListFooter />}
                ItemSeparatorComponent={() => null}
                contentContainerStyle={st.scroll}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={C.primary}
                        colors={[C.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: C.bg }}
            />
        </Screen>
    );
}

const st = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, borderBottomWidth: 1 },
    backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    pageSubtitle: { fontSize: 12, marginTop: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14, paddingTop: 16 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 3 },
    statNum: { fontSize: 16, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
    anomalyCard: { borderRadius: 13, borderWidth: 1, padding: 13, gap: 6 },
    anomalyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    anomalyLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
    resolvedBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
    resolvedText: { fontSize: 10, fontWeight: '700' },
    anomalyReason: { fontSize: 12.5, lineHeight: 17 },
    anomalyTime: { fontSize: 11 },
    filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
    filterTabText: { fontSize: 13, fontWeight: '600' },
    scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
    resultDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    scanRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
    scanPurposeText: { fontSize: 13.5, fontWeight: '600' },
    resultBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
    resultBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
    scanMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    scanMetaText: { fontSize: 11.5 },
    scanMetaDot: { fontSize: 10 },
    chevron: { fontSize: 18, lineHeight: 20 },
    chevronOpen: { transform: [{ rotate: '90deg' }] },
    scanDetail: { padding: 16, borderBottomWidth: 1 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    detailCell: { width: '45%', gap: 3 },
    detailLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    detailValue: { fontSize: 12.5, fontWeight: '500' },
    empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyIcon: { width: 56, height: 56, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    emptyTitle: { fontSize: 15, fontWeight: '800' },
    emptyText: { fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 18 },
    privacyNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 13, borderWidth: 1, padding: 13 },
    privacyNoteText: { fontSize: 11.5, flex: 1, lineHeight: 16 },
});