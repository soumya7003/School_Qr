/**
 * providers/index.jsx
 *
 * FIXED: ThemeProvider added so useTheme() works everywhere.
 * Order: SafeAreaProvider → ThemeProvider → AuthProvider
 */

import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }) {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}