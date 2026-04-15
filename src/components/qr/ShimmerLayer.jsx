// src/components/qr/ShimmerLayer.jsx
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
} from 'react-native-reanimated';

export function ShimmerLayer({ tiltX, tiltY, shimmerColor, cardW, cardH }) {
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(Math.abs(tiltX.value) + Math.abs(tiltY.value), [0, 24], [0.0, 0.55]),
        transform: [
            { translateX: interpolate(tiltY.value, [-14, 14], [-cardW * 0.4, cardW * 0.4]) },
            { translateY: interpolate(tiltX.value, [-10, 10], [-cardH * 0.5, cardH * 0.5]) },
        ],
    }));
    
    return (
        <Animated.View 
            pointerEvents="none" 
            style={[
                StyleSheet.absoluteFill, 
                { borderRadius: 22, overflow: 'hidden' }, 
                style
            ]}
        >
            <LinearGradient 
                colors={['transparent', shimmerColor, 'rgba(255,255,255,0.18)', shimmerColor, 'transparent']} 
                start={[0, 0.3]} 
                end={[1, 0.7]} 
                style={{ width: '100%', height: '100%' }} 
            />
        </Animated.View>
    );
}