import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";

export const useScreenSecurity = () => {
  useEffect(() => {
    // block screenshots on sensitive screens
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);
};
