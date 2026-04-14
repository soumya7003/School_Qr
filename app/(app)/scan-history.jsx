/**
 * app/(app)/scan-history.jsx
 * Scan History — Clean redesign, eye-catching dark UI
 */

import Screen from '@/components/common/Screen';
import { profileApi } from '@/features/profile/profile.api';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInRight,
    FadeInUp,
    Layout,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTERS = [
    { key: 'all',       label: 'All Scans', icon: 'list' },
    { key: 'emergency', label: 'Emergency', icon: 'alert-triangle' },
    { key: 'success',   label: 'Success',   icon: 'check-circle' },
    { key: 'flagged',   label: 'Flagged',   icon: 'flag' },
];

// Explicit colour palette — never relies on theme tokens that may be undefined
const PAL = {
    blue:  { solid: '#3B82F6', dim: 'rgba(59,130,246,0.15)',  dimBorder: 'rgba(59,130,246,0.25)'  },
    red:   { solid: '#EF4444', dim: 'rgba(239,68,68,0.15)',   dimBorder: 'rgba(239,68,68,0.25)'   },
    green: { solid: '#10B981', dim: 'rgba(16,185,129,0.15)',  dimBorder: 'rgba(16,185,129,0.25)'  },
    amber: { solid: '#F59E0B', dim: 'rgba(245,158,11,0.15)',  dimBorder: 'rgba(245,158,11,0.25)'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(iso) {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins  > 0) return `${mins}m ago`;
    return 'Just now';
}
function formatFullDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function getLocationString(scan) {
    const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

function getScanConfig(result, scanPurpose) {
    const map = {
        SUCCESS:      { icon: 'check-circle',  pal: PAL.green, label: 'Successful Scan' },
        INVALID:      { icon: 'x-circle',      pal: PAL.red,   label: 'Invalid Code'    },
        REVOKED:      { icon: 'slash',          pal: PAL.red,   label: 'Card Revoked'    },
        EXPIRED:      { icon: 'clock',          pal: PAL.amber, label: 'Card Expired'    },
        INACTIVE:     { icon: 'pause-circle',   pal: { solid: '#9CA3AF', dim: 'rgba(156,163,175,0.15)', dimBorder: 'rgba(156,163,175,0.25)' }, label: 'Card Inactive'  },
        RATE_LIMITED: { icon: 'alert-circle',   pal: PAL.amber, label: 'Rate Limited'    },
        ERROR:        { icon: 'alert-triangle', pal: PAL.red,   label: 'System Error'    },
    };
    const base = map[result] ?? { icon: 'help-circle', pal: { solid: '#9CA3AF', dim: 'rgba(156,163,175,0.15)', dimBorder: 'rgba(156,163,175,0.25)' }, label: result ?? 'Unknown' };
    if (scanPurpose === 'EMERGENCY') return { icon: 'alert-triangle', pal: PAL.red, label: '🚨 Emergency Scan' };
    return base;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
/**
 * Complete redesign:
 *  • No position-absolute decorative elements (they cause the blob artefact)
 *  • Colored left accent bar (3 px) is drawn as a plain View sibling
 *  • Fixed 110 height for all four cards
 *  • Icon + number + label stacked cleanly
 */
function StatCard({ label, value, icon, pal, delay, C }) {
    return (
        <Animated.View
            entering={FadeInUp.delay(delay).duration(450).springify()}
            style={styles.statCardOuter}
        >
            {/* Accent bar on the left */}
            <View style={[styles.statAccentBar, { backgroundColor: pal.solid }]} />

            {/* Card body */}
            <View style={[styles.statCardBody, { backgroundColor: C.s2, borderColor: C.bd }]}>
                {/* Top row: icon pill + label */}
                <View style={styles.statTopRow}>
                    <View style={[styles.statIconPill, { backgroundColor: pal.dim }]}>
                        <Feather name={icon} size={16} color={pal.solid} />
                    </View>
                    <Text style={[styles.statLabel, { color: C.tx3 }]} numberOfLines={1}>
                        {label}
                    </Text>
                </View>

                {/* Number */}
                <Text style={[styles.statNumber, { color: pal.solid }]}>{value}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ filter, isActive, onPress, C }) {
    return (
        <TouchableOpacity
            style={[
                styles.filterChip,
                isActive
                    ? { backgroundColor: C.primary, borderColor: C.primary }
                    : { backgroundColor: C.s2,      borderColor: C.bd      },
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Feather name={filter.icon} size={13} color={isActive ? '#fff' : C.tx3} />
            <Text style={[styles.filterChipText, { color: isActive ? '#fff' : C.tx2 }, isActive && { fontWeight: '700' }]}>
                {filter.label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function ScanTimelineItem({ scan, index, C }) {
    const { icon, pal, label } = getScanConfig(scan.result, scan.scan_purpose);
    const location    = getLocationString(scan);
    const isEmergency = scan.scan_purpose === 'EMERGENCY';

    return (
        <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} layout={Layout.springify()}>
            <View style={[styles.timelineCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
                {/* Colored left accent */}
                <View style={[styles.timelineAccent, { backgroundColor: pal.solid }]} />

                {/* Dot */}
                <View style={[styles.timelineDotWrap, { backgroundColor: pal.dim, borderColor: pal.dimBorder }]}>
                    <Feather name={icon} size={15} color={pal.solid} />
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                    <View style={styles.timelineTopRow}>
                        <Text style={[styles.timelineTitle, { color: C.tx }]} numberOfLines={1}>
                            {label}
                        </Text>
                        <View style={styles.timelineRightMeta}>
                            {isEmergency && (
                                <View style={[styles.emergencyPill, { backgroundColor: PAL.red.dim, borderColor: PAL.red.dimBorder }]}>
                                    <Text style={[styles.emergencyPillText, { color: PAL.red.solid }]}>SOS</Text>
                                </View>
                            )}
                            <Text style={[styles.timelineRelTime, { color: C.tx3 }]}>
                                {formatRelativeTime(scan.created_at)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.timelineDetails}>
                        <View style={styles.detailRow}>
                            <Feather name="map-pin" size={12} color={C.tx3} />
                            <Text style={[styles.detailText, { color: C.tx2 }]} numberOfLines={1}>{location}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Feather name="calendar" size={12} color={C.tx3} />
                            <Text style={[styles.detailText, { color: C.tx2 }]}>
                                {formatFullDate(scan.created_at)} · {formatTime(scan.created_at)}
                            </Text>
                        </View>
                        {scan.response_time_ms != null && (
                            <View style={styles.detailRow}>
                                <Feather name="zap" size={12} color={C.tx3} />
                                <Text style={[styles.detailText, { color: C.tx2 }]}>
                                    {scan.response_time_ms}ms response
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ C }) {
    return (
        <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.emptyWrap}>
            {/* SVG illustration */}
            <Svg width={140} height={140} viewBox="0 0 140 140" fill="none">
                <Defs>
                    <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.5" />
                        <Stop offset="1" stopColor="#10B981" stopOpacity="0.5" />
                    </SvgGradient>
                </Defs>
                <Circle cx={70} cy={70} r={60} fill={C.s3 ?? '#1F2937'} />
                <Circle cx={70} cy={70} r={60} stroke="url(#ringGrad)" strokeWidth={1.5} strokeDasharray="6 8" />
                {/* QR-ish lines */}
                <Rect x={44} y={52} width={20} height={20} rx={4} stroke={C.tx3 ?? '#6B7280'} strokeWidth={2} />
                <Rect x={76} y={52} width={20} height={20} rx={4} stroke={C.tx3 ?? '#6B7280'} strokeWidth={2} />
                <Rect x={44} y={76} width={20} height={20} rx={4} stroke={C.tx3 ?? '#6B7280'} strokeWidth={2} />
                <Path d="M76 76h4v4h-4zM84 76h4v4h-4zM84 84h4v4h-4zM76 84h8" stroke={C.tx3 ?? '#6B7280'} strokeWidth={2} strokeLinecap="round" />
                {/* Dot indicator */}
                <Circle cx={104} cy={40} r={6} fill="#3B82F6" />
                <Circle cx={104} cy={40} r={10} fill="#3B82F6" fillOpacity={0.2} />
            </Svg>

            <View style={styles.emptyTextWrap}>
                <Text style={[styles.emptyTitle, { color: C.tx }]}>No scans yet</Text>
                <Text style={[styles.emptySubtitle, { color: C.tx3 }]}>
                    Every time someone scans your child's RESQID card, a detailed entry will appear here.
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScanHistoryScreen() {
    const router        = useRouter();
    const { colors: C } = useTheme();

    const anomaly         = useProfileStore((s) => s.anomaly);
    const anomalies       = useMemo(() => (anomaly ? [anomaly] : []), [anomaly]);
    const unresolvedCount = anomalies.filter((a) => !a.resolved).length;

    const [scans,        setScans]        = useState([]);
    const [cursor,       setCursor]       = useState(null);
    const [hasMore,      setHasMore]      = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [refreshing,   setRefreshing]   = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const stats = useMemo(() => {
        const emergency = scans.filter((s) => s.scan_purpose === 'EMERGENCY').length;
        const success   = scans.filter((s) => s.result === 'SUCCESS').length;
        return { total: scans.length, emergency, success, flagged: scans.length - success };
    }, [scans]);

    const loadScans = useCallback(async (reset = false, filterOverride) => {
        const filter = filterOverride ?? activeFilter;
        if (loading && !reset) return;
        reset ? setRefreshing(true) : setLoading(true);
        try {
            const result = await profileApi.getScanHistory({ cursor: reset ? undefined : cursor, limit: 15, filter });
            setScans((prev) => reset ? result.scans : [...prev, ...result.scans]);
            setCursor(result.nextCursor ?? null);
            setHasMore(result.hasMore ?? false);
        } catch { /* silent */ } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, cursor, loading]);

    useEffect(() => {
        setScans([]); setCursor(null); setHasMore(false);
        loadScans(true, activeFilter);
    }, [activeFilter]);

    const handleRefresh      = () => loadScans(true);
    const handleLoadMore     = () => { if (hasMore && !loading) loadScans(false); };
    const handleFilterChange = (key) => { if (key !== activeFilter) setActiveFilter(key); };

    // ── List Header ───────────────────────────────────────────────────────────
    const ListHeader = () => (
        <View style={styles.listHeader}>

            {/* ── Stats 2×2 grid ── */}
            <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                    <StatCard label="Total Scans" value={stats.total + (hasMore ? '+' : '')} icon="activity"       pal={PAL.blue}  delay={0}   C={C} />
                    <StatCard label="Emergency"   value={stats.emergency}                     icon="alert-triangle" pal={PAL.red}   delay={80}  C={C} />
                </View>
                <View style={styles.statsRow}>
                    <StatCard label="Success"     value={stats.success}                       icon="check-circle"   pal={PAL.green} delay={160} C={C} />
                    <StatCard label="Flagged"      value={stats.flagged}                       icon="flag"           pal={PAL.amber} delay={240} C={C} />
                </View>
            </View>

            {/* ── Anomaly banner ── */}
            {unresolvedCount > 0 && (
                <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                    <TouchableOpacity
                        style={[styles.anomalyBanner, { backgroundColor: PAL.amber.dim, borderColor: PAL.amber.dimBorder }]}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.anomalyIconWrap, { backgroundColor: PAL.amber.dim }]}>
                            <Feather name="alert-triangle" size={16} color={PAL.amber.solid} />
                        </View>
                        <Text style={[styles.anomalyText, { color: PAL.amber.solid }]}>
                            {unresolvedCount} unresolved anomal{unresolvedCount === 1 ? 'y' : 'ies'} detected
                        </Text>
                        <Feather name="chevron-right" size={16} color={PAL.amber.solid} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* ── Filter chips — horizontal scroll ── */}
            <Animated.View entering={FadeInDown.delay(180).duration(400)}>
                <Text style={[styles.filterLabel, { color: C.tx3 }]}>FILTER BY</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map((f) => (
                        <FilterChip
                            key={f.key}
                            filter={f}
                            isActive={activeFilter === f.key}
                            onPress={() => handleFilterChange(f.key)}
                            C={C}
                        />
                    ))}
                </ScrollView>
            </Animated.View>

            {/* ── Section heading ── */}
            {scans.length > 0 && (
                <Animated.View entering={FadeInRight.delay(240).duration(400)} style={styles.sectionRow}>
                    <MaterialCommunityIcons name="timeline-text" size={17} color={C.primary} />
                    <Text style={[styles.sectionTitle, { color: C.tx }]}>Recent Activity</Text>
                    <View style={[styles.sectionPill, { backgroundColor: C.primaryBg ?? PAL.blue.dim }]}>
                        <Text style={[styles.sectionPillText, { color: C.primary }]}>
                            {scans.length} scan{scans.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );

    const ListFooter = () => (
        <View style={styles.footer}>
            {loading && !refreshing && <ActivityIndicator size="small" color={C.primary} />}
            {!hasMore && scans.length > 0 && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    style={[styles.allCaughtUp, { backgroundColor: C.s2, borderColor: C.bd }]}
                >
                    <Feather name="check-circle" size={15} color={PAL.green.solid} />
                    <Text style={[styles.allCaughtUpText, { color: C.tx3 }]}>You're all caught up 📋</Text>
                </Animated.View>
            )}
        </View>
    );

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            {/* ── Header bar ── */}
            <Animated.View entering={FadeInDown.duration(350)} style={[styles.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity
                    style={[styles.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Feather name="chevron-left" size={22} color={C.tx} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: C.tx }]}>Scan History</Text>
                    <Text style={[styles.headerSub,   { color: C.tx3 }]}>Track every scan of your card</Text>
                </View>

                {/* Balance spacer */}
                <View style={{ width: 42 }} />
            </Animated.View>

            {/* ── List ── */}
            <FlatList
                data={scans}
                keyExtractor={(item, i) => item.id ?? String(i)}
                renderItem={({ item, index }) => <ScanTimelineItem scan={item} index={index} C={C} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={!loading && !refreshing ? <EmptyState C={C} /> : null}
                ListFooterComponent={ListFooter}
                contentContainerStyle={[
                    styles.listContent,
                    scans.length === 0 && { flex: 1 },
                ]}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={C.primary}
                        colors={[C.primary]}
                        progressBackgroundColor={C.s2}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH,
        paddingTop: Platform.OS === 'ios' ? 12 : 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 14, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle:  { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    headerSub:    { fontSize: 12, marginTop: 2, fontWeight: '500' },

    // List
    listContent: { paddingHorizontal: spacing.screenH, paddingBottom: 48 },
    listHeader:  { paddingTop: 18, gap: 16, marginBottom: 6 },

    // ── Stat cards ──────────────────────────────────────────────────────
    statsGrid: { gap: 10 },
    statsRow:  { flexDirection: 'row', gap: 10 },

    // Outer wrapper creates the left accent bar effect without any absolute blobs
    statCardOuter: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 18,
        overflow: 'hidden',           // clips the accent bar to rounded corners
        height: 110,
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    // 3px colored left bar — plain View, no gradient, no absolute positioning
    statAccentBar: {
        width: 4,
    },
    statCardBody: {
        flex: 1,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderWidth: 1,
        borderLeftWidth: 0,            // merges seamlessly with accent bar
        paddingHorizontal: 14,
        paddingVertical: 14,
        justifyContent: 'space-between',
    },
    statTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIconPill: {
        width: 32, height: 32, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    statLabel:  { fontSize: 12, fontWeight: '600', flex: 1 },
    statNumber: { fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },

    // ── Anomaly banner ──
    anomalyBanner: {
        flexDirection: 'row', alignItems: 'center',
        gap: 10, borderRadius: 16, borderWidth: 1, padding: 14,
    },
    anomalyIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    anomalyText: { flex: 1, fontSize: 13, fontWeight: '600' },

    // ── Filters ──
    filterLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10 },
    filterScroll: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    filterChip: {
        flexDirection: 'row', alignItems: 'center',
        gap: 6, paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 30, borderWidth: 1,
    },
    filterChipText: { fontSize: 13, fontWeight: '600' },

    // ── Section heading ──
    sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
    sectionPill:   { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    sectionPillText: { fontSize: 11, fontWeight: '700' },

    // ── Timeline item ──
    timelineCard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 10,
        overflow: 'hidden',
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
            android: { elevation: 3 },
        }),
    },
    timelineAccent: { width: 4 },
    timelineDotWrap: {
        width: 44, alignItems: 'center', justifyContent: 'center',
        borderRightWidth: 1,
    },
    timelineContent: { flex: 1, padding: 14, gap: 8 },
    timelineTopRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', gap: 8,
    },
    timelineTitle:   { fontSize: 14, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
    timelineRightMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    emergencyPill: {
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
    },
    emergencyPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
    timelineRelTime:   { fontSize: 12, fontWeight: '500' },
    timelineDetails:   { gap: 5 },
    detailRow:         { flexDirection: 'row', alignItems: 'center', gap: 7 },
    detailText:        { fontSize: 12, fontWeight: '500', flex: 1 },

    // ── Empty state ──
    emptyWrap: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 60, gap: 20,
    },
    emptyTextWrap:  { alignItems: 'center', gap: 8, paddingHorizontal: 32 },
    emptyTitle:     { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
    emptySubtitle:  { fontSize: 14, textAlign: 'center', lineHeight: 21, opacity: 0.7 },

    // ── Footer ──
    footer: { paddingVertical: 24, alignItems: 'center' },
    allCaughtUp: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 18, paddingVertical: 11,
        borderRadius: 30, borderWidth: 1,
    },
    allCaughtUpText: { fontSize: 13, fontWeight: '600' },
});