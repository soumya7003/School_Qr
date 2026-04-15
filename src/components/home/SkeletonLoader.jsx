// src/components/home/SkeletonLoader.jsx
import { useTheme } from '@/providers/ThemeProvider';
import { useRef } from 'react';
import { Animated, View } from 'react-native';

export const Skeleton = ({ width, height, radius = 12, style }) => {
    const { colors: C } = useTheme();
    return (
        <View style={[{
            width, height, borderRadius: radius,
            backgroundColor: C.s3, overflow: 'hidden',
        }, style]}>
            <Animated.View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: C.s4,
                opacity: useRef(new Animated.Value(0.3)).current,
            }} />
        </View>
    );
};

export function HomeSkeleton() {
    const { colors: C } = useTheme();
    return (
        <>
            <Skeleton width={200} height={28} />
            <Skeleton width={140} height={16} style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={140} radius={20} style={{ marginTop: 16 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                {[1, 2, 3].map(i => <Skeleton key={i} width={100} height={90} radius={16} />)}
            </View>
            <Skeleton width="100%" height={200} radius={18} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={120} radius={18} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={180} radius={18} style={{ marginTop: 12 }} />
        </>
    );
}