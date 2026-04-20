import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const BreathGlow = () => {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0.14);

    useEffect(() => {
        scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 3200, easing: Easing.inOut(Easing.sin) }), withTiming(0.85, { duration: 3200, easing: Easing.inOut(Easing.sin) })), -1, false);
        opacity.value = withRepeat(withSequence(withTiming(0.32, { duration: 3200, easing: Easing.inOut(Easing.sin) }), withTiming(0.10, { duration: 3200, easing: Easing.inOut(Easing.sin) })), -1, false);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
    return <Animated.View style={[styles.breathGlow, animStyle]} pointerEvents="none" />;
};