// src/components/common/ChevronRow.jsx
import { IconChevronRight } from '@/components/icon/AllIcon';
import { colors } from '@/theme';
import { Text, View } from 'react-native';
import { SettingsRow } from './SettingsRow';

export const ChevronRow = ({
    icon,
    title,
    subtitle,
    onPress,
    disabled = false,
    showDivider = true,
    rightText,
    badge,
}) => {
    return (
        <SettingsRow
            icon={icon}
            title={title}
            subtitle={subtitle}
            onPress={onPress}
            disabled={disabled}
            showDivider={showDivider}
            rightElement={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {badge}
                    {rightText && (
                        <Text style={{
                            fontSize: 14,
                            color: colors.textSecondary,
                            marginRight: 4
                        }}>
                            {rightText}
                        </Text>
                    )}
                    <IconChevronRight color={colors.textTertiary} size={16} />
                </View>
            }
        />
    );
};