import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useBiometricStore } from '@/store/biometricStore';

// Simple store for lock state (could also be Zustand)
let isLocked = false;
const listeners = new Set();

function setLocked(locked) {
    isLocked = locked;
    listeners.forEach(fn => fn(isLocked));
}

export function useLockState() {
    const [locked, setLockedState] = useState(isLocked);
    useEffect(() => {
        const listener = (newLocked) => setLockedState(newLocked);
        listeners.add(listener);
        return () => listeners.delete(listener);
    }, []);
    return locked;
}

export function unlock() {
    setLocked(false);
}

/**
 * Hook to set lock when app goes to background (if biometric is enabled).
 */
export function useInactivityLock() {
    const isBiometricEnabled = useBiometricStore((state) => state.isBiometricEnabled);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' && isBiometricEnabled) {
                setLocked(true);
            }
        });
        return () => subscription.remove();
    }, [isBiometricEnabled]);
}