// src/components/qr/PulseDot.jsx
import { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export function PulseDot({ color, size = 7 }) {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(withSequence(
            withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ), -1, false);
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color
                },
                useAnimatedStyle(() => ({ opacity: opacity.value }))
            ]}
        />
    );
}