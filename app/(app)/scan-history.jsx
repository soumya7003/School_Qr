// components/scan-history/ScanHistoryScreen.jsx

import Screen from '@/components/common/Screen';
import { EmptyState, FilterChip, ScanDetailModal, ScanTimelineItem, StatCard } from '@/components/scan-history/scanHistory.index.js';
import { profileApi } from '@/features/profile/profile.api';
import { useActiveStudent, useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { styles } from '@/styles/scanHistory.styles.js';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const FILTERS = [{ key: 'all', label: 'All Scans', icon: 'list' }];

export default function ScanHistoryScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    const activeStudent = useActiveStudent();
    const activeStudentId = useProfileStore((s) => s.activeStudentId);
    const studentName = activeStudent?.first_name || 'Child';
    const anomaly = activeStudent?.anomaly;
    const anomalies = useMemo(() => anomaly ? [anomaly] : [], [anomaly]);
    const unresolvedCount = anomalies.filter(a => !a.resolved).length;

    const [scans, setScans] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedScan, setSelectedScan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const stats = useMemo(() => {
        const emergency = scans.filter(s => s.scan_purpose === 'EMERGENCY').length;
        const success = scans.filter(s => s.result === 'SUCCESS').length;
        return { total: scans.length, emergency, success, flagged: scans.length - success };
    }, [scans]);

    const loadScans = useCallback(async (reset = false, filterOverride) => {
        const filter = filterOverride ?? activeFilter;
        if (loading && !reset) return;

        if (reset) { setRefreshing(true); setInitialLoading(true); }
        else setLoading(true);

        try {
            const result = await profileApi.getScanHistory({ studentId: activeStudentId, cursor: reset ? undefined : cursor, limit: 15, filter });
            setScans(prev => reset ? result.scans : [...prev, ...result.scans]);
            setCursor(result.nextCursor ?? null);
            setHasMore(result.hasMore ?? false);
        } catch { /* Silent fail */ }
        finally { setLoading(false); setRefreshing(false); setInitialLoading(false); }
    }, [activeFilter, cursor, loading, activeStudentId]);

    useEffect(() => {
        if (!activeStudentId) return;
        setScans([]); setCursor(null); setHasMore(false);
        loadScans(true, activeFilter);
    }, [activeFilter, activeStudentId]);

    const handleRefresh = () => loadScans(true);
    const handleLoadMore = () => { if (hasMore && !loading) loadScans(false); };
    const handleFilterChange = (key) => { if (key === activeFilter) return; setActiveFilter(key); };
    const handleScanPress = (scan) => { setSelectedScan(scan); setModalVisible(true); };

    const ListHeader = () => (
        <View style={styles.listHeaderContainer}>
            <Animated.View entering={FadeInUp.delay(50).duration(400)}>
                <View style={styles.statsGrid}>
                    <StatCard label="Total Scans" value={stats.total} icon="activity" color={C.blue} gradientColors={[C.blue, '#1D4ED8']} delay={0} C={C} />
                    <StatCard label="Emergency" value={stats.emergency} icon="alert-triangle" color={C.red} gradientColors={[C.red, '#991B1B']} delay={50} C={C} />
                    <StatCard label="Success" value={stats.success} icon="check-circle" color={C.ok} gradientColors={[C.ok, '#0D9488']} delay={100} C={C} />
                    <StatCard label="Flagged" value={stats.flagged} icon="flag" color={C.amb} gradientColors={[C.amb, '#B45309']} delay={150} C={C} />
                </View>
            </Animated.View>

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

            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Text style={[styles.filterLabel, { color: C.tx3 }]}>FILTER BY</Text>
                <View style={styles.filterContainer}>
                    {FILTERS.map((filter) => (
                        <FilterChip key={filter.key} filter={filter} isActive={activeFilter === filter.key} onPress={() => handleFilterChange(filter.key)} C={C} />
                    ))}
                </View>
            </Animated.View>

            {scans.length > 0 && (
                <Animated.View entering={FadeInRight.delay(200).duration(400)} style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="timeline-text" size={18} color={C.primary} />
                    <Text style={[styles.sectionTitle, { color: C.tx }]}>Recent Activity</Text>
                    <View style={[styles.sectionBadge, { backgroundColor: C.primaryBg }]}>
                        <Text style={[styles.sectionBadgeText, { color: C.primary }]}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );

    const ListFooter = () => (
        <View style={styles.footerContainer}>
            {loading && !refreshing && <ActivityIndicator size="small" color={C.primary} />}
            {!hasMore && scans.length > 0 && (
                <Animated.View entering={FadeInUp.duration(300)} style={[styles.endMessage, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Feather name="check-circle" size={16} color={C.ok} />
                    <Text style={[styles.endMessageText, { color: C.tx3 }]}>You're all caught up! 📋</Text>
                </Animated.View>
            )}
        </View>
    );

    if (initialLoading) {
        return (
            <Screen bg={C.bg} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                    <Text style={[styles.loadingText, { color: C.tx3 }]}>Loading scan history...</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <Animated.View entering={FadeInDown.delay(0).duration(400)} style={[styles.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => router.back()}>
                    <Feather name="chevron-left" size={22} color={C.tx} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: C.tx }]}>Scan History</Text>
                    <Text style={[styles.headerSubtitle, { color: C.tx3 }]}>{studentName}'s scan history</Text>
                </View>
                <View style={styles.headerRight} />
            </Animated.View>

            <FlatList
                data={scans}
                keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `scan-${index}-${item.created_at || Date.now()}`}
                renderItem={({ item, index }) => <ScanTimelineItem scan={item} index={index} onPress={handleScanPress} C={C} />}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={!loading && !refreshing ? <EmptyState C={C} /> : null}
                ListFooterComponent={ListFooter}
                contentContainerStyle={[styles.listContent, scans.length === 0 && !loading && !refreshing && { flex: 1, justifyContent: 'center' }]}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} colors={[C.primary]} progressBackgroundColor={C.s2} />}
                showsVerticalScrollIndicator={false}
            />

            <ScanDetailModal scan={selectedScan} visible={modalVisible} onClose={() => setModalVisible(false)} C={C} />
        </Screen>
    );
}