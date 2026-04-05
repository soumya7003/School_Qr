// src/components/auth/BiometricGate.jsx
import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useBiometricStore } from '@/store/biometricStore';
import { authenticateForAppResume } from '@/services/biometricService';
import { Ionicons } from '@expo/vector-icons';

/**
 * BiometricGate
 *
 * Pure overlay component — takes NO children prop.
 * Renders as absoluteFill on top of the Stack navigator.
 *
 * Usage in _layout.jsx:
 *   <View style={{ flex: 1 }}>
 *     <Stack ... />        ← always mounts, AuthProvider can navigate safely
 *     <BiometricGate />   ← sits on top as overlay when locked
 *   </View>
 *
 * When isLocked = false OR isBiometricEnabled = false → renders nothing (null).
 * When isLocked = true  AND isBiometricEnabled = true  → full-screen overlay.
 */
export default function BiometricGate() {
    const { isLocked, isBiometricEnabled, setLocked } = useBiometricStore();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authFailed, setAuthFailed] = useState(false);

    const triggerBiometric = useCallback(async () => {
        if (isAuthenticating) return;

        setIsAuthenticating(true);
        setAuthFailed(false);

        try {
            const success = await authenticateForAppResume();
            if (success) {
                setLocked(false);
                setAuthFailed(false);
            } else {
                setAuthFailed(true);
            }
        } catch (error) {
            console.error('[BiometricGate] error:', error);
            setAuthFailed(true);
        } finally {
            setIsAuthenticating(false);
        }
    }, [isAuthenticating, setLocked]);

    // Auto-fire biometric prompt when gate becomes visible
    useEffect(() => {
        if (isLocked && isBiometricEnabled) {
            const timer = setTimeout(() => {
                triggerBiometric();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isLocked, isBiometricEnabled]);

    // Not locked or feature disabled — render nothing
    if (!isBiometricEnabled || !isLocked) {
        return null;
    }

    // ── Full-screen lock overlay ──────────────────────────────────────────────
    return (
        <View style={styles.overlay}>

            {/* Brand */}
            <View style={styles.brandArea}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={36} color="#fff" />
                </View>
                <Text style={styles.appName}>RESQID</Text>
                <Text style={styles.subtitle}>Your session is locked</Text>
            </View>

            {/* Scan area */}
            <View style={styles.scanArea}>
                {isAuthenticating ? (
                    <>
                        <ActivityIndicator size="large" color="#4f8ef7" />
                        <Text style={styles.scanningText}>Scanning biometric…</Text>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.fingerprintButton,
                                authFailed && styles.fingerprintButtonError,
                            ]}
                            onPress={triggerBiometric}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={authFailed ? 'finger-print-outline' : 'finger-print'}
                                size={52}
                                color={authFailed ? '#ff6b6b' : '#4f8ef7'}
                            />
                        </TouchableOpacity>

                        <Text style={styles.tapText}>
                            {authFailed
                                ? 'Authentication failed. Tap to retry'
                                : 'Tap to scan your biometric'}
                        </Text>

                        {authFailed && (
                            <Text style={styles.errorText}>
                                Could not verify your identity. Please try again.
                            </Text>
                        )}
                    </>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#555" />
                <Text style={styles.footerText}>  Protected by biometric security</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // absoluteFill sits on top of the Stack — zIndex ensures nothing shows through
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0d0d14',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 80,
        paddingHorizontal: 32,
        zIndex: 9999,
        elevation: 9999, // Android needs elevation too
    },
    brandArea: {
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1a1a2e',
        borderWidth: 1.5,
        borderColor: '#2a2a4a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    appName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        letterSpacing: 0.3,
    },
    scanArea: {
        alignItems: 'center',
        gap: 20,
    },
    fingerprintButton: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#1a1a2e',
        borderWidth: 2,
        borderColor: '#4f8ef730',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4f8ef7',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    fingerprintButtonError: {
        borderColor: '#ff6b6b30',
        shadowColor: '#ff6b6b',
    },
    scanningText: {
        fontSize: 15,
        color: '#4f8ef7',
        letterSpacing: 0.3,
    },
    tapText: {
        fontSize: 15,
        color: '#aaa',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    errorText: {
        fontSize: 13,
        color: '#ff6b6b',
        textAlign: 'center',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#555',
        letterSpacing: 0.2,
    },
});