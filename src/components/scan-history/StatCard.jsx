// components/scan-history/StatCard.jsx

import { styles } from '@/styles/scanHistory.styles.js';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

export function StatCard({ label, value, icon, color, gradientColors, delay, C }) {
    return (
        <Animated.View
            entering={FadeInRight.delay(delay).duration(400)}
            style={[styles.statCard, { backgroundColor: C.s2, borderColor: C.bd }]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statIconBg, { opacity: 0.12 }]}
            />
            <View style={[styles.statIconWrapper, { backgroundColor: color + '20' }]}>
                <Feather name={icon} size={22} color={color} />
            </View>
            <Text style={[styles.statNumber, { color: C.tx }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: C.tx3 }]}>{label}</Text>
        </Animated.View>
    );
}