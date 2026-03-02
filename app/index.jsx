/**
 * Entry point — redirects based on auth state.
 * During UI dev: isAuthenticated=true in store → goes straight to home.
 */

import { useAuthStore } from '@/src/features/auth/auth.store';
import { Redirect } from 'expo-router';

export default function Index() {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated
        ? <Redirect href="/(app)/home" />
        : <Redirect href="/(auth)/login" />;
}