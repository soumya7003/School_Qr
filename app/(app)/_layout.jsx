/**
 * app/(app)/_layout.jsx - PRODUCTION READY
 */

import TabBar from '@/components/navigation/TabBar';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useFetchOnMount } from '@/hooks/useFetchOnMount';
import { useInactivityLock } from '@/hooks/useInactivityLock';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AppLayout() {
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const profileHydrated = useProfileStore((s) => s.isHydrated);

    // Hydrate profile store on mount
    useEffect(() => {
        useProfileStore.getState().hydrate();
    }, []);

    // Fetch fresh profile if stale
    useFetchOnMount();

    // Inactivity lock with biometric
    const panHandlers = useInactivityLock();

    // Loading state
    if (!isHydrated || !profileHydrated) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E8342A" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return null; // AuthProvider will redirect
    }

    return (
        <View style={styles.container} {...panHandlers}>
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
                <Tabs.Screen name='add-child' options={{ href: null }} />
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
        backgroundColor: '#0D0D0F',
        alignItems: 'center',
        justifyContent: 'center',
    },
});