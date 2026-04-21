// components/scan-history/FilterChip.jsx

import { styles } from '@/styles/scanHistory.styles.js';
import { Feather } from '@expo/vector-icons';
import { Text, TouchableOpacity } from 'react-native';

export function FilterChip({ filter, isActive, onPress, C }) {
    return (
        <TouchableOpacity
            style={[
                styles.filterChip,
                { backgroundColor: isActive ? C.primary : C.s2, borderColor: isActive ? C.primary : C.bd },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Feather name={filter.icon} size={14} color={isActive ? '#fff' : C.tx3} />
            <Text style={[
                styles.filterChipText,
                { color: isActive ? '#fff' : C.tx3 },
                isActive && { fontWeight: '700' },
            ]}>
                {filter.label}
            </Text>
        </TouchableOpacity>
    );
}