import { colors } from '@/src/theme';
import { Stack } from 'expo-router';

export default function ModalsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                presentation: 'modal',
                contentStyle: { backgroundColor: colors.screenBg },
            }}
        />
    );
}