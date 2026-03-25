/**
 * TabBar — Custom bottom tab bar.
 *
 * Used in app/(app)/_layout.jsx as the tabBar prop.
 * Tabs: HOME | QR | SOS | UPDATE | SETTINGS
 */

import { colors, spacing, typography } from '@/theme';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

// ── Icons ─────────────────────────────────────────────────────────────────────

const HomeIcon = ({ active }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
        <Polyline
            points="9 22 9 12 15 12 15 22"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
    </Svg>
);

const QrIcon = ({ active }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7} height={7} rx={1}
            stroke={active ? colors.primary : colors.textTertiary} strokeWidth={2} />
        <Rect x={14} y={3} width={7} height={7} rx={1}
            stroke={active ? colors.primary : colors.textTertiary} strokeWidth={2} />
        <Rect x={3} y={14} width={7} height={7} rx={1}
            stroke={active ? colors.primary : colors.textTertiary} strokeWidth={2} />
        <Path d="M14 14h2v2h-2zM18 14h3M20 16v3M14 18h2v3M18 20h3"
            stroke={active ? colors.primary : colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" />
    </Svg>
);

const EmergencyIcon = ({ active }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
        <Path
            d="M12 8v4M12 16h.01"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round"
        />
    </Svg>
);

const UpdatesIcon = ({ active }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
        <Path
            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
    </Svg>
);

const SettingsIcon = ({ active }) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={8} r={4}
            stroke={active ? colors.primary : colors.textTertiary} strokeWidth={2} />
        <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke={active ? colors.primary : colors.textTertiary}
            strokeWidth={2} strokeLinecap="round"
        />
    </Svg>
);

// ── Tab item ──────────────────────────────────────────────────────────────────

function TabItem({ label, icon, active, onPress }) {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.88, { damping: 10 }, () => {
            scale.value = withSpring(1);
        });
        onPress?.();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.tabItem}
            activeOpacity={0.7}
        >
            <Animated.View style={[styles.tabItemInner, animStyle]}>
                {icon}
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
    { name: 'home', label: 'HOME', Icon: HomeIcon },
    { name: 'qr', label: 'QR', Icon: QrIcon },
    { name: 'emergency', label: 'SOS', Icon: EmergencyIcon },
    { name: 'updates', label: 'UPDATE', Icon: UpdatesIcon },
    { name: 'settings', label: 'SETTINGS', Icon: SettingsIcon },
];

// ── Main TabBar ───────────────────────────────────────────────────────────────

export default function TabBar({ state, navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom || spacing[3] }]}>
            <View style={styles.bar}>
                {TABS.map((tab, index) => {
                    const isFocused = state.routes[state.index]?.name === tab.name;

                    return (
                        <TabItem
                            key={tab.name}
                            label={tab.label}
                            active={isFocused}
                            icon={<tab.Icon active={isFocused} />}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: state.routes[index]?.key,
                                    canPreventDefault: true,
                                });
                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(tab.name);
                                }
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: spacing[2],
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
    },
    tabItemInner: {
        alignItems: 'center',
        gap: spacing[0.5] + 1,
        paddingTop: spacing[1],
    },
    tabLabel: {
        ...typography.overline,
        fontSize: 9,
        color: colors.textTertiary,
        marginTop: spacing[0.5],
    },
    tabLabelActive: {
        color: colors.primary,
    },
});