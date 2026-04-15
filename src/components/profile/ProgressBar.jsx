// src/components/profile/ProgressBar.jsx
import { spacing } from '@/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function ProgressBar({ currentStep, totalSteps = 4, C }) {
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const animatedProgress = useRef(new Animated.Value(progress)).current;

    useEffect(() => {
        Animated.spring(animatedProgress, {
            toValue: progress,
            useNativeDriver: false,
            tension: 50,
            friction: 7
        }).start();
    }, [progress]);

    return (
        <View style={[styles.track, { backgroundColor: C.s3 }]}>
            <Animated.View
                style={[styles.fill, {
                    width: animatedProgress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                    backgroundColor: C.primary
                }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: 3,
        marginHorizontal: spacing.screenH,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 2
    },
    fill: {
        height: '100%',
        borderRadius: 2
    },
});