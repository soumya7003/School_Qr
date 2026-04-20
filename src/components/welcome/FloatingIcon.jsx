import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const FloatingIcon = ({ children }) => {
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(withSequence(withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })), -1, false);
        rotate.value = withRepeat(withSequence(withTiming(-1.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }), withTiming(1.5, { duration: 3000, easing: Easing.inOut(Easing.sin) })), -1, false);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }] }));
    return <Animated.View style={animStyle}>{children}</Animated.View>;
};