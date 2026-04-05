import { SUSPICIOUS_PATHS_ANDROID } from "@/constants/constants";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

// ✅ FIX: Make this a lazy function – call only when needed, not on import
let _rootedCache = null;

export const isDeviceRooted = async (forceCheck = false) => {
  // Return cached result if available and not forcing refresh
  if (!forceCheck && _rootedCache !== null) return _rootedCache;

  // Emulator - allow in dev
  if (!Device.isDevice) {
    _rootedCache = false;
    return false;
  }

  if (Platform.OS === "android") {
    for (const path of SUSPICIOUS_PATHS_ANDROID) {
      const info = await FileSystem.getInfoAsync(path).catch(() => null);
      if (info?.exists) {
        _rootedCache = true;
        return true;
      }
    }
  }

  _rootedCache = false;
  return false;
};

export const isEmulator = () => !Device.isDevice;

// ✅ FIX: Add reset function for testing / re-evaluation
export const resetRootedCache = () => {
  _rootedCache = null;
};
