// src/hooks/useInactivityLock.js
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useBiometricStore } from '../store/biometricStore';

/**
 * useInactivityLock
 *
 * RULES:
 * 1. NEVER locks on first mount / cold start — only after a real background → foreground cycle
 * 2. Only locks if isBiometricEnabled = true
 * 3. Only locks if isAppReady = true (navigator has mounted)
 * 4. Tracks whether the app actually went to background first before locking on resume
 */
export function useInactivityLock() {
  const appStateRef = useRef(AppState.currentState);
  // Track if app actually went to background (not just inactive briefly on iOS)
  const wentToBackgroundRef = useRef(false);

  const { isBiometricEnabled, isAppReady, setLocked } = useBiometricStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;

      // App going to background — mark it
      if (nextState === 'background') {
        wentToBackgroundRef.current = true;
      }

      // App going inactive (iOS only — happens briefly when control center opens etc.)
      // Don't mark as "went to background" for inactive alone
      if (nextState === 'inactive' && prevState === 'active') {
        // Do nothing — wait to see if it goes to background next
      }

      // App returning to foreground
      if (nextState === 'active') {
        // Only lock if:
        // 1. App actually went to background (not just inactive)
        // 2. Biometric is enabled by user
        // 3. App navigator is fully ready
        if (
          wentToBackgroundRef.current &&
          isBiometricEnabled &&
          isAppReady
        ) {
          setLocked(true);
        }
        // Reset background flag after handling
        wentToBackgroundRef.current = false;
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isBiometricEnabled, isAppReady, setLocked]);
}