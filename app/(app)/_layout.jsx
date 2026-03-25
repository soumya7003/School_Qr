// app/_layout.jsx
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Providers from '@/providers';
import BiometricGate from '../../src/components/auth/BiometricGate';
import { useInactivityLock } from '../../src/hooks/useInactivityLock';
import { useBiometricStore } from '../../src/store/biometricStore';

function InnerLayout() {
    useInactivityLock();

    const { loadBiometricPreference } = useBiometricStore();

    useEffect(() => {
        loadBiometricPreference();
    }, []);

    return (
        <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
            </Stack>

            <StatusBar style="auto" />

            <BiometricGate />
        </View>
    );
}

export default function RootLayout() {
    return (
        <Providers>
            <InnerLayout />
        </Providers>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});