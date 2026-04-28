// components/scan-history/ScanTimelineItem.jsx

import { useReverseGeocode } from '@/hooks/useReverseGeocode.js';
import { styles } from '@/styles/scanHistory.styles.js';
import { formatFullDate, formatRelativeTime, formatTime } from '@/utils/formatters.utils.js';
import { getScanConfig } from '@/utils/scanConfig.utils.js';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';


export function ScanTimelineItem({ scan, index, onPress, C }) {
    const config = getScanConfig(scan.result, scan.scan_purpose, C);
    const isEmergency = scan.scan_purpose === 'EMERGENCY';

    const lat = scan?.latitude ?? scan?.lat;
    const lng = scan?.longitude ?? scan?.lng;

    const { placeName, loading } = useReverseGeocode(lat, lng, true);
    const location = loading ? 'Loading...' : (placeName ?? 'Location unavailable');

    return (
        <TouchableOpacity onPress={() => onPress(scan)} activeOpacity={0.7}>
            <Animated.View entering={FadeInUp.delay(index * 50).duration(400)} layout={Layout.springify()}>
                <View style={[styles.timelineItem, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <View style={styles.timelineLeft}>
                        <LinearGradient colors={config.gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.timelineLine} />
                        <View style={[styles.timelineDot, { backgroundColor: config.badgeColor, shadowColor: config.badgeColor }]}>
                            <Feather name={config.icon} size={14} color="#fff" />
                        </View>
                    </View>

                    <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                            <View style={styles.timelineHeaderLeft}>
                                <Text style={[styles.timelineTitle, { color: C.tx }]}>{config.label}</Text>
                                {isEmergency && (
                                    <View style={[styles.emergencyBadge, { backgroundColor: C.redBg }]}>
                                        <Text style={[styles.emergencyBadgeText, { color: C.red }]}>EMERGENCY</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.timelineTime, { color: C.tx3 }]}>{formatRelativeTime(scan.created_at)}</Text>
                        </View>

                        <View style={styles.timelineDetails}>
                            <View style={styles.detailRow}>
                                <Feather name="map-pin" size={13} color={C.tx3} />
                                <Text style={[styles.detailText, { color: C.tx2 }]} numberOfLines={1}>{location}</Text>
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