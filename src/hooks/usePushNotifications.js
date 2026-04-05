// src/hooks/usePushNotifications.js
import { useAuthStore } from "@/features/auth/auth.store";
import { registerPushToken } from "@/features/notifications/notification.service";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";

// Configure notification handler for foreground messages
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook to initialize push notifications
 * - Requests permission
 * - Registers device token with backend
 * - Handles incoming notifications
 *
 * Usage: Call usePushNotifications() in root _layout.jsx
 */
export const usePushNotifications = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const responseListener = useRef(null);
  const notificationListener = useRef(null);

  useEffect(() => {
    // Register token when user is authenticated
    if (isAuthenticated) {
      registerPushToken();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // ✅ FIX: Use correct subscription removal method
    // For expo-notifications, the returned subscription has a .remove() method

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);

        // Handle navigation based on notification data
        if (data?.screen) {
          // router.push(data.screen);
        }
      });

    return () => {
      // ✅ FIX: Use .remove() instead of removeNotificationSubscription
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return null;
};
