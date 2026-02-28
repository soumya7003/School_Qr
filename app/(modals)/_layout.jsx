/**
 * @file app/_layout.jsx
 * @description Root layout — SchoolQR Guardian
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Providers from '../../src/providers';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Providers>
        <StatusBar style="light" translucent />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
        </Stack>
      </Providers>
    </GestureHandlerRootView>
  );
}