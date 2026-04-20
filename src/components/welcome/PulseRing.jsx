import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const PulseRing = ({ size, delay, baseOpacity }) => {
    const scale = useSharedValue(0.88);
    const opacity = useSharedValue(baseOpacity);
    const border = useSharedValue(1);

    useEffect(() => {
        const D = 2600;
        scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1.32, { duration: D, easing: Easing.out(Easing.cubic) }), withTiming(0.88, { duration: D, easing: Easing.in(Easing.cubic) })), -1, false));
        opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(0, { duration: D, easing: Easing.out(Easing.exp) }), withTiming(baseOpacity, { duration: D, easing: Easing.in(Easing.exp) })), -1, false));
        border.value = withDelay(delay, withRepeat(withSequence(withTiming(0.4, { duration: D }), withTiming(1.8, { duration: D })), -1, false));
    }, [delay, baseOpacity]);

    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value, borderWidth: border.value }));
    return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, animStyle]} />;
};