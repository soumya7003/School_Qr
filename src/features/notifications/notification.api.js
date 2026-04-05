/**
 * features/notifications/notification.api.js
 *
 * Saves Expo push token to backend → ParentDevice table
 */

import { apiClient } from "@/lib/api/apiClient";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const notificationApi = {
  /**
   * POST /parent/device-token
   * Saves or updates the push token for this device
   */

  registerDeviceToken: async (token) => {
    const { data } = await apiClient.post("/parent/device-token", {
      token,
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      device_name: Device.deviceName ?? null,
      deviceModel: Device.deviceModel ?? null,
      os_version: Device.osVersion ?? null,
    });
    return data;
  },
};
