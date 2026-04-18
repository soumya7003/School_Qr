import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";

export const OrbitParticle = ({ radius, duration, delay, startAngle }) => {
    const angle = useSharedValue(startAngle);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
        angle.value = withDelay(delay, withRepeat(withTiming(startAngle + 360, { duration, easing: Easing.linear }), -1, false));
    }, []);

    const animStyle = useAnimatedStyle(() => {
        const rad = (angle.value * Math.PI) / 180;
        return { transform: [{ translateX: radius * Math.cos(rad) }, { translateY: radius * Math.sin(rad) }], opacity: opacity.value };
    });

    return <Animated.View style={[styles.orbitDot, animStyle]} />;
};