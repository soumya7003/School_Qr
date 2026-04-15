// src/components/common/SettingsCard.jsx
import { colors } from '@/theme';
import { StyleSheet, View } from 'react-native';

export const SettingsCard = ({
    children,
    style,
    noPadding = false
}) => {
    return (
        <View style={[
            styles.card,
            !noPadding && styles.padding,
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: 16,
        marginVertical: 8,
        overflow: 'hidden',
    },
    padding: {
        padding: 16,
    },
});