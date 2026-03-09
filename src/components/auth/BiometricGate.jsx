/**
 * src/components/auth/BiometricGate.jsx
 *
 * FIX 1: Wait for Zustand persist hydration before deciding to lock/unlock.
 *         Without this, isBiometricEnabled reads as false for ~50ms on cold
 *         start → gate skips → app unlocks → SecureStore value loads → too late.
 *
 * FIX 2: Check hardware biometrics on mount and update store.
 *         isDeviceSupported is no longer hardcoded — it comes from hardware.
 *
 * FIX 3: AppState listener uses a ref for unlocked to avoid stale closure bug.
 *         Previously: unlocked in closure was always the initial value (false),
 *         so authenticate() fired even when already unlocked on state updates.
 */

import { useAuthStore } from '@/features/auth/auth.store';
import { checkDeviceBiometrics, promptBiometric } from '@/services/biometricService';
import { useBiometricStore } from '@/store/biometricStore';
import { colors, radius, spacing, typography } from '@/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

export default function BiometricGate({ children }) {
    const isBiometricEnabled = useBiometricStore((s) => s.isBiometricEnabled);
    const setDeviceSupported = useBiometricStore((s) => s.setDeviceSupported);
    const setBiometricType = useBiometricStore((s) => s.setBiometricType);
    const biometricType = useBiometricStore((s) => s.biometricType);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const logout = useAuthStore((s) => s.logout);

    const [unlocked, setUnlocked] = useState(false);
    const [error, setError] = useState(null);

    // FIX 1: Wait for SecureStore hydration before rendering gate decision
    // Zustand persist takes ~50ms to hydrate from SecureStore on cold start
    const [storeHydrated, setStoreHydrated] = useState(false);

    // FIX 3: Ref to avoid stale closure in AppState listener
    const unlockedRef = useRef(false);
    const syncUnlocked = (val) => {
        unlockedRef.current = val;
        setUnlocked(val);
    };

    const authenticate = useCallback(async () => {
        setError(null);
        const result = await promptBiometric({
            reason: 'Unlock to access the app',
        });

        if (result.success) {
            syncUnlocked(true);
        } else {
            setError(result.error ?? 'Authentication failed');
        }
    }, []);

    // FIX 1: Subscribe to Zustand hydration
    useEffect(() => {
        // useBiometricStore.persist.hasHydrated() is available after persist middleware
        const checkHydration = () => {
            if (useBiometricStore.persist?.hasHydrated()) {
                setStoreHydrated(true);
            } else {
                // Not yet hydrated — subscribe to onFinishHydration
                const unsub = useBiometricStore.persist?.onFinishHydration(() => {
                    setStoreHydrated(true);
                    unsub?.();
                });
                // Fallback: if persist API not available, just set true
                if (!unsub) setStoreHydrated(true);
            }
        };
        checkHydration();
    }, []);

    // FIX 2: Check hardware on mount — update store with real values
    useEffect(() => {
        if (!storeHydrated) return;

        checkDeviceBiometrics().then((result) => {
            setDeviceSupported(result.supported);
            if (result.type) setBiometricType(result.type);
        });
    }, [storeHydrated]);

    // Trigger biometric gate on mount (after hydration)
    useEffect(() => {
        if (!storeHydrated) return;

        if (isAuthenticated && isBiometricEnabled) {
            checkDeviceBiometrics().then(({ supported }) => {
                if (supported) authenticate();
                else syncUnlocked(true); // hardware gone, skip gate
            });
        } else {
            syncUnlocked(true); // biometric disabled, no gate needed
        }
    }, [storeHydrated, isAuthenticated, isBiometricEnabled]);

    // Re-lock when app goes to background
    useEffect(() => {
        if (!isBiometricEnabled) return;

        const sub = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'background' || nextState === 'inactive') {
                syncUnlocked(false);
            }
            // FIX 3: Use ref instead of state to avoid stale closure
            if (nextState === 'active' && !unlockedRef.current) {
                authenticate();
            }
        });
        return () => sub.remove();
    }, [isBiometricEnabled, authenticate]);

    // Wait for hydration — show nothing (root layout bg is #1a1a1a so no flash)
    if (!storeHydrated) return null;

    if (!isAuthenticated || unlocked) return children;

    return (
        <Animated.View entering={FadeIn} style={styles.container}>
            <View style={styles.card}>
                <BiometricIcon type={biometricType} />
                <Text style={styles.title}>App Locked</Text>
                <Text style={styles.subtitle}>
                    Verify your identity to continue
                </Text>

                {error && (
                    <Text style={styles.error}>
                        {friendlyError(error)}
                    </Text>
                )}

                <TouchableOpacity style={styles.btn} onPress={authenticate}>
                    <Text style={styles.btnText}>
                        {error ? 'Try Again' : 'Unlock'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Sign out instead</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

function friendlyError(code) {
    const map = {
        user_cancel: 'Authentication was cancelled.',
        lockout: 'Too many attempts. Try your device PIN.',
        lockout_permanent: 'Biometric locked. Use device PIN to unlock.',
        not_enrolled: 'No biometrics enrolled on this device.',
    };
    return map[code] ?? 'Authentication failed. Please try again.';
}

function BiometricIcon({ type }) {
    if (type === 'face') return (
        <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
            <Path d="M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 012 2v4m0 0v6m0-6H3m18 6v4a2 2 0 01-2 2h-4m0 0H9m6 0v-6"
                stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
            <Path d="M9 10v.01M15 10v.01M9.5 15a3.5 3.5 0 005 0"
                stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );

    return (
        <Svg width={64} height={64} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
            <Path d="M12 10a2 2 0 00-2 2v4M12 10a2 2 0 012 2v4M12 10V8m0 8v2m-4-6c0-2.21 1.79-4 4-4s4 1.79 4 4M4 12c0-4.42 3.58-8 8-8s8 3.58 8 8"
                stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.screenBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[6],
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[8],
        alignItems: 'center',
        width: '100%',
        gap: spacing[3],
    },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center' },
    error: { ...typography.bodySm, color: colors.error, textAlign: 'center' },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[3],
        marginTop: spacing[2],
        width: '100%',
        alignItems: 'center',
    },
    btnText: { ...typography.btnMd, color: colors.white },
    logoutBtn: { marginTop: spacing[2] },
    logoutText: { ...typography.bodyMd, color: colors.textSecondary },
});