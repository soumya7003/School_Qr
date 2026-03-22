import { SUSPICIOUS_PATHS_ANDROID } from "@/constants/constants";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export const isDeviceRooted = async () => {
  if (!Device.isDevice) return false; // emulator - allow in dev

  if (Platform.OS === "android") {
    for (const path of SUSPICIOUS_PATHS_ANDROID) {
      const info = await FileSystem.getInfoAsync(path).catch(() => null);
      if (info?.exists) return true;
    }
  }
  return false;
};

export const isEmulator = () => !Device.isDevice;
