// src/hooks/useInactivityLock.js
import { authenticateForAppResume } from "@/services/biometricService";
import { useBiometricStore } from "@/store/biometricStore";
import { useCallback, useEffect, useRef } from "react";
import { AppState, PanResponder } from "react-native";

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * Combines two lock strategies:
 * 1. Touch inactivity → lock screen with biometric
 * 2. Background → foreground → biometric lock
 *
 * Returns panHandlers to spread onto the root view.
 */
export function useInactivityLock() {
  const { isBiometricEnabled, isAppReady, setLocked, isLocked } =
    useBiometricStore();

  // --- Inactivity timer ---
  const timerRef = useRef(null);

  const lockApp = useCallback(() => {
    if (isBiometricEnabled && !isLocked) {
      setLocked(true);
    }
  }, [isBiometricEnabled, isLocked, setLocked]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lockApp();
    }, INACTIVITY_TIMEOUT);
  }, [lockApp]);

  // Handle biometric unlock when app is locked
  const handleUnlock = useCallback(async () => {
    if (!isLocked) return;

    const success = await authenticateForAppResume();
    if (success) {
      setLocked(false);
      resetTimer(); // Reset inactivity timer after unlock
    }
  }, [isLocked, setLocked, resetTimer]);

  // Listen for app state changes to trigger unlock
  useEffect(() => {
    if (isLocked && isAppReady) {
      handleUnlock();
    }
  }, [isLocked, isAppReady, handleUnlock]);

  // Stable pan responder — created once
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        if (!isLocked) {
          resetTimer();
        }
        return false; // don't consume the touch
      },
    }),
  ).current;

  // Start inactivity timer on mount
  useEffect(() => {
    if (!isLocked) {
      resetTimer();
    }
    return () => clearTimeout(timerRef.current);
  }, [resetTimer, isLocked]);

  // --- Background → foreground biometric lock ---
  const appStateRef = useRef(AppState.currentState);
  const wentToBackgroundRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = appStateRef.current;

      if (nextState === "background") {
        wentToBackgroundRef.current = true;
        clearTimeout(timerRef.current);
      }

      if (nextState === "active") {
        if (wentToBackgroundRef.current && isBiometricEnabled && isAppReady) {
          setLocked(true);
        } else if (!isLocked) {
          resetTimer();
        }
        wentToBackgroundRef.current = false;
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isBiometricEnabled, isAppReady, setLocked, resetTimer, isLocked]);

  return panResponder.panHandlers;
}
