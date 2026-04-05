// features/notifications/notification.api.js

import { apiClient } from "@/lib/api/apiClient";
import * as Device from "expo-device";
import { Platform } from "react-native";

export const notificationApi = {
  /**
   * POST /api/parents/device-token (✅ FIXED endpoint)
   * Saves or updates the push token for this device
   */
  registerDeviceToken: async (token) => {
    const { data } = await apiClient.post("/parents/device-token", {
      token,
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      device_name: Device.deviceName ?? null,
      deviceModel: Device.modelName ?? null,
      os_version: Device.osVersion ?? null,
    });
    return data;
  },
};
