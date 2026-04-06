import { COLORS } from "@/constants/constants";
import { colors } from '@/theme';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation & UI
// ─────────────────────────────────────────────────────────────────────────────

export const ChevronRight = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconChevronRight = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconChevronLeft = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconChevronDown = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconChevronUp = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

// + Plus / Add
export const IconPlus = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// × Close / X
export const IconX = ({ color = colors.textPrimary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ✓ Check
export const CheckIcon = () => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={colors.primary} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconCheck = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Edit / Pencil
export const IconEdit = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Trash / Delete
export const IconTrash = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Copy
export const IconCopy = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={9} y={9} width={13} height={13} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// Share
export const IconShare = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={1.8} />
        <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={1.8} />
        <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={1.8} />
        <Path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// Download
export const IconDownload = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// Refresh / Reload
export const IconRefresh = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// People & Identity
// ─────────────────────────────────────────────────────────────────────────────

export const IconUser = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
        <Path d="M5 20v-2a7 7 0 0114 0v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconUsers = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={9} cy={8} r={3.5} stroke={color} strokeWidth={1.8} />
        <Path d="M3 20v-2a6 6 0 0112 0v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M16 11a3.5 3.5 0 010-7M21 20v-2a6 6 0 00-4-5.66"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const PersonIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="7" r="4" stroke={COLORS.white} strokeWidth="2" />
        <Path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7"
            stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

// Child / Baby
export const IconChild = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={6} r={3} stroke={color} strokeWidth={1.8} />
        <Path d="M9 13h6l1 8H8l1-8z" stroke={color} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 13l-2 3M15 13l2 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Security & Safety
// ─────────────────────────────────────────────────────────────────────────────

export const IconShield = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconShieldCheck = ({ color = colors.success, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconLock = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconUnlock = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 019.9-1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconKey = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={7.5} cy={7.5} r={4.5} stroke={color} strokeWidth={1.8} />
        <Path d="M10.5 10.5L21 21M15 16l-2 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconFingerprint = ({ color, size = 17 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 10a2 2 0 00-2 2v1M12 10a2 2 0 012 2v1M9 8.5A5 5 0 0117 12c0 2-.4 3.5-1 4.5M7.5 10A5 5 0 007 12c0 3 1.5 5.5 3.5 7M5 10.5A7.5 7.5 0 004 14c0 3 1.2 5.8 3 7.5M12 6a6 6 0 016 6c0 1.5-.3 3-.8 4.2M12 6a6 6 0 00-6 6c0 2.2.7 4.2 1.8 5.8M12 2a10 10 0 0110 10c0 1.3-.2 2.5-.5 3.7M12 2a10 10 0 00-10 10c0 2.4.7 4.7 1.8 6.6"
            stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
);

export const IconFaceId = ({ color, size = 17 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 3H5a2 2 0 00-2 2v4m6-6h6m-6 0v18m6-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2v-4"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M9 10v.01M15 10v.01M9.5 15a3.5 3.5 0 005 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Communication & Notifications
// ─────────────────────────────────────────────────────────────────────────────

export const IconBell = ({ color = colors.success, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconBellOff = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M1 1l22 22"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconPhone = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconMail = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M2 7l10 7 10-7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconMessageCircle = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Location & Navigation
// ─────────────────────────────────────────────────────────────────────────────

export const IconMapPin = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

export const IconNavigation = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 11l19-9-9 19-2-8-8-2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconCompass = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Media & Content
// ─────────────────────────────────────────────────────────────────────────────

export const IconScan = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Rect x={9} y={9} width={6} height={6} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
);

export const IconCamera = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={1.8} />
    </Svg>
);

export const IconImage = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
        <Circle cx={8.5} cy={8.5} r={1.5} stroke={color} strokeWidth={1.8} />
        <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconEye = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
);

export const IconEyeOff = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M10.73 10.73A2 2 0 0013.27 13.27" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Status & Feedback
// ─────────────────────────────────────────────────────────────────────────────

export const IconInfo = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconWarning = ({ color = colors.warning, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconAlertCircle = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconStar = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconHeart = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Settings & Preferences
// ─────────────────────────────────────────────────────────────────────────────

export const IconGlobe = ({ color = colors.info, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconMoon = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconSun = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.8} />
        <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconSettings = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
        <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconSliders = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M1 14h6M9 8h6M17 16h6"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Health & Emergency
// ─────────────────────────────────────────────────────────────────────────────

export const IconActivity = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconCross = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
);

export const IconDroplet = ({ color = colors.error, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Files & Data
// ─────────────────────────────────────────────────────────────────────────────

export const IconFile = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13 2v7h7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconClipboard = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={8} y={2} width={8} height={4} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Time
// ─────────────────────────────────────────────────────────────────────────────

export const IconClock = ({ color = colors.textTertiary, size = 13 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconCalendar = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Misc / Account
// ─────────────────────────────────────────────────────────────────────────────

export const IconLogout = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconCreditCard = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={1} y={4} width={22} height={16} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M1 10h22" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconWifi = ({ color = colors.success, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={12} cy={20} r={1} fill={color} />
    </Svg>
);

export const IconZap = ({ color = colors.warning, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconSearch = ({ color = colors.textTertiary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={1.8} />
        <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

export const IconHome = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const IconGrid = ({ color = colors.primary, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Rect x={14} y={3} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Rect x={3} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
        <Rect x={14} y={14} width={7} height={7} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Large / Decorative Icons
// ─────────────────────────────────────────────────────────────────────────────

export const ShieldCheckIcon = ({ size = 68 }) => (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <Path
            d="M36 5L9 16v20c0 16.3 11.7 31.4 27 35.4C52.3 67.4 63 52.3 63 36V16L36 5z"
            stroke={COLORS.red} strokeWidth={2.2} strokeLinejoin="round" fill="none"
        />
        <Path
            d="M23 36.5l9 9 17-17"
            stroke={COLORS.red} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"
        />
    </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated Icons
// ─────────────────────────────────────────────────────────────────────────────

export const PulseRing = ({ size, delay, baseOpacity }) => {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(baseOpacity);

    useEffect(() => {
        const DURATION = 2200;
        scale.value = withTiming(1.25, { duration: DURATION });
        opacity.value = withTiming(0, { duration: DURATION });
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                { width: size, height: size, borderRadius: size / 2 },
                animStyle,
            ]}
        />
    );
};

export const StatusDot = () => {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withTiming(0.15, { duration: 700 });
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={animStyle} />;
};