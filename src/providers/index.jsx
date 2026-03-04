/**
 * Providers — Single wrapper for all app providers.
 * Used in app/_layout.jsx
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './AuthProvider';

export default function Providers({ children }) {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SafeAreaProvider>
    );
}