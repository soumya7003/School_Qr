/**
 * app/(app)/_layout.jsx - DEBUG VERSION
 *
 * This version logs everything to help identify the blank screen issue.
 */

import TabBar from '@/components/navigation/TabBar';
import { useAuthStore } from '@/features/auth/auth.store';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function AppLayout() {
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // Log state on every render
    useEffect(() => {
        console.log('════════════════════════════════════════');
        console.log('[AppLayout] Render state:', {
            isHydrated,
            isAuthenticated,
            timestamp: new Date().toISOString(),
        });
        console.log('════════════════════════════════════════');
    });

    // Show diagnostic info instead of spinner
    if (!isHydrated) {
        console.log('[AppLayout] BLOCKING: Not hydrated');
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.debugText}>🔄 Hydrating store...</Text>
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 16 }} />
            </View>
        );
    }

    if (!isAuthenticated) {
        console.log('[AppLayout] BLOCKING: Not authenticated');
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.debugText}>🔐 Not authenticated</Text>
                <Text style={styles.debugSubtext}>AuthProvider should redirect to login</Text>
            </View>
        );
    }

    console.log('[AppLayout] ✅ RENDERING TABS');

    return (
        <View style={styles.container}>
            {/* Debug overlay to confirm tabs are rendering */}

            <Tabs
                tabBar={(props) => <TabBar {...props} />}
                screenOptions={{ headerShown: false }}
            >
                <Tabs.Screen name="home" />
                <Tabs.Screen name="qr" />
                <Tabs.Screen name="emergency" />
                <Tabs.Screen name="updates" />
                <Tabs.Screen name="settings" />
                <Tabs.Screen name="visibility" options={{ href: null }} />
                <Tabs.Screen name="scan-history" options={{ href: null }} />
                <Tabs.Screen name="support" options={{ href: null }} />
                <Tabs.Screen name="change-phone" options={{ href: null }} />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    debugText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    debugSubtext: {
        color: '#888888',
        fontSize: 14,
        textAlign: 'center',
    },
    debugOverlay: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 255, 0, 0.8)',
        padding: 8,
        alignItems: 'center',
        zIndex: 9999,
    },
    overlayText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: 'bold',
    },
});