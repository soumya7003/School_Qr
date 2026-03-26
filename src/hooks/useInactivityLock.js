// src/hooks/useInactivityLock.js
import { useCallback, useEffect, useRef } from 'react';
import { AppState, PanResponder } from 'react-native';
import { useBiometricStore } from '../store/biometricStore';
import { useLogout } from '@/providers/AuthProvider';

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

/**
 * Combines two lock strategies:
 * 1. Touch inactivity → auto-logout after INACTIVITY_TIMEOUT
 * 2. Background → foreground → biometric lock (only after a real background cycle)
 *
 * Returns panHandlers to spread onto the root view.
 */
export function useInactivityLock() {
  const logout = useLogout();
  const { isBiometricEnabled, isAppReady, setLocked } = useBiometricStore();

  // --- Inactivity timer ---
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Stable pan responder — created once
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // don't consume the touch
      },
    })
  ).current;

  // Start inactivity timer on mount
  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
  }, [resetTimer]);

  // --- Background → foreground biometric lock ---
  const appStateRef = useRef(AppState.currentState);
  const wentToBackgroundRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;

      if (nextState === 'background') {
        wentToBackgroundRef.current = true;
        // Pause inactivity timer while backgrounded
        clearTimeout(timerRef.current);
      }

      // iOS: brief inactive (control centre, calls) — ignore
      if (nextState === 'inactive' && prevState === 'active') {
        // intentionally empty
      }

      if (nextState === 'active') {
        if (wentToBackgroundRef.current && isBiometricEnabled && isAppReady) {
          setLocked(true);
        } else {
          // Resume inactivity countdown on foreground
          resetTimer();
        }
        wentToBackgroundRef.current = false;
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isBiometricEnabled, isAppReady, setLocked, resetTimer]);

  return panResponder.panHandlers;
}