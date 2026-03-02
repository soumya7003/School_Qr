import { COLORS } from "@/constants/constants";
import { colors } from '@/theme';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ! ChevronRight
export const ChevronRight = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ! IconScan
export const IconScan = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Rect x={9} y={9} width={6} height={6} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
);

// ! IconShield
export const IconShield = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ! IconEye
export const IconEye = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

// ! IconBell
export const IconBell = ({ color = colors.success }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ! IconMapPin
export const IconMapPin = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

// ! IconPhone
export const IconPhone = ({ color = colors.warning }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ! IconGlobe
export const IconGlobe = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ! IconMoon
export const IconMoon = ({ color = colors.textTertiary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ! IconLogout
export const IconLogout = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ! IconClock
export const IconClock = ({ color = colors.textTertiary }) => (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ! IconWarning
export const IconWarning = ({ color = colors.warning }) => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ! IconInfo
export const IconInfo = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// !
export const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

//! Fingerprint icon
export const IconFingerprint = ({ color }) => (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
        <Path d="M12 10a2 2 0 00-2 2v1M12 10a2 2 0 012 2v1M9 8.5A5 5 0 0117 12c0 2-.4 3.5-1 4.5M7.5 10A5 5 0 007 12c0 3 1.5 5.5 3.5 7M5 10.5A7.5 7.5 0 004 14c0 3 1.2 5.8 3 7.5M12 6a6 6 0 016 6c0 1.5-.3 3-.8 4.2M12 6a6 6 0 00-6 6c0 2.2.7 4.2 1.8 5.8M12 2a10 10 0 0110 10c0 1.3-.2 2.5-.5 3.7M12 2a10 10 0 00-10 10c0 2.4.7 4.7 1.8 6.6"
            stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
);

//! Face ID icon
export const IconFaceId = ({ color }) => (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
        <Path d="M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2v-4"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M9 10v.01M15 10v.01M9.5 15a3.5 3.5 0 005 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const ShieldCheckIcon = ({ size = 68 }) => (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <Path
            d="M36 5L9 16v20c0 16.3 11.7 31.4 27 35.4C52.3 67.4 63 52.3 63 36V16L36 5z"
            stroke={COLORS.red}
            strokeWidth={2.2}
            strokeLinejoin="round"
            fill="none"
        />
        <Path
            d="M23 36.5l9 9 17-17"
            stroke={COLORS.red}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export const PersonIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="4" stroke={COLORS.white} strokeWidth="2" />
        <Path
            d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7"
            stroke={COLORS.white}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </Svg>
);

export const PulseRing = ({ size, delay, baseOpacity }) => {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(baseOpacity);

    useEffect(() => {
        const DURATION = 2200;
        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.25, { duration: DURATION, easing: Easing.out(Easing.quad) }),
                    withTiming(0.85, { duration: DURATION, easing: Easing.in(Easing.quad) })
                ),
                -1,
                false
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0, { duration: DURATION }),
                    withTiming(baseOpacity, { duration: DURATION })
                ),
                -1,
                false
            )
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.ring,
                { width: size, height: size, borderRadius: size / 2 },
                animStyle,
            ]}
        />
    );
};

export const StatusDot = () => {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={[styles.statusDot, animStyle]} />;
};