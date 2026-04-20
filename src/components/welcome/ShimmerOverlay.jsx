import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

export const ShimmerOverlay = () => {
    const translateX = useSharedValue(-220);
    const translateX2 = useSharedValue(-320);

    useEffect(() => {
        const run1 = () => {
            translateX.value = -220;
            translateX.value = withTiming(420, { duration: 860, easing: Easing.out(Easing.quad) });
        };
        const run2 = () => {
            translateX2.value = -320;
            translateX2.value = withTiming(420, { duration: 1100, easing: Easing.out(Easing.cubic) });
        };
        const id = setTimeout(() => {
            run1();
            setTimeout(run2, 220);
            setInterval(() => { run1(); setTimeout(run2, 220); }, 4200);
        }, 1200);
        return () => clearTimeout(id);
    }, []);

    const s1 = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { rotate: "18deg" }] }));
    const s2 = useAnimatedStyle(() => ({ transform: [{ translateX: translateX2.value }, { rotate: "18deg" }] }));

    return (
        <>
            <Animated.View style={[styles.shimmer, s1]} pointerEvents="none" />
            <Animated.View style={[styles.shimmerThin, s2]} pointerEvents="none" />
        </>
    );
};