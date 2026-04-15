// src/components/common/NotionAvatar.jsx
import { StyleSheet, Text, View } from 'react-native';

// Color palette for avatars
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E2', '#F8C471', '#82E0AA'
];

export const NotionAvatar = ({
    name,
    size = 40,
    style,
    colorIndex = 0
}) => {
    const initials = name
        ?.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';

    const backgroundColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 3,
                backgroundColor
            },
            style
        ]}>
            <Text style={[
                styles.initials,
                { fontSize: size * 0.4 }
            ]}>
                {initials}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});