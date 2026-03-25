import { useLogout } from "@/providers/AuthProvider";
import { useEffect, useRef } from "react";
import { AppState, PanResponder } from "react-native";

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export const useInactivityLock = () => {
  const timer = useRef(null);
  const logout = useLogout();

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  // Reset timer on any touch
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      resetTimer();
      return false; // don't consume touch
    },
  });

  useEffect(() => {
    resetTimer();
    // Also reset on app foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") resetTimer();
    });

    return () => {
      clearTimeout(timer.current);
      sub.remove();
    };
  }, []);

  return panResponder.panHandlers;
};
