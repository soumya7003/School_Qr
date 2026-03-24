import { colors } from '@/theme';
import Svg, { Path } from 'react-native-svg';

export const ShareIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
            stroke={colors.textSecondary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);