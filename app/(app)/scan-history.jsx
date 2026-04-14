/**
 * app/(app)/scan-history.jsx
 * Scan History — Modern timeline design with smart filtering
 * 
 * FIXES:
 * - Duplicate key issue resolved
 * - Stat cards now in sticky header, not overlapping
 * - Click scan item → opens detail modal
 * - Location opens in maps app
 * - Device info displayed in detail view
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
    Linking,
    Modal,
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
    { key: 'all', label: 'All Scans', icon: 'list' },
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

function formatDateTime(iso) {
    return `${formatFullDate(iso)} at ${formatTime(iso)}`;
}

function getLocationString(scan) {
    const parts = [scan.ip_city, scan.ip_region, scan.ip_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
}

function hasCoordinates(scan) {
    return scan.latitude != null && scan.longitude != null;
}

function openMaps(latitude, longitude) {
    const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
        default: `https://maps.google.com/?q=${latitude},${longitude}`,
    });
    Linking.openURL(url);
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
            <Feather name={filter.icon} size={14} color={isActive ? '#fff' : C.tx3} />
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

// ─── Scan Detail Modal ────────────────────────────────────────────────────────
function ScanDetailModal({ scan, visible, onClose, C }) {
    if (!scan) return null;

    const config = getScanConfig(scan.result, scan.scan_purpose, C);
    const location = getLocationString(scan);
    const hasLoc = hasCoordinates(scan);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: C.bg + 'CC' }]}>
                <View style={[styles.modalContent, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={[styles.modalIcon, { backgroundColor: config.badgeBg }]}>
                            <Feather name={config.icon} size={24} color={config.badgeColor} />
                        </View>
                        <Text style={[styles.modalTitle, { color: C.tx }]}>{config.label}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalClose}>
                            <Feather name="x" size={24} color={C.tx3} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                        {/* Date & Time */}
                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>DATE & TIME</Text>
                            <View style={styles.detailRow}>
                                <Feather name="calendar" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx }]}>{formatDateTime(scan.created_at)}</Text>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>LOCATION</Text>
                            <View style={styles.detailRow}>
                                <Feather name="map-pin" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx2 }]}>{location}</Text>
                            </View>
                            {hasLoc && (
                                <TouchableOpacity
                                    style={[styles.mapButton, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}
                                    onPress={() => openMaps(scan.latitude, scan.longitude)}
                                >
                                    <Feather name="map" size={16} color={C.blue} />
                                    <Text style={[styles.mapButtonText, { color: C.blue }]}>View on Map</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Coordinates (if available) */}
                        {hasLoc && (
                            <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                                <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>COORDINATES</Text>
                                <View style={styles.detailRow}>
                                    <Feather name="navigation" size={16} color={C.primary} />
                                    <Text style={[styles.detailValue, { color: C.tx2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                                        {scan.latitude?.toFixed(6)}, {scan.longitude?.toFixed(6)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Device Info */}
                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>SCANNER DEVICE</Text>
                            <View style={styles.detailRow}>
                                <Feather name="smartphone" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx2 }]}>
                                    {scan.user_agent?.substring(0, 100) || 'Unknown device'}
                                </Text>
                            </View>
                            {scan.device_hash && (
                                <View style={styles.detailRow}>
                                    <Feather name="fingerprint" size={16} color={C.primary} />
                                    <Text style={[styles.detailValue, { color: C.tx3, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                                        Device ID: {scan.device_hash}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* IP Address */}
                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>NETWORK INFO</Text>
                            <View style={styles.detailRow}>
                                <Feather name="globe" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx2 }]}>
                                    IP: {scan.ip_address || 'Not recorded'}
                                </Text>
                            </View>
                            {scan.response_time_ms && (
                                <View style={styles.detailRow}>
                                    <Feather name="zap" size={16} color={C.primary} />
                                    <Text style={[styles.detailValue, { color: C.tx2 }]}>
                                        Response: {scan.response_time_ms}ms
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Scan Purpose Badge */}
                        <View style={styles.detailSection}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>SCAN TYPE</Text>
                            <View style={[styles.purposeBadge, { backgroundColor: config.badgeBg }]}>
                                <Feather name={scan.scan_purpose === 'EMERGENCY' ? 'alert-triangle' : 'qr-code'} size={14} color={config.badgeColor} />
                                <Text style={[styles.purposeText, { color: config.badgeColor }]}>
                                    {scan.scan_purpose === 'EMERGENCY' ? 'Emergency Scan' : 'QR Code Scan'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Scan Timeline Item ───────────────────────────────────────────────────────
function ScanTimelineItem({ scan, index, onPress, C }) {
    const config = getScanConfig(scan.result, scan.scan_purpose, C);
    const location = getLocationString(scan);
    const isEmergency = scan.scan_purpose === 'EMERGENCY';

    return (
        <TouchableOpacity onPress={() => onPress(scan)} activeOpacity={0.7}>
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
                        </View>
                    </View>

                    <Feather name="chevron-right" size={18} color={C.tx3} />
                </View>
            </Animated.View>
        </TouchableOpacity>
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
    const [selectedScan, setSelectedScan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

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

    const handleRefresh = () => loadScans(true);
    const handleLoadMore = () => { if (hasMore && !loading) loadScans(false); };
    const handleFilterChange = (key) => { if (key === activeFilter) return; setActiveFilter(key); };
    const handleScanPress = (scan) => { setSelectedScan(scan); setModalVisible(true); };
    const handleCloseModal = () => { setModalVisible(false); setSelectedScan(null); };

    const renderItem = ({ item, index }) => (
        <ScanTimelineItem scan={item} index={index} onPress={handleScanPress} C={C} />
    );

    const keyExtractor = (item, index) => {
        if (item.id) return `${item.id}-${index}`;
        return `scan-${index}-${item.created_at || Date.now()}`;
    };

    const ListHeader = () => (
        <View style={styles.listHeaderContainer}>
            {/* Stats Grid */}
            <Animated.View entering={FadeInUp.delay(50).duration(400)}>
                <View style={styles.statsGrid}>
                    <StatCard label="Total Scans" value={stats.total} icon="activity" color={C.blue} gradientColors={[C.blue, '#1D4ED8']} delay={0} C={C} />
                    <StatCard label="Emergency" value={stats.emergency} icon="alert-triangle" color={C.red} gradientColors={[C.red, '#991B1B']} delay={50} C={C} />
                    <StatCard label="Success" value={stats.success} icon="check-circle" color={C.ok} gradientColors={[C.ok, '#0D9488']} delay={100} C={C} />
                    <StatCard label="Flagged" value={stats.flagged} icon="flag" color={C.amb} gradientColors={[C.amb, '#B45309']} delay={150} C={C} />
                </View>
            </Animated.View>

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

            {/* FlatList */}
            <FlatList
                data={scans}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
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

            {/* Detail Modal */}
            <ScanDetailModal
                scan={selectedScan}
                visible={modalVisible}
                onClose={handleCloseModal}
                C={C}
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
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 12, marginTop: 1, fontWeight: '500' },
    headerRight: { width: 42 },
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
    // Modal styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '85%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
    modalIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    modalClose: { padding: 4 },
    modalBody: { padding: 20, gap: 20 },
    detailSection: { gap: 10, paddingBottom: 16, borderBottomWidth: 1 },
    detailSectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
    detailValue: { flex: 1, fontSize: 14, lineHeight: 20 },
    mapButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
    mapButtonText: { fontSize: 13, fontWeight: '700' },
    purposeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
    purposeText: { fontSize: 12, fontWeight: '700' },
});