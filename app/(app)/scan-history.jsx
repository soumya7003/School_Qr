/**
 * app/(app)/scan-history.jsx
 * Scan History — Modern timeline design with smart filtering
 */

import Screen from '@/components/common/Screen';
import { profileApi } from '@/features/profile/profile.api';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp, Layout } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Filter Types ─────────────────────────────────────────────────────────────
const FILTERS = [
    { key: 'all', label: 'All Scans', icon: 'list' },
    { key: 'emergency', label: 'Emergency', icon: 'alert-triangle' },
    { key: 'success', label: 'Success', icon: 'check-circle' },
    { key: 'flagged', label: 'Flagged', icon: 'flag' },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function formatRelativeTime(iso) {
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

function formatFullDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function getLocationString(scan) {
    const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

// ─── Scan Result Config ───────────────────────────────────────────────────────
function getScanConfig(result, scanPurpose, C) {
    const isEmergency = scanPurpose === 'EMERGENCY';

    const configs = {
        SUCCESS: {
            icon: 'check-circle',
            gradient: [C.ok, '#0D9488'],
            label: 'Successful Scan',
            badgeColor: C.ok,
            badgeBg: C.okBg,
        },
        INVALID: {
            icon: 'x-circle',
            gradient: [C.primary, '#B91C1C'],
            label: 'Invalid Code',
            badgeColor: C.primary,
            badgeBg: C.primaryBg,
        },
        REVOKED: {
            icon: 'slash',
            gradient: [C.red, '#991B1B'],
            label: 'Card Revoked',
            badgeColor: C.red,
            badgeBg: C.redBg,
        },
        EXPIRED: {
            icon: 'clock',
            gradient: [C.amb, '#B45309'],
            label: 'Card Expired',
            badgeColor: C.amb,
            badgeBg: C.ambBg,
        },
        INACTIVE: {
            icon: 'pause-circle',
            gradient: [C.tx3, '#6B7280'],
            label: 'Card Inactive',
            badgeColor: C.tx3,
            badgeBg: C.s4,
        },
        RATE_LIMITED: {
            icon: 'alert-circle',
            gradient: [C.amb, '#B45309'],
            label: 'Rate Limited',
            badgeColor: C.amb,
            badgeBg: C.ambBg,
        },
        ERROR: {
            icon: 'alert-triangle',
            gradient: [C.red, '#991B1B'],
            label: 'System Error',
            badgeColor: C.red,
            badgeBg: C.redBg,
        },
    };

    const baseConfig = configs[result] || {
        icon: 'help-circle',
        gradient: [C.tx3, '#6B7280'],
        label: result || 'Unknown',
        badgeColor: C.tx3,
        badgeBg: C.s4,
    };

    if (isEmergency) {
        baseConfig.icon = 'alert-triangle';
        baseConfig.gradient = ['#DC2626', '#991B1B'];
        baseConfig.label = '🚨 Emergency Scan';
    }

    return baseConfig;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, gradientColors, delay, C }) {
    return (
        <Animated.View
            entering={FadeInRight.delay(delay).duration(400)}
            style={[styles.statCard, { backgroundColor: C.s2, borderColor: C.bd }]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statIconBg, { opacity: 0.12 }]}
            />
            <View style={[styles.statIconWrapper, { backgroundColor: color + '20' }]}>
                <Feather name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.statNumber, { color: C.tx }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: C.tx3 }]}>{label}</Text>
        </Animated.View>
    );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ filter, isActive, onPress, C }) {
    return (
        <TouchableOpacity
            style={[
                styles.filterChip,
                { backgroundColor: isActive ? C.primary : C.s2, borderColor: isActive ? C.primary : C.bd },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Feather
                name={filter.icon}
                size={14}
                color={isActive ? '#fff' : C.tx3}
            />
            <Text style={[
                styles.filterChipText,
                { color: isActive ? '#fff' : C.tx3 },
                isActive && { fontWeight: '700' },
            ]}>
                {filter.label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Scan Timeline Item ───────────────────────────────────────────────────────
function ScanTimelineItem({ scan, index, C }) {
    const config = getScanConfig(scan.result, scan.scan_purpose, C);
    const location = getLocationString(scan);
    const isEmergency = scan.scan_purpose === 'EMERGENCY';

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 50).duration(400)}
            layout={Layout.springify()}
        >
            <View style={[styles.timelineItem, { backgroundColor: C.s2, borderColor: C.bd }]}>
                {/* Left timeline indicator */}
                <View style={styles.timelineLeft}>
                    <LinearGradient
                        colors={config.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.timelineLine}
                    />
                    <View style={[styles.timelineDot, {
                        backgroundColor: config.badgeColor,
                        shadowColor: config.badgeColor,
                    }]}>
                        <Feather name={config.icon} size={14} color="#fff" />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                        <View style={styles.timelineHeaderLeft}>
                            <Text style={[styles.timelineTitle, { color: C.tx }]}>
                                {config.label}
                            </Text>
                            {isEmergency && (
                                <View style={[styles.emergencyBadge, { backgroundColor: C.redBg }]}>
                                    <Text style={[styles.emergencyBadgeText, { color: C.red }]}>EMERGENCY</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.timelineTime, { color: C.tx3 }]}>
                            {formatRelativeTime(scan.created_at)}
                        </Text>
                    </View>

                    <View style={styles.timelineDetails}>
                        <View style={styles.detailRow}>
                            <Feather name="map-pin" size={13} color={C.tx3} />
                            <Text style={[styles.detailText, { color: C.tx2 }]} numberOfLines={1}>
                                {location}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Feather name="calendar" size={13} color={C.tx3} />
                            <Text style={[styles.detailText, { color: C.tx2 }]}>
                                {formatFullDate(scan.created_at)} · {formatTime(scan.created_at)}
                            </Text>
                        </View>

                        {scan.response_time_ms && (
                            <View style={styles.detailRow}>
                                <Feather name="zap" size={13} color={C.tx3} />
                                <Text style={[styles.detailText, { color: C.tx2 }]}>
                                    Response time: {scan.response_time_ms}ms
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
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyContainer}>
            <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
                <Circle cx={60} cy={60} r={50} fill={C.s3} />
                <Circle cx={60} cy={60} r={50} stroke={C.bd} strokeWidth={1.5} strokeDasharray="4 6" />
                <Path
                    d="M40 50h40M40 60h30M40 70h20"
                    stroke={C.tx3}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                />
                <Circle cx={85} cy={50} r={4} fill={C.primary} />
            </Svg>
            <Text style={[styles.emptyTitle, { color: C.tx }]}>No scan history yet</Text>
            <Text style={[styles.emptySubtitle, { color: C.tx3 }]}>
                When someone scans your child's RESQID card, it will appear here in a beautiful timeline.
            </Text>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScanHistoryScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    const anomaly = useProfileStore((s) => s.anomaly);
    const anomalies = useMemo(() => anomaly ? [anomaly] : [], [anomaly]);
    const unresolvedCount = anomalies.filter(a => !a.resolved).length;

    const [scans, setScans] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const stats = useMemo(() => {
        const emergency = scans.filter(s => s.scan_purpose === 'EMERGENCY').length;
        const success = scans.filter(s => s.result === 'SUCCESS').length;
        const flagged = scans.length - success;
        return { total: scans.length, emergency, success, flagged };
    }, [scans]);

    const loadScans = useCallback(async (reset = false, filterOverride) => {
        const filter = filterOverride ?? activeFilter;
        if (loading && !reset) return;

        if (reset) setRefreshing(true);
        else setLoading(true);

        try {
            const result = await profileApi.getScanHistory({
                cursor: reset ? undefined : cursor,
                limit: 15,
                filter,
            });

            setScans(prev => reset ? result.scans : [...prev, ...result.scans]);
            setCursor(result.nextCursor ?? null);
            setHasMore(result.hasMore ?? false);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, cursor, loading]);

    useEffect(() => {
        setScans([]);
        setCursor(null);
        setHasMore(false);
        loadScans(true, activeFilter);
    }, [activeFilter]);

    const handleRefresh = () => loadScans(true);
    const handleLoadMore = () => { if (hasMore && !loading) loadScans(false); };

    const handleFilterChange = (key) => {
        if (key === activeFilter) return;
        setActiveFilter(key);
    };

    // ── ListHeader now owns the stats grid so everything scrolls together ──
    const ListHeader = () => (
        <View style={styles.listHeaderContainer}>
            {/* Stats Grid */}
            <Animated.View entering={FadeInUp.delay(50).duration(400)}>
                <View style={styles.statsGrid}>
                    <StatCard label="Total Scans" value={stats.total + (hasMore ? '+' : '')} icon="activity" color={C.blue} gradientColors={[C.blue, '#1D4ED8']} delay={0} C={C} />
                    <StatCard label="Emergency" value={stats.emergency} icon="alert-triangle" color={C.red} gradientColors={[C.red, '#991B1B']} delay={50} C={C} />
                    <StatCard label="Success" value={stats.success} icon="check-circle" color={C.ok} gradientColors={[C.ok, '#0D9488']} delay={100} C={C} />
                    <StatCard label="Flagged" value={stats.flagged} icon="flag" color={C.amb} gradientColors={[C.amb, '#B45309']} delay={150} C={C} />
                </View>
            </Animated.View>

            {/* Anomaly Alert */}
            {unresolvedCount > 0 && (
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <TouchableOpacity style={[styles.anomalyAlert, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Path d="M12 9v4M12 17h.01" stroke={C.amb} strokeWidth={2} strokeLinecap="round" />
                            <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={C.amb} strokeWidth={1.8} strokeLinejoin="round" />
                        </Svg>
                        <Text style={[styles.anomalyAlertText, { color: C.amb }]}>
                            {unresolvedCount} unresolved anomal{unresolvedCount === 1 ? 'y' : 'ies'} detected
                        </Text>
                        <Feather name="chevron-right" size={16} color={C.amb} />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Filters */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Text style={[styles.filterLabel, { color: C.tx3 }]}>FILTER BY</Text>
                <View style={styles.filterContainer}>
                    {FILTERS.map((filter) => (
                        <FilterChip
                            key={filter.key}
                            filter={filter}
                            isActive={activeFilter === filter.key}
                            onPress={() => handleFilterChange(filter.key)}
                            C={C}
                        />
                    ))}
                </View>
            </Animated.View>

            {/* Section Title */}
            {scans.length > 0 && (
                <Animated.View entering={FadeInRight.delay(200).duration(400)} style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="timeline-text" size={18} color={C.primary} />
                    <Text style={[styles.sectionTitle, { color: C.tx }]}>Recent Activity</Text>
                    <View style={[styles.sectionBadge, { backgroundColor: C.primaryBg }]}>
                        <Text style={[styles.sectionBadgeText, { color: C.primary }]}>
                            {scans.length} scan{scans.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );

    const ListFooter = () => (
        <View style={styles.footerContainer}>
            {loading && !refreshing && (
                <ActivityIndicator size="small" color={C.primary} />
            )}
            {!hasMore && scans.length > 0 && (
                <Animated.View entering={FadeInUp.duration(300)} style={[styles.endMessage, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Feather name="check-circle" size={16} color={C.ok} />
                    <Text style={[styles.endMessageText, { color: C.tx3 }]}>
                        You're all caught up! 📋
                    </Text>
                </Animated.View>
            )}
        </View>
    );

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(400)} style={[styles.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: C.s2, borderColor: C.bd }]}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Feather name="chevron-left" size={22} color={C.tx} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: C.tx }]}>Scan History</Text>
                    <Text style={[styles.headerSubtitle, { color: C.tx3 }]}>
                        Track every scan of your card
                    </Text>
                </View>
                <View style={styles.headerRight} />
            </Animated.View>

            {/* FlatList owns everything below the header */}
            <FlatList
                data={scans}
                keyExtractor={(item, i) => item.id ?? String(i)}
                renderItem={({ item, index }) => <ScanTimelineItem scan={item} index={index} C={C} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={!loading && !refreshing ? <EmptyState C={C} /> : null}
                ListFooterComponent={ListFooter}
                contentContainerStyle={[styles.listContent, scans.length === 0 && { flex: 1, justifyContent: 'center' }]}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} progressBackgroundColor={C.s2} />
                }
                showsVerticalScrollIndicator={false}
            />
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH,
        paddingTop: Platform.OS === 'ios' ? 12 : 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 12, marginTop: 1, fontWeight: '500' },
    headerRight: { width: 42 },
    // statsWrapper removed — stats now live inside listHeaderContainer
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { flex: 1, minWidth: '45%', borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' },
    statIconBg: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40 },
    statIconWrapper: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statNumber: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
    listContent: { paddingHorizontal: spacing.screenH, paddingBottom: 40 },
    listHeaderContainer: { gap: 20, marginBottom: 8, paddingTop: 16 },
    anomalyAlert: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
    anomalyAlertText: { flex: 1, fontSize: 14, fontWeight: '600' },
    filterLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
    filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, borderWidth: 1 },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
    sectionBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    sectionBadgeText: { fontSize: 11, fontWeight: '700' },
    timelineItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 3 } }) },
    timelineLeft: { alignItems: 'center', marginRight: 14 },
    timelineLine: { width: 3, height: 30, borderRadius: 2, marginBottom: 4 },
    timelineDot: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    timelineContent: { flex: 1, gap: 8 },
    timelineHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    timelineHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    timelineTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
    emergencyBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    emergencyBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    timelineTime: { fontSize: 12, fontWeight: '500' },
    timelineDetails: { gap: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13, fontWeight: '500', flex: 1 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
    footerContainer: { paddingVertical: 20, alignItems: 'center' },
    endMessage: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30, borderWidth: 1 },
    endMessageText: { fontSize: 13, fontWeight: '600' },
});