<<<<<<< HEAD
/**
 * @file app/_layout.jsx
 * @description Root layout — SchoolQR Guardian
 */

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
=======
/**
 * app/(modals)/_layout.jsx
 *
 * Simple modal stack — presentation style is already set in root
 * _layout.jsx via <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
 * so we just need a plain Stack here for the screens inside.
 *
 * No auth guard needed here — modals are only reachable from within
 * (app)/ screens which already have the isAuthenticated guard.
 */

import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_bottom",
      }}
    />
  );
>>>>>>> 2065c22146e4ebfa3f1df268c6bea2a07931993b
}