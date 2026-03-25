import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLockState, unlock } from '@/hooks/useInactivityLock';
import { authenticate } from '@/services/biometricService';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';

export default function BiometricGate() {
    const { colors: C } = useTheme();
    const { t } = useTranslation();
    const isLocked = useLockState();
    const [authenticating, setAuthenticating] = useState(false);

    useEffect(() => {
        if (isLocked && !authenticating) {
            handleAuthenticate();
        }
    }, [isLocked]);

    const handleAuthenticate = async () => {
        setAuthenticating(true);
        const result = await authenticate({
            promptMessage: t('biometric.unlockMessage', 'Unlock the app'),
        });
        setAuthenticating(false);
        if (result.success) {
            unlock();
        } else if (result.error !== 'user_cancel') {
            // Authentication failed, retry after a short delay
            setTimeout(handleAuthenticate, 1000);
        } else {
            // user cancelled, but we remain locked – maybe we could show a message
            console.log('User cancelled biometric');
        }
    };

    if (!isLocked) return null;

    return (
        <Modal transparent visible animationType="fade">
            <View style={[styles.overlay, { backgroundColor: C.bg + 'F0' }]}>
                <View style={[styles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Text style={[styles.title, { color: C.tx }]}>
                        {t('biometric.lockedTitle', 'App Locked')}
                    </Text>
                    <Text style={[styles.message, { color: C.tx2 }]}>
                        {t('biometric.lockedMessage', 'Please authenticate to continue')}
                    </Text>
                    {authenticating ? (
                        <ActivityIndicator size="large" color={C.primary} />
                    ) : (
                        <Button
                            title={t('biometric.tryAgain', 'Try Again')}
                            onPress={handleAuthenticate}
                            style={styles.button}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    card: {
        width: '80%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        marginTop: 8,
    },
});