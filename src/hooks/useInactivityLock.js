import { useBiometricStore } from "@/store/biometricStore";
import { useCallback, useEffect, useRef } from "react";
import { AppState, PanResponder } from "react-native";

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

export function useInactivityLock() {
  const {
    hasPinSetup,
    isBiometricEnabled, // ✅ FIX 1: include biometric in lock condition
    isAppReady,
    setLocked,
    isLocked,
    suppressLock,
  } = useBiometricStore();

  // ✅ FIX 1: Lock if EITHER pin OR biometric is enabled
  const isAnyLockEnabled = hasPinSetup || isBiometricEnabled;

  const timerRef = useRef(null);

  const lockApp = useCallback(() => {
    if (isAnyLockEnabled && !isLocked) setLocked(true);
  }, [isAnyLockEnabled, isLocked, setLocked]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lockApp, INACTIVITY_TIMEOUT);
  }, [lockApp]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        if (!isLocked) resetTimer();
        return false;
      },
    })
  ).current;

  useEffect(() => {
    if (!isLocked) resetTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetTimer, isLocked]);

  // ✅ FIX 2: Use refs to avoid stale closures in the AppState listener
  const isAnyLockEnabledRef = useRef(isAnyLockEnabled);
  const isAppReadyRef = useRef(isAppReady);
  const suppressLockRef = useRef(suppressLock);
  const isLockedRef = useRef(isLocked);

  useEffect(() => { isAnyLockEnabledRef.current = isAnyLockEnabled; }, [isAnyLockEnabled]);
  useEffect(() => { isAppReadyRef.current = isAppReady; }, [isAppReady]);
  useEffect(() => { suppressLockRef.current = suppressLock; }, [suppressLock]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);

  const appStateRef = useRef(AppState.currentState);
  const wentToBackgroundRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        wentToBackgroundRef.current = true;
        clearTimeout(timerRef.current);
      }

      if (nextState === "active") {
        // ✅ FIX 2: Read from refs — always fresh values, no stale closure
        if (
          wentToBackgroundRef.current &&
          isAnyLockEnabledRef.current &&
          isAppReadyRef.current &&
          !suppressLockRef.current &&
          !isLockedRef.current
        ) {
          setLocked(true);
        } else if (!isLockedRef.current) {
          resetTimer();
        }
        wentToBackgroundRef.current = false;
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  // ✅ Only depends on stable setLocked and resetTimer — no more stale captures
  }, [setLocked, resetTimer]);

  return panResponder.panHandlers;
}