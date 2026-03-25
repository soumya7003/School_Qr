import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Check if biometric hardware is available AND user has enrolled at least one method.
 */
export async function isBiometricAvailable() {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    } catch (error) {
        console.error('[biometricService] isBiometricAvailable error:', error);
        return false;
    }
}

/**
 * Prompt user for biometric authentication.
 * Returns { success: boolean, error?: string }
 */
export async function authenticate({ promptMessage = 'Authenticate' } = {}) {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use device passcode',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });
        if (result.success) {
            return { success: true };
        } else {
            // result.error can be 'user_cancel', 'locked', etc.
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('[biometricService] authenticate error:', error);
        return { success: false, error: 'exception' };
    }
}