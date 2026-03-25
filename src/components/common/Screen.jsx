/**
 * Screen — Safe area wrapper for all screens
 */

import { colors } from '@/theme';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({
    children,
    scroll = false,
    style,
    contentStyle,
    edges = ['top', 'left', 'right'],
    bg = colors.screenBg,
}) {
    const Inner = scroll ? ScrollView : View;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={edges}>
            <Inner
                style={styles.fill}
                contentContainerStyle={scroll ? [styles.scrollContent, contentStyle] : undefined}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {!scroll && (
                    <View style={[styles.fill, contentStyle]}>{children}</View>
                )}
                {scroll && children}
            </Inner>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    fill: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});