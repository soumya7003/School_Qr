// components/scan-history/LocationSkeleton.jsx

import { styles } from '@/styles/scanHistory.styles.js';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export function LocationSkeleton({ C }) {
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 800 }), withTiming(0.5, { duration: 800 })),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[styles.skeletonContainer, animatedStyle]}>
            <View style={[styles.skeletonIcon, { backgroundColor: C.s3 }]} />
            <View style={styles.skeletonTextContainer}>
                <View style={[styles.skeletonText, { backgroundColor: C.s3, width: '80%' }]} />
                <View style={[styles.skeletonTextSmall, { backgroundColor: C.s3, width: '40%' }]} />
            </View>
        </Animated.View>
    );
}