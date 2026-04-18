import { styles } from "@/styles/welcome.style";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export const DataReadout = () => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withDelay(1000, withRepeat(withSequence(withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 1800 }), withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }), withTiming(0, { duration: 300 })), -1, false));
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[styles.dataReadout, animStyle]} pointerEvents="none">
            <View style={styles.dataReadoutDot} />
            <Text style={styles.dataReadoutText} allowFontScaling={false}>SYSTEM ACTIVE</Text>
        </Animated.View>
    );
};