import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useBiometricStore = create(
    persist(
        (set) => ({
            isBiometricEnabled: false,
            setBiometricEnabled: (enabled) => set({ isBiometricEnabled: enabled }),
        }),
        {
            name: 'biometric-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);