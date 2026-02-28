/**
 * AuthProvider — Reads auth store and handles redirect logic.
 * Fixes:
 *  1. Added inRoot check so index page properly redirects when authenticated
 *  2. Added segments.length guard to prevent redirect before router is ready
 */

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function AuthProvider({ children }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        // ✅ FIX 1: Wait until segments are populated before redirecting
        if (!segments || segments.length === 0) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';
        // ✅ FIX 2: Treat root index as a page that needs redirecting too
        const inRoot = !inAuthGroup && !inAppGroup;

        if (!isAuthenticated && !inAuthGroup) {
            // Not logged in and not on auth screens → send to login
            router.replace('/(auth)/login');
        } else if (isAuthenticated && (inAuthGroup || inRoot)) {
            // Logged in but on auth screens OR stuck on index → send to home
            router.replace('/(app)/home');
        }
    }, [isAuthenticated, segments]);

    return children;
}