import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const ScanLine = ({ iconHalfHeight = 54 }) => {
    const half = iconHalfHeight;
    const translateY = useSharedValue(-half);
    const opacity = useSharedValue(0);

    useEffect(() => {
        const loop = () => {
            translateY.value = -half;
            opacity.value = withTiming(0.6, { duration: 180 });
            translateY.value = withTiming(half, { duration: 820, easing: Easing.linear }, (done) => {
                if (done) opacity.value = withTiming(0, { duration: 180 });
            });
        };
        const id = setTimeout(() => {
            loop();
            setInterval(loop, 3400);
        }, 1600);
        return () => clearTimeout(id);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: opacity.value }));
    return <Animated.View pointerEvents="none" style={[styles.scanLine, animStyle]} />;
};