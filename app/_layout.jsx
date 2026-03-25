// app/_layout.jsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import Providers from '../src/providers/index';
import BiometricGate from '../src/components/auth/BiometricGate';
import { useInactivityLock } from '../src/hooks/useInactivityLock';

/**
 * InnerLayout
 *
 * KEY FIX:
 * The Stack navigator MUST render unconditionally and immediately so that
 * expo-router's Root Layout mounts fully before any navigation (e.g. from
 * AuthProvider) is attempted.
 *
 * BiometricGate is now rendered as an OVERLAY on top of the Stack using
 * absolute positioning — NOT as a wrapper that gates the Stack rendering.
 * This means:
 *   1. Stack mounts immediately → AuthProvider can navigate safely ✓
 *   2. BiometricGate overlay appears on top when isLocked = true ✓
 */
function InnerLayout() {
    useInactivityLock();

    return (
        <View style={styles.root}>
            {/* Navigator always mounts first — never gated */}
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
            </Stack>

            <StatusBar style="auto" />

            {/* Biometric gate renders as absolute overlay on top of everything */}
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