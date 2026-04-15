/**
 * src/components/settings/ThemeSegment.jsx
 *
 * Three-way segmented control: Light · System · Dark
 * Reads the current theme from ThemeContext and calls setTheme on tap.
 */

import { useThemeContext } from "@/providers/ThemeProvider";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

// ─── Tiny inline icons ────────────────────────────────────────────────────────
const SunIcon = ({ color, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
        <Path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

const MoonIcon = ({ color, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const MonitorIcon = ({ color, size = 12 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 3H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2zM8 21h8M12 18v3"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const OPTIONS = [
    { value: "light",  label: "Light",  Icon: SunIcon },
    { value: "system", label: "Auto",   Icon: MonitorIcon },
    { value: "dark",   label: "Dark",   Icon: MoonIcon },
];

export default function ThemeSegment() {
    const { theme, setTheme, colors: C } = useThemeContext() ?? {};

    const active   = theme ?? "system";
    const activeC  = C?.blue  ?? "#3B82F6";
    const activeBg = C?.blueBg ?? "rgba(59,130,246,0.12)";
    const inactiveC = C?.tx3  ?? "rgba(240,240,245,0.32)";
    const trackBg  = C?.s4   ?? "#1E1E27";
    const trackBd  = C?.bd2  ?? "rgba(255,255,255,0.12)";

    return (
        <View style={[s.track, { backgroundColor: trackBg, borderColor: trackBd }]}>
            {OPTIONS.map(({ value, label, Icon }, i) => {
                const isActive = active === value;
                return (
                    <TouchableOpacity
                        key={value}
                        onPress={() => setTheme?.(value)}
                        activeOpacity={0.75}
                        style={[
                            s.pill,
                            i < OPTIONS.length - 1 && { borderRightWidth: 1, borderRightColor: trackBd },
                            isActive && { backgroundColor: activeBg },
                        ]}
                    >
                        <Icon color={isActive ? activeC : inactiveC} size={11} />
                        <Text style={[s.label, { color: isActive ? activeC : inactiveC }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const s = StyleSheet.create({
    track: {
        flexDirection: "row",
        borderRadius: 9,
        borderWidth: 1,
        overflow: "hidden",
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 7,
    },
    label: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
});
