// app/_layout.jsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import Providers from '@/providers';
import BiometricGate from '@/components/auth/BiometricGate';
import { useInactivityLock } from '@/hooks/useInactivityLock';
import { loadStoredLanguage } from '@/i18n';  // <-- import the loader

function InnerLayout() {
  useInactivityLock();

  // Load stored language as soon as the app mounts
  useEffect(() => {
    loadStoredLanguage();
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

const styles = StyleSheet.create({ root: { flex: 1 } });