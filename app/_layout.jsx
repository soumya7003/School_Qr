import { initI18n } from '@/src/i18n';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initI18n().then(() => setReady(true));
    }, []);

    // Block render until translations are loaded
    // Prevents English flash before Bengali/Hindi loads
    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
        </Stack>
    );
}