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
}