// components/scan-history/EmptyState.jsx

import { styles } from '@/styles/scanHistory.styles.js';
import { Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

export function EmptyState({ C }) {
    return (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.emptyContainer}>
            <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
                <Circle cx={60} cy={60} r={50} fill={C.s3} />
                <Circle cx={60} cy={60} r={50} stroke={C.bd} strokeWidth={1.5} strokeDasharray="4 6" />
                <Path d="M40 50h40M40 60h30M40 70h20" stroke={C.tx3} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={85} cy={50} r={4} fill={C.primary} />
            </Svg>
            <Text style={[styles.emptyTitle, { color: C.tx }]}>No scan history yet</Text>
            <Text style={[styles.emptySubtitle, { color: C.tx3 }]}>
                When someone scans your child's RESQID card, it will appear here in a beautiful timeline.
            </Text>
        </Animated.View>
    );
}