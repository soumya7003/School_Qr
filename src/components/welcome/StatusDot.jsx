import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const StatusDot = () => {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.2, { duration: 850, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 850, easing: Easing.inOut(Easing.sin) })), -1, false);
        scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 160, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) }), withTiming(1.22, { duration: 110, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 110, easing: Easing.in(Easing.quad) }), withTiming(1, { duration: 1400 })), -1, false);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
    return <Animated.View style={[styles.statusDot, animStyle]} />;
};