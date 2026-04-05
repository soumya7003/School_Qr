/**
 * features/notifications/notification.service.js
 *
 * Handles permission request + Expo push token retrieval
 */

import * as Device from "expo-device";
import * as Notification from "expo-notifications";
import { Platform } from "react-native";
import { notificationApi } from "./notification.api";

const PROJECT_ID = "8b193d0d-4f69-41d2-8e0e-59aeecc83565";

/**
 * Gets Expo push token after requesting permission.
 * Returns null if permission denied or running on simulator.
 */
const getExpoPushToken = async () => {
  if (!Device.isDevice) return null; // simulator skip

  const { status: existing } = await Notification.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notification.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notification.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notification.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notification.getExpoPushTokenAsync({
    projectId: PROJECT_ID,
  });
  return tokenData.data;
};

/**
 * Call this after login/register success.
 * Gets token and sends it to backend — silent fail (never blocks auth flow).
 */
export const registerPushToken = async () => {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await notificationApi.registerDeviceToken(token);
  } catch {
    // silent — push token failure must never break login
  }
};
