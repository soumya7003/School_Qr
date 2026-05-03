// components/scan-history/ScanDetailModal.jsx

import { useReverseGeocode } from '@/hooks/useReverseGeocode.js';
import { styles } from '@/styles/scanHistory.styles.js';
import { formatDateTime, getLocationString, hasCoordinates, openMaps } from '@/utils/formatters.utils.js';
import { getScanConfig } from '@/utils/scanConfig.utils.js';
import { Feather } from '@expo/vector-icons';
import { Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LocationSkeleton } from './scanHistory.index';


export function ScanDetailModal({ scan, visible, onClose, C }) {
    if (!scan || !visible) return null;

    const config = getScanConfig(scan.result, scan.scan_purpose, C);
    const ipLocation = getLocationString(scan);
    const hasGpsLocation = hasCoordinates(scan);
    const { placeName, loading: locationLoading, usingFallback } = useReverseGeocode(
        scan?.latitude,
        scan?.longitude,
        visible && hasGpsLocation
    );

    if (!scan || !visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={[styles.modalOverlay, { backgroundColor: C.bg + 'CC' }]}>
                <View style={[styles.modalContent, { backgroundColor: C.s2, borderColor: C.bd }]}>
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
                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>DATE & TIME</Text>
                            <View style={styles.detailRow}>
                                <Feather name="calendar" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx }]}>{formatDateTime(scan.created_at)}</Text>
                            </View>
                        </View>

                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>LOCATION</Text>
                            {hasGpsLocation && (
                                <View style={styles.locationGroup}>
                                    {locationLoading ? (
                                        <LocationSkeleton C={C} />
                                    ) : (
                                        <View style={styles.detailRow}>
                                            <Feather name="map-pin" size={16} color={C.ok} />
                                            <Text style={[styles.detailLabel, { color: C.tx3 }]}>GPS:</Text>
                                            <Text style={[styles.detailValue, { color: C.tx, flex: 1 }]} numberOfLines={3}>
                                                {placeName}
                                                {usingFallback && placeName && !placeName.includes(',') && (
                                                    <Text style={{ color: C.tx3, fontSize: 11 }}> (via OpenStreetMap)</Text>
                                                )}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {ipLocation !== 'Location unavailable' && (
                                <View style={[styles.detailRow, { marginTop: hasGpsLocation ? 8 : 0 }]}>
                                    <Feather name="wifi" size={16} color={hasGpsLocation ? C.tx3 : C.primary} />
                                    <Text style={[styles.detailLabel, { color: C.tx3 }]}>{hasGpsLocation ? 'IP:' : 'Location:'}</Text>
                                    <Text style={[styles.detailValue, { color: hasGpsLocation ? C.tx3 : C.tx2, flex: 1 }]} numberOfLines={2}>{ipLocation}</Text>
                                </View>
                            )}

                            {hasGpsLocation && (
                                <TouchableOpacity style={[styles.mapButton, { backgroundColor: C.blueBg, borderColor: C.blueBd, marginTop: 12 }]} onPress={() => openMaps(scan.latitude, scan.longitude)}>
                                    <Feather name="map" size={16} color={C.blue} />
                                    <Text style={[styles.mapButtonText, { color: C.blue }]}>Open in Maps</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>SCANNER DEVICE</Text>
                            <View style={styles.detailRow}>
                                <Feather name="smartphone" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx2 }]}>{scan.user_agent?.substring(0, 100) || 'Unknown device'}</Text>
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

                        <View style={[styles.detailSection, { borderBottomColor: C.bd }]}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>NETWORK INFO</Text>
                            <View style={styles.detailRow}>
                                <Feather name="globe" size={16} color={C.primary} />
                                <Text style={[styles.detailValue, { color: C.tx2 }]}>IP: {scan.ip_address || 'Not recorded'}</Text>
                            </View>
                            {scan.response_time_ms && (
                                <View style={styles.detailRow}>
                                    <Feather name="zap" size={16} color={C.primary} />
                                    <Text style={[styles.detailValue, { color: C.tx2 }]}>Response: {scan.response_time_ms}ms</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={[styles.detailSectionTitle, { color: C.tx3 }]}>SCAN TYPE</Text>
                            <View style={[styles.purposeBadge, { backgroundColor: config.badgeBg }]}>
                                <Feather name={scan.scan_purpose === 'EMERGENCY' ? 'alert-triangle' : 'grid'} size={14} color={config.badgeColor} />
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