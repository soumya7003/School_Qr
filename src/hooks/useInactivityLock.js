// src/hooks/useInactivityLock.js
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useBiometricStore } from '../store/biometricStore';

/**
 * useInactivityLock
 *
 * Listens to AppState changes. When the app moves to the background
 * and then returns to the foreground, it sets isLocked = true so that
 * BiometricGate fires the biometric prompt automatically.
 *
 * Place this hook ONCE in the root _layout.jsx — it will protect every page.
 */
export function useInactivityLock() {
  const appStateRef = useRef(AppState.currentState);
  const { isBiometricEnabled, isLocked, setLocked } = useBiometricStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prevState = appStateRef.current;

      // App went to background or became inactive
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        appStateRef.current = nextAppState;
        return;
      }

      // App came back to foreground from background/inactive
      if (
        (prevState === 'background' || prevState === 'inactive') &&
        nextAppState === 'active'
      ) {
        if (isBiometricEnabled && !isLocked) {
          // Lock the app — BiometricGate will show the prompt
          setLocked(true);
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isBiometricEnabled, isLocked, setLocked]);
}