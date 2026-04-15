// src/components/common/SwitchRow.jsx
import { colors } from '@/theme';
import { Switch } from 'react-native';
import { SettingsRow } from './SettingsRow';

export const SwitchRow = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    disabled = false,
    showDivider = true,
    trackColor = {
        false: colors.surfaceVariant,
        true: colors.primary,
    }
}) => {
    return (
        <SettingsRow
            icon={icon}
            title={title}
            subtitle={subtitle}
            disabled={disabled}
            showDivider={showDivider}
            rightElement={
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    trackColor={trackColor}
                    thumbColor={colors.white}
                />
            }
        />
    );
};