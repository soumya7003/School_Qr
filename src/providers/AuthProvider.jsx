/**
 * AuthProvider — Reads auth store and handles redirect logic.
 * During UI dev, isAuthenticated defaults to true in the store,
 * so the app opens straight to home.
 */

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function AuthProvider({ children }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(app)/home');
        }
    }, [isAuthenticated, segments]);

    return children;
}