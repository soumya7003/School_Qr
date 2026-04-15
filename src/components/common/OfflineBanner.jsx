// src/components/common/OfflineBanner.jsx
import { StyleSheet, Text, View } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineBanner() {
    const isOnline = useNetworkStatus();
    if (isOnline) return null;

    return (
        <View style={styles.banner}>
            <Text style={styles.text}>⚠ No internet — showing cached data</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#FF6B35',
        padding: 8,
        alignItems: 'center',
    },
    text: { color: '#fff', fontSize: 13, fontWeight: '600' },
}); 4
