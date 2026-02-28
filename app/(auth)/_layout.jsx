import { Stack } from 'expo-router';


import {
  Platform,
  StyleSheet
} from 'react-native';
import { Line, Path, Rect, Svg } from 'react-native-svg';

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0D0D0F',
  bgDeep: '#120909',
  surface: '#161619',
  surfaceHover: '#1C1C1F',
  red: '#FF3B30',
  redDark: '#C8211A',
  redSubtle: 'rgba(255,59,48,0.12)',
  redBorder: 'rgba(255,59,48,0.35)',
  white: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.42)',
  textDim: 'rgba(255,255,255,0.22)',
  cardBorder: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.10)',
  inputBorderFocus: 'rgba(255,59,48,0.55)',
  inputBg: 'rgba(255,255,255,0.05)',
  tabInactive: 'rgba(255,255,255,0.07)',
  tabInactiveTxt: 'rgba(255,255,255,0.45)',
  divider: 'rgba(255,255,255,0.09)',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const ArrowLeftIcon = ({ color = COLORS.white, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12l7-7M5 12l7 7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CardIcon = ({ color = COLORS.textMuted }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.8" />
  </Svg>
);

const PhoneIcon = ({ color = COLORS.textMuted }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 013.09 4.18 2 2 0 015.08 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QrIcon = ({ color = COLORS.red, size = 28 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.8" />
    <Path d="M14 14h2v2h-2zM18 14h3M18 18v3M14 18h2v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

// ─── Animated Tab ──────────────────────────────────────────────────────────────

const SegmentedTab = ({ activeTab, onTabChange }) => {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0F' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  glowWrap: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
  },
  glowOuter: {
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: COLORS.red,
    opacity: 0.045,
  },
  scroll: {
    paddingHorizontal: 22,
    flexGrow: 1,
  },

  // Back
  backRow: {
    marginBottom: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backLabel: {
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.15,
  },

  // Header
  header: {
    marginBottom: 28,
    gap: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: Platform.select({ ios: '800', android: '700' }),
    color: COLORS.white,
    letterSpacing: -0.6,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 14.5,
    color: COLORS.textMuted,
    lineHeight: 22,
    letterSpacing: 0.1,
    maxWidth: 320,
  },

  // Form card
  formCard: {
    gap: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  // Scan section
  scanSection: {
    gap: 18,
  },

  // Submit
  buttonWrap: {
    marginTop: 6,
  },
  submitWrapper: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  submitButton: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  submitLabel: {
    color: COLORS.white,
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 4,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

