/**
 * app/(app)/updates.jsx
 *
 * REFACTOR NOTES:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. KEYBOARD BUG FIX — KeyboardAvoidingView now wraps the *entire* screen
 *    content (header, step bar, scroll). ProgressIndicator / InstructionBanner
 *    were previously outside KAV which broke layout on Android.
 *
 * 2. CONTACT MODAL KEYBOARD FIX — Modal now uses a ScrollView internally so
 *    the phone / relationship fields are never hidden behind the soft keyboard.
 *    KAV behavior switched to "padding" on both platforms inside the modal sheet.
 *
 * 3. ONBOARDING GATE — isNewUser blocks the native back-button and hides the
 *    header back chevron. Users MUST complete all 4 steps before the app
 *    redirects them to home.
 *
 * 4. INSTRUCTION BANNERS — always visible (not just for new users). Each step
 *    has a concise banner with a title, body copy, and a "do / don't" hint row.
 *
 * 5. PROGRESS BAR moved inside KAV so it participates in keyboard layout.
 *
 * 6. PHOTO UPLOAD — Professional avatar upload section added to Step 0 with
 *    preview, upload button, and clear guidance.
 *
 * 7. STEP INDICATOR REDESIGN — Cleaner, more professional step bar with better
 *    visual hierarchy and smooth transitions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, typography } from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckSvg = ({ c = '#fff', s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevRight = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevLeft = ({ c, s = 16 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PlusSvg = ({ c = '#fff', s = 18 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);
const XSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const TrashSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);
const EditSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const InfoSvg = ({ c, s = 14 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke={c} strokeWidth={1.7} />
    <Path d="M12 8h.01M12 12v4" stroke={c} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CameraSvg = ({ c, s = 20 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8} />
  </Svg>
);
const UploadSvg = ({ c, s = 18 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−', 'Unknown'];
const BLOOD_GROUP_TO_ENUM = {
  'A+': 'A_POS', 'A−': 'A_NEG', 'A-': 'A_NEG', 'B+': 'B_POS', 'B−': 'B_NEG', 'B-': 'B_NEG',
  'O+': 'O_POS', 'O−': 'O_NEG', 'O-': 'O_NEG', 'AB+': 'AB_POS', 'AB−': 'AB_NEG', 'AB-': 'AB_NEG',
  'Unknown': 'UNKNOWN', 'A_POS': 'A_POS', 'A_NEG': 'A_NEG', 'B_POS': 'B_POS', 'B_NEG': 'B_NEG',
  'O_POS': 'O_POS', 'O_NEG': 'O_NEG', 'AB_POS': 'AB_POS', 'AB_NEG': 'AB_NEG', 'UNKNOWN': 'UNKNOWN',
};
const BLOOD_GROUP_FROM_ENUM = {
  'A_POS': 'A+', 'A_NEG': 'A−', 'B_POS': 'B+', 'B_NEG': 'B−',
  'O_POS': 'O+', 'O_NEG': 'O−', 'AB_POS': 'AB+', 'AB_NEG': 'AB−', 'UNKNOWN': 'Unknown',
};
const PRIORITY_COLORS = ['#F97316', '#FBBF24', '#60A5FA', '#A78BFA', '#22C55E'];

// Step meta — used by StepBar + InstructionBanner from the same source of truth
const STEPS = [
  {
    id: 0,
    short: '1',
    labelKey: 'updates.stepStudent',
    label: 'Student',
    banner: {
      emoji: '👤',
      title: 'Add Your Child\'s Details',
      body: 'Enter the name exactly as it appears on school records and upload a recent photo. This helps first responders identify your child quickly.',
      dos: ['Use the full legal name', 'Upload a clear, recent photo'],
      donts: ['Don\'t use nicknames', 'Don\'t upload blurry or old photos'],
    },
  },
  {
    id: 1,
    short: '2',
    labelKey: 'updates.stepMedical',
    label: 'Medical',
    banner: {
      emoji: '🏥',
      title: 'Medical Information',
      body: 'This information is shown to first responders when your child\'s card is scanned. Accurate data here can be life-saving.',
      dos: ['Select the correct blood group', 'List all known allergies'],
      donts: ['Don\'t skip allergies if any exist', 'Don\'t enter unknown medications'],
    },
  },
  {
    id: 2,
    short: '3',
    labelKey: 'updates.stepContacts',
    label: 'Contacts',
    banner: {
      emoji: '📞',
      title: 'Emergency Contacts',
      body: 'Add at least 2 contacts who can be reached during an emergency. They will be called in priority order when the card is scanned.',
      dos: ['Add at least 2 contacts', 'Use active mobile numbers'],
      donts: ['Don\'t use landline numbers', 'Don\'t add duplicate numbers'],
    },
  },
  {
    id: 3,
    short: '4',
    labelKey: 'updates.stepReview',
    label: 'Review',
    banner: {
      emoji: '✅',
      title: 'Review Before Activating',
      body: 'Check all details carefully. Once the card is activated, this information will be used in real emergencies.',
      dos: ['Verify phone numbers are correct', 'Confirm blood group is accurate'],
      donts: ['Don\'t activate with placeholder data', 'Don\'t skip reading the contact list'],
    },
  },
];

// ── Professional Step Bar ─────────────────────────────────────────────────────
function StepBar({ current, completed, C }) {
  return (
    <View style={[sb.wrap, { backgroundColor: C.s2, borderBottomColor: C.bd }]}>
      <View style={sb.container}>
        {STEPS.map((step, i) => {
          const isActive = i === current;
          const isDone = completed.includes(i);
          const isPast = i < current || isDone;

          return (
            <View key={step.id} style={sb.stepItem}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <View style={sb.connectorWrapper}>
                  <View
                    style={[
                      sb.connector,
                      { backgroundColor: C.bd2 },
                      isPast && { backgroundColor: C.primary }
                    ]}
                  />
                </View>
              )}

              {/* Step circle */}
              <View style={[
                sb.circleContainer,
                isActive && sb.circleActive,
              ]}>
                <View style={[
                  sb.circle,
                  {
                    backgroundColor: isDone ? C.ok : (isActive ? C.primary : C.s3),
                    borderColor: isDone ? C.ok : (isActive ? C.primary : C.bd2),
                  },
                ]}>
                  {isDone ? (
                    <CheckSvg c="#fff" s={12} />
                  ) : (
                    <Text style={[
                      sb.stepNumber,
                      { color: isActive ? '#fff' : C.tx3 }
                    ]}>
                      {step.short}
                    </Text>
                  )}
                </View>
              </View>

              {/* Label */}
              <Text style={[
                sb.label,
                { color: C.tx3 },
                isActive && { color: C.tx, fontWeight: '700' },
                isDone && { color: C.ok }
              ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connectorWrapper: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: 0,
  },
  connector: {
    height: 2,
    width: '100%',
  },
  circleContainer: {
    zIndex: 1,
    marginBottom: 8,
  },
  circleActive: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

// ── Photo Upload Component (Fixed) ─────────────────────────────────────────────────────
function PhotoUpload({ imageUri, onImageChange, C }) {
  const [uploading, setUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Check permissions on mount and cache them
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    setHasPermission({
      camera: cameraStatus === 'granted',
      library: libraryStatus === 'granted',
    });
  };

  const requestLibraryPermission = async () => {
    // If we already know permission is granted, skip the request
    if (hasPermission?.library) {
      return true;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // Update cached permission state
    setHasPermission(prev => ({ ...prev, library: status === 'granted' }));

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => {
              // Optionally link to settings
              Linking.openSettings?.();
            }
          },
        ]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    // If we already know permission is granted, skip the request
    if (hasPermission?.camera) {
      return true;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    // Update cached permission state
    setHasPermission(prev => ({ ...prev, camera: status === 'granted' }));

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take a profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settings',
            onPress: () => {
              Linking.openSettings?.();
            }
          },
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) return;

    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        // Don't ask for permission again if already granted
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        onImageChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true
            }).start(() => {
              onImageChange(null);
              fadeAnim.setValue(1);
            });
          }
        },
      ]
    );
  };

  return (
    <View style={pu.container}>
      <Text style={[pu.label, { color: C.tx3 }]}>PROFILE PHOTO</Text>

      <View style={pu.content}>
        <Animated.View style={[pu.previewContainer, { opacity: fadeAnim }]}>
          {imageUri ? (
            <View style={pu.previewWrapper}>
              <Image source={{ uri: imageUri }} style={pu.preview} />
              <TouchableOpacity
                style={[pu.removeBtn, { backgroundColor: C.red, borderColor: '#fff' }]}
                onPress={handleRemove}
              >
                <XSvg c="#fff" s={12} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[pu.placeholder, { backgroundColor: C.s3, borderColor: C.bd2 }]}>
              <View style={[pu.placeholderIcon, { backgroundColor: C.primaryBg }]}>
                <CameraSvg c={C.primary} s={28} />
              </View>
              <Text style={[pu.placeholderText, { color: C.tx3 }]}>
                No photo uploaded
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={pu.actions}>
          <TouchableOpacity
            style={[pu.actionBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
            onPress={takePhoto}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <CameraSvg c={C.primary} s={16} />
            <Text style={[pu.actionText, { color: C.primary }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[pu.actionBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <UploadSvg c={C.primary} s={16} />
            <Text style={[pu.actionText, { color: C.primary }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={[pu.loadingOverlay, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        )}
      </View>

      <View style={[pu.hint, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
        <InfoSvg c={C.blue} s={12} />
        <Text style={[pu.hintText, { color: C.blue }]}>
          A clear, recent photo helps first responders identify your child quickly.
        </Text>
      </View>
    </View>
  );
}

const pu = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  content: {
    position: 'relative',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewWrapper: {
    position: 'relative',
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  removeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 60,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  hintText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});

// ── Instruction Banner ─────────────────────────────────────────────────────────
function InstructionBanner({ currentStep, isNewUser, C }) {
  const meta = STEPS[currentStep]?.banner ?? STEPS[0].banner;
  return (
    <View style={[ib.wrap, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
      <View style={ib.titleRow}>
        <Text style={ib.emoji}>{meta.emoji}</Text>
        <Text style={[ib.title, { color: C.blue }]}>{meta.title}</Text>
        {isNewUser && (
          <View style={[ib.badge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
            <Text style={[ib.badgeText, { color: C.primary }]}>REQUIRED</Text>
          </View>
        )}
      </View>
      <Text style={[ib.body, { color: C.tx2 }]}>{meta.body}</Text>
      <View style={ib.hintRow}>
        <View style={ib.hintCol}>
          {meta.dos.map((d, i) => (
            <View key={i} style={ib.hintItem}>
              <Text style={[ib.hintDot, { color: C.ok }]}>✓</Text>
              <Text style={[ib.hintText, { color: C.tx2 }]}>{d}</Text>
            </View>
          ))}
        </View>
        <View style={[ib.divider, { backgroundColor: C.bd }]} />
        <View style={ib.hintCol}>
          {meta.donts.map((d, i) => (
            <View key={i} style={ib.hintItem}>
              <Text style={[ib.hintDot, { color: C.red }]}>✕</Text>
              <Text style={[ib.hintText, { color: C.tx2 }]}>{d}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
const ib = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 16 },
  title: { fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2, flex: 1 },
  badge: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  body: { fontSize: 12, lineHeight: 18 },
  hintRow: { flexDirection: 'row', gap: 10, paddingTop: 6 },
  hintCol: { flex: 1, gap: 5 },
  divider: { width: 1, marginVertical: 2 },
  hintItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  hintDot: { fontSize: 11, fontWeight: '800', marginTop: 1 },
  hintText: { fontSize: 11, lineHeight: 16, flex: 1 },
});

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ currentStep, totalSteps = 4, C }) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.spring(animatedProgress, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [progress]);

  return (
    <View style={[pb.track, { backgroundColor: C.s3 }]}>
      <Animated.View
        style={[
          pb.fill,
          {
            width: animatedProgress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: C.primary
          }
        ]}
      />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 3, marginHorizontal: spacing.screenH, borderRadius: 2, overflow: 'hidden', marginBottom: 2 },
  fill: { height: '100%', borderRadius: 2 },
});

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, hint, required, C, inputRef: externalRef, onSubmitEditing, returnKeyType }) {
  const internalRef = useRef(null);
  const ref = externalRef ?? internalRef;
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value]);

  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [C.bd2, C.primary] });

  return (
    <TouchableWithoutFeedback onPress={() => ref.current?.focus()}>
      <View style={fld.wrap}>
        <View style={fld.labelRow}>
          <Text style={[fld.label, { color: C.tx3 }]}>{label}</Text>
          {required && <View style={[fld.reqDot, { backgroundColor: C.primary }]} />}
        </View>
        <Animated.View style={[fld.box, { borderColor, backgroundColor: C.s2 }]}>
          <TextInput
            ref={ref}
            style={[fld.input, { color: C.tx }, multiline && fld.inputMulti]}
            value={value || ''}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.tx3}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            keyboardType={keyboardType ?? 'default'}
            textAlignVertical={multiline ? 'top' : 'center'}
            selectionColor={C.primary}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType ?? (multiline ? 'default' : 'next')}
            blurOnSubmit={!multiline}
          />
        </Animated.View>
        {hint && (
          <View style={fld.hintRow}>
            <InfoSvg c={C.tx3} s={11} />
            <Text style={[fld.hint, { color: C.tx3 }]}>{hint}</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
const fld = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  reqDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  box: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 44 },
  input: { ...typography.bodyMd, height: 42, paddingVertical: 0, fontSize: 15, paddingHorizontal: 0 },
  inputMulti: { height: 80, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hint: { fontSize: 11, fontStyle: 'italic' },
});

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, accent, C }) {
  const ac = accent ?? C.primary;
  return (
    <View style={[sc.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
      <View style={[sc.head, { borderLeftColor: ac, borderBottomColor: C.bd }]}>
        <View style={[sc.iconWrap, { backgroundColor: ac + '12', borderColor: ac + '30' }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={[sc.title, { color: C.tx }]}>{title}</Text>
          {subtitle && <Text style={[sc.sub, { color: C.tx3 }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={sc.body}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderLeftWidth: 3 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontWeight: '700' },
  sub: { fontSize: 11, marginTop: 1 },
  body: { padding: 16, gap: 14 },
});

// ── Blood Picker ──────────────────────────────────────────────────────────────
function BloodPicker({ value, onChange, C }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={bl.grid}>
        {BLOOD_GROUPS.map((bg) => {
          const sel = value === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[bl.chip, { borderColor: C.bd2, backgroundColor: C.s3 }, sel && { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]}
              onPress={() => onChange(bg)}
              activeOpacity={0.7}
            >
              <Text style={[bl.text, { color: sel ? C.primary : C.tx2 }]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!value && (
        <View style={[bl.warn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
          <Text style={[bl.warnText, { color: C.amb }]}>
            ⚠️  Tap a blood group above. This is shown to first responders.
          </Text>
        </View>
      )}
    </View>
  );
}
const bl = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, minWidth: 54, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '700' },
  warn: { borderRadius: 8, borderWidth: 1, padding: 10 },
  warnText: { fontSize: 12, fontWeight: '600' },
});

// ── Contact Card ──────────────────────────────────────────────────────────────
function ContactCard({ contact, index, onEdit, onDelete, C }) {
  const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, delay: index * 55, useNativeDriver: true, tension: 85, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[ccc.card, { backgroundColor: C.s3, borderColor: C.bd, transform: [{ scale: scaleAnim }] }]}>
      <View style={[ccc.priority, { backgroundColor: pc + '18', borderColor: pc + '35' }]}>
        <Text style={[ccc.priorityNum, { color: pc }]}>{contact.priority}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={ccc.top}>
          <Text style={[ccc.name, { color: C.tx }]}>{contact.name}</Text>
          {contact.priority === 1 && (
            <View style={[ccc.firstTag, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
              <Text style={[ccc.firstTagText, { color: C.primary }]}>FIRST CALL</Text>
            </View>
          )}
        </View>
        <Text style={[ccc.meta, { color: C.tx3 }]}>
          {contact.relationship || 'Contact'} · {contact.phone}
        </Text>
      </View>
      <View style={ccc.actions}>
        <TouchableOpacity style={[ccc.btn, { backgroundColor: C.s4, borderColor: C.bd }]} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <EditSvg c={C.tx2} s={12} />
        </TouchableOpacity>
        <TouchableOpacity style={[ccc.btn, { backgroundColor: C.redBg, borderColor: C.redBd }]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <TrashSvg c={C.red} s={12} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const ccc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  priority: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  priorityNum: { fontSize: 13, fontWeight: '900' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 13.5, fontWeight: '700' },
  firstTag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  firstTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  meta: { fontSize: 11.5, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ visible, contact, onSave, onClose, C }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rel, setRel] = useState('');

  const phoneRef = useRef(null);
  const relRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? '');
      setPhone(contact?.phone ?? '');
      setRel(contact?.relationship ?? '');
    }
  }, [visible, contact]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required Fields', 'Please enter a contact name and phone number.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim()) && !phone.trim().startsWith('+')) {
      Alert.alert('Invalid Phone Number', 'Enter a valid 10-digit Indian mobile number or an international number starting with +.');
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: rel.trim() });
    onClose();
  };

  const isEditing = !!contact?.id;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          style={cm.kavContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Pressable style={[cm.sheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
            <View style={[cm.handle, { backgroundColor: C.s4 }]} />

            <View style={cm.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={[cm.sheetTitle, { color: C.tx }]}>
                  {isEditing ? 'Edit Contact' : 'Add Emergency Contact'}
                </Text>
                <Text style={[cm.sheetSub, { color: C.tx3 }]}>
                  This person will be called when your child's card is scanned.
                </Text>
              </View>
              <TouchableOpacity
                style={[cm.closeBtn, { backgroundColor: C.s3, borderColor: C.bd }]}
                onPress={onClose}
              >
                <XSvg c={C.tx3} s={14} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={cm.fields}
            >
              <Field
                label="Contact Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Priya Sharma"
                required
                hint="Full name as saved in the contact's phone"
                C={C}
                onSubmitEditing={() => phoneRef.current?.focus()}
                returnKeyType="next"
              />
              <Field
                label="Mobile Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g., 98765 43210"
                keyboardType="phone-pad"
                required
                hint="10-digit Indian number. International: start with +"
                C={C}
                inputRef={phoneRef}
                onSubmitEditing={() => relRef.current?.focus()}
                returnKeyType="next"
              />
              <Field
                label="Relationship"
                value={rel}
                onChangeText={setRel}
                placeholder="e.g., Mother, Father, Uncle"
                hint="Optional — helps responders know who they're speaking to"
                C={C}
                inputRef={relRef}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <View style={[cm.rulesBox, { backgroundColor: C.s3, borderColor: C.bd }]}>
                <Text style={[cm.rulesTitle, { color: C.tx2 }]}>Phone number rules</Text>
                <Text style={[cm.ruleItem, { color: C.tx3 }]}>✓  Must be a reachable mobile number</Text>
                <Text style={[cm.ruleItem, { color: C.tx3 }]}>✓  10 digits for India (6–9 start) or + prefix for international</Text>
                <Text style={[cm.ruleItem, { color: C.tx3 }]}>✕  No landlines, no WhatsApp-only numbers</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[cm.saveBtn, { backgroundColor: C.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <CheckSvg c="#fff" s={14} />
              <Text style={cm.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Add Contact'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  kavContainer: { width: '100%' },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 14, maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sheetSub: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  closeBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: 14, paddingBottom: 8 },
  rulesBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 5 },
  rulesTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  ruleItem: { fontSize: 11.5, lineHeight: 18 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15 },
  saveBtnText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});

// ── Review Row ────────────────────────────────────────────────────────────────
function ReviewRow({ label, value, required, C }) {
  const empty = !value || value === 'Not set' || value === 'None';
  return (
    <View style={[rv.row, { borderBottomColor: C.bd }]}>
      <Text style={[rv.label, { color: C.tx3 }]}>{label}</Text>
      <View style={{ flex: 2, alignItems: 'flex-end' }}>
        {empty && required
          ? (
            <View style={[rv.missingChip, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
              <Text style={[rv.missingText, { color: C.red }]}>Missing</Text>
            </View>
          )
          : <Text style={[rv.value, { color: empty ? C.tx3 : C.tx }, empty && rv.empty]}>{value || '—'}</Text>
        }
      </View>
    </View>
  );
}
const rv = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1 },
  label: { fontSize: 12, flex: 1, fontWeight: '600' },
  value: { fontSize: 13, textAlign: 'right', fontWeight: '600' },
  empty: { fontStyle: 'italic', fontWeight: '400' },
  missingChip: { borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  missingText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

// ── Nav Footer ────────────────────────────────────────────────────────────────
function NavFooter({ step, isNewUser, onBack, onNext, nextLabel, saving, canProceed, C }) {
  const isFirst = step === 0;
  return (
    <View style={[nf.bar, { backgroundColor: C.s2, borderTopColor: C.bd }]}>
      {(!isNewUser || step > 0) ? (
        <TouchableOpacity
          style={[nf.backBtn, { borderColor: C.bd2, backgroundColor: C.s3 }, isFirst && { opacity: 0 }]}
          onPress={onBack}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <ChevLeft c={C.tx2} s={16} />
          <Text style={[nf.backText, { color: C.tx2 }]}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={nf.backBtn} />
      )}
      <TouchableOpacity
        style={[nf.nextBtn, { backgroundColor: C.primary }, (saving || !canProceed) && { opacity: 0.45 }]}
        onPress={onNext}
        disabled={saving || !canProceed}
        activeOpacity={0.85}
      >
        <Text style={nf.nextText}>{saving ? 'Saving…' : nextLabel}</Text>
        {!saving && (
          step < 3
            ? <ChevRight c="#fff" s={15} />
            : <Text style={{ fontSize: 14 }}>⚡</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
const nf = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenH, paddingTop: 14, paddingBottom: spacing[6], borderTopWidth: 1, gap: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
  backText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15 },
  nextText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function UpdatesScreen() {
  const { colors: C } = useTheme();
  const router = useRouter();
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const student = useProfileStore(
    useShallow((s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null)
  );
  const ep = student?.emergency ?? null;
  const rawContacts = useMemo(() => student?.emergency?.contacts ?? [], [student?.emergency?.contacts]);

  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Form state ──
  const [firstName, setFirstName] = useState(student?.first_name ?? '');
  const [lastName, setLastName] = useState(student?.last_name ?? '');
  const [cls, setCls] = useState(student?.class ?? '');
  const [section, setSection] = useState(student?.section ?? '');
  const [profileImage, setProfileImage] = useState(student?.profile_image ?? null);
  const [bloodGroup, setBloodGroup] = useState(BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? '');
  const [allergies, setAllergies] = useState(ep?.allergies ?? '');
  const [conditions, setConditions] = useState(ep?.conditions ?? '');
  const [medications, setMedications] = useState(ep?.medications ?? '');
  const [doctorName, setDoctorName] = useState(ep?.doctor_name ?? '');
  const [doctorPhone, setDoctorPhone] = useState(ep?.doctor_phone ?? '');
  const [notes, setNotes] = useState(ep?.notes ?? '');
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditContact] = useState(null);

  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Sync from store ──
  useEffect(() => {
    setFirstName(student?.first_name ?? '');
    setLastName(student?.last_name ?? '');
    setCls(student?.class ?? '');
    setSection(student?.section ?? '');
    setProfileImage(student?.profile_image ?? null);
  }, [student]);

  useEffect(() => {
    setBloodGroup(BLOOD_GROUP_FROM_ENUM[ep?.blood_group] ?? ep?.blood_group ?? '');
    setAllergies(ep?.allergies ?? '');
    setConditions(ep?.conditions ?? '');
    setMedications(ep?.medications ?? '');
    setDoctorName(ep?.doctor_name ?? '');
    setDoctorPhone(ep?.doctor_phone ?? '');
    setNotes(ep?.notes ?? '');
  }, [ep]);

  useEffect(() => { setContacts(rawContacts ?? []); }, [rawContacts]);

  // ── Block Android hardware back during onboarding ──
  useEffect(() => {
    if (!isNewUser) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) { goBack(); return true; }
      Alert.alert(
        'Complete Profile First',
        'You need to add your child\'s details before you can use RESQID.',
        [{ text: 'OK' }]
      );
      return true;
    });
    return () => sub.remove();
  }, [isNewUser, step]);

  // ── Scroll to top on step change ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  // ── Can proceed guard ──
  const canProceed = step === 0
    ? firstName.trim().length > 0 && lastName.trim().length > 0
    : true;

  // ── Step transitions ──
  const transitionStep = (n) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setStep(n);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step === 0 && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Name Required', "Please enter your child's first and last name to continue.");
      return;
    }
    if (step < 3) {
      setCompleted((p) => p.includes(step) ? p : [...p, step]);
      transitionStep(step + 1);
    } else {
      handleSubmitAll();
    }
  };

  const goBack = () => { if (step > 0) transitionStep(step - 1); };

  // ── Submit ──
  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      await patchStudent(student.id, {
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class: cls.trim(),
          section: section.trim(),
          profile_image: profileImage,
        },
        emergency: {
          blood_group: (BLOOD_GROUP_TO_ENUM[bloodGroup] ?? bloodGroup) || undefined,
          allergies: allergies.trim(),
          conditions: conditions.trim(),
          medications: medications.trim(),
          doctor_name: doctorName.trim(),
          ...(doctorPhone.trim()
            ? { doctor_phone: doctorPhone.trim().startsWith('+') ? doctorPhone.trim() : `+91${doctorPhone.trim().replace(/^0/, '')}` }
            : {}),
          notes: notes.trim(),
        },
        contacts: contacts.map((c, i) => ({
          ...(c.id && !c.id.startsWith('tmp_') ? { id: c.id } : {}),
          name: c.name,
          phone: c.phone?.startsWith('+') ? c.phone : `+91${c.phone?.replace(/^0/, '') ?? ''}`,
          relationship: c.relationship,
          priority: i + 1,
        })),
      });

      setCompleted([0, 1, 2, 3]);

      if (isNewUser) {
        await setIsNewUser(false);
        fetchAndPersist?.().catch(() => { });
      } else {
        Alert.alert('Profile Updated ✓', "Your child's information has been saved.");
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Save Failed', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Contact handlers ──
  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      setContacts((p) => p.map((c) => c.id === editingContact.id ? { ...c, ...data } : c));
    } else {
      setContacts((p) => [
        ...p,
        { id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...data, priority: p.length + 1, is_active: true },
      ]);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            setContacts((p) =>
              p.filter((c) => c.id !== contact.id).map((c, i) => ({ ...c, priority: i + 1 }))
            ),
        },
      ]
    );
  };

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  // ── Derived labels ──
  const nextLabel = step === 3
    ? (isNewUser ? 'Activate Card' : 'Save Changes')
    : 'Continue';

  const headerTitle = isNewUser
    ? 'Complete Your Profile'
    : student?.first_name
      ? `Edit ${student.first_name}'s Profile`
      : 'Edit Profile';

  const classLabel = cls && section ? `Class ${cls} · ${section}` : cls ? `Class ${cls}` : 'No class set';

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ContactModal
        visible={modalVisible}
        contact={editingContact}
        onSave={handleSaveContact}
        onClose={() => setModalVisible(false)}
        C={C}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={[s.header, { borderBottomColor: C.bd }]}>
          {(!isNewUser || step > 0) ? (
            <TouchableOpacity onPress={isNewUser ? goBack : router.back} style={s.backBtn}>
              <ChevLeft c={C.tx} s={20} />
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
          <Text style={[s.headerTitle, { color: C.tx }]}>{headerTitle}</Text>
          {isNewUser ? (
            <View style={[s.badge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
              <View style={[s.badgeDot, { backgroundColor: C.primary }]} />
              <Text style={[s.badgeText, { color: C.primary }]}>Setup</Text>
            </View>
          ) : (
            <View style={s.backBtn} />
          )}
        </View>

        {/* ── Progress Bar (new users only) ── */}
        {isNewUser && <ProgressBar currentStep={step} C={C} />}

        {/* ── Step Indicator ── */}
        <StepBar current={step} completed={completed} C={C} />

        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <InstructionBanner currentStep={step} isNewUser={isNewUser} C={C} />

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Step 0: Student ── */}
            {step === 0 && (
              <View style={s.stepContent}>
                <SectionCard
                  icon={<CameraSvg c={C.primary} s={16} />}
                  title="Profile Photo"
                  subtitle="Optional but recommended — helps identify your child"
                  C={C}
                >
                  <PhotoUpload
                    imageUri={profileImage}
                    onImageChange={setProfileImage}
                    C={C}
                  />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>👤</Text>}
                  title="Child's Name"
                  subtitle="Required — match the name on school records"
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="e.g., Arjun"
                        required
                        C={C}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="e.g., Sharma"
                        required
                        C={C}
                      />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>🏫</Text>}
                  title="Class & Section"
                  subtitle="Optional — helps identify your child quickly"
                  accent={C.blue}
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Class" value={cls} onChangeText={setCls} placeholder="e.g., 6" C={C} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Section" value={section} onChangeText={setSection} placeholder="e.g., B" C={C} />
                    </View>
                  </View>
                </SectionCard>

                <View style={[s.note, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={{ fontSize: 12 }}>📌</Text>
                  <Text style={[s.noteText, { color: C.tx3 }]}>
                    First and last name are required to continue. You cannot skip this step.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Step 1: Medical ── */}
            {step === 1 && (
              <View style={s.stepContent}>
                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>🩸</Text>}
                  title="Blood Group"
                  subtitle="Critical for emergency response — tap to select"
                  C={C}
                >
                  <BloodPicker value={bloodGroup} onChange={setBloodGroup} C={C} />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>⚠️</Text>}
                  title="Allergies"
                  subtitle="Medication, food, or environmental allergies"
                  accent={C.amb}
                  C={C}
                >
                  <Field
                    label="Known Allergies"
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="e.g., Peanuts, Penicillin"
                    multiline
                    hint='Leave blank if none. Separate multiple allergies with commas.'
                    C={C}
                  />
                </SectionCard>

                <SectionCard icon={<Text style={{ fontSize: 15 }}>🫁</Text>} title="Medical Conditions" accent={C.blue} C={C}>
                  <Field
                    label="Conditions"
                    value={conditions}
                    onChangeText={setConditions}
                    placeholder="e.g., Asthma, Diabetes, Epilepsy"
                    multiline
                    hint="Chronic or recurring conditions that affect emergency care"
                    C={C}
                  />
                </SectionCard>

                <SectionCard icon={<Text style={{ fontSize: 15 }}>💊</Text>} title="Medications" accent={C.blue} C={C}>
                  <Field
                    label="Current Medications"
                    value={medications}
                    onChangeText={setMedications}
                    placeholder="e.g., Ventolin Inhaler, Insulin"
                    multiline
                    hint="Include dosage if known. Leave blank if none."
                    C={C}
                  />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>👨‍⚕️</Text>}
                  title="Family Doctor"
                  subtitle="Will be contacted if medical decision is needed"
                  accent={C.ok}
                  C={C}
                >
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Doctor Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Name" C={C} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label="Doctor's Phone"
                        value={doctorPhone}
                        onChangeText={setDoctorPhone}
                        placeholder="+91 98765 43210"
                        keyboardType="phone-pad"
                        C={C}
                      />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard icon={<Text style={{ fontSize: 15 }}>📋</Text>} title="Additional Notes" subtitle="Any other information for responders" C={C}>
                  <Field
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g., Child panics in crowds, carries EpiPen in bag"
                    multiline
                    C={C}
                  />
                </SectionCard>
              </View>
            )}

            {/* ── Step 2: Contacts ── */}
            {step === 2 && (
              <View style={s.stepContent}>
                <View style={[s.callInfoBox, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  <Text style={[s.callInfoTitle, { color: C.tx }]}>How Emergency Calls Work</Text>
                  {[
                    { color: PRIORITY_COLORS[0], text: 'Priority 1 — Called first when card is scanned' },
                    { color: PRIORITY_COLORS[1], text: 'Priority 2 — Called if #1 does not answer' },
                    { color: PRIORITY_COLORS[2], text: 'Priority 3 — Backup contact' },
                  ].map((item, i) => (
                    <View key={i} style={s.callInfoRow}>
                      <View style={[s.callInfoDot, { backgroundColor: item.color }]} />
                      <Text style={[s.callInfoText, { color: C.tx2 }]}>{item.text}</Text>
                    </View>
                  ))}
                  <View style={[s.callInfoDivider, { backgroundColor: C.bd }]} />
                  <Text style={[s.callInfoNote, { color: C.tx3 }]}>
                    Add at least 2 contacts. Use only reachable mobile numbers — not landlines.
                  </Text>
                </View>

                {sortedContacts.length === 0 ? (
                  <View style={[s.emptyContacts, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Text style={{ fontSize: 32 }}>📵</Text>
                    <Text style={[s.emptyTitle, { color: C.tx }]}>No Emergency Contacts Added</Text>
                    <Text style={[s.emptySub, { color: C.tx3 }]}>
                      Tap the button below to add your first contact. You can add up to 5 contacts.
                    </Text>
                    <TouchableOpacity
                      style={[s.emptyAddBtn, { backgroundColor: C.primary }]}
                      onPress={() => { setEditContact(null); setModalVisible(true); }}
                      activeOpacity={0.85}
                    >
                      <PlusSvg c="#fff" s={16} />
                      <Text style={s.emptyAddBtnText}>Add First Contact</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {sortedContacts.map((c, i) => (
                      <ContactCard
                        key={c.id ?? `contact_${i}`}
                        contact={c}
                        index={i}
                        onEdit={(con) => { setEditContact(con); setModalVisible(true); }}
                        onDelete={handleDeleteContact}
                        C={C}
                      />
                    ))}
                  </View>
                )}

                {contacts.length > 0 && contacts.length < 5 && (
                  <TouchableOpacity
                    style={[s.addBtn, { borderColor: C.primaryBd, backgroundColor: C.primaryBg }]}
                    onPress={() => { setEditContact(null); setModalVisible(true); }}
                    activeOpacity={0.75}
                  >
                    <View style={[s.addBtnIcon, { backgroundColor: C.primary }]}>
                      <PlusSvg c="#fff" s={18} />
                    </View>
                    <View>
                      <Text style={[s.addBtnLabel, { color: C.primary }]}>Add Another Contact</Text>
                      <Text style={[s.addBtnSub, { color: C.tx3 }]}>
                        {contacts.length} of 5 contacts added
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {contacts.length >= 5 && (
                  <View style={[s.note, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                    <Text style={{ fontSize: 12 }}>✅</Text>
                    <Text style={[s.noteText, { color: C.ok }]}>Maximum of 5 contacts reached.</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <View style={s.stepContent}>
                <View style={[s.reviewHeader, { backgroundColor: C.s2, borderColor: C.bd }]}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={s.reviewAvatarImg} />
                  ) : (
                    <View style={[s.reviewAvatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                      <Text style={[s.reviewAvatarText, { color: C.primary }]}>
                        {firstName ? firstName[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reviewName, { color: C.tx }]}>
                      {`${firstName} ${lastName}`.trim() || 'Child'}
                    </Text>
                    <Text style={[s.reviewClass, { color: C.tx3 }]}>{classLabel}</Text>
                  </View>
                  <View style={[
                    s.reviewStatus,
                    { backgroundColor: completed.length >= 3 ? C.okBg : C.s3, borderColor: completed.length >= 3 ? C.okBd : C.bd },
                  ]}>
                    <View style={[s.reviewStatusDot, { backgroundColor: completed.length >= 3 ? C.ok : C.tx3 }]} />
                    <Text style={[s.reviewStatusText, { color: completed.length >= 3 ? C.ok : C.tx3 }]}>
                      {completed.length >= 3 ? 'Ready' : 'Draft'}
                    </Text>
                  </View>
                </View>

                <SectionCard icon={<Text style={{ fontSize: 15 }}>👤</Text>} title="Student Information" C={C}>
                  <ReviewRow label="First Name" value={firstName} required C={C} />
                  <ReviewRow label="Last Name" value={lastName} required C={C} />
                  <ReviewRow label="Class" value={cls || 'Not set'} C={C} />
                  <ReviewRow label="Section" value={section || 'Not set'} C={C} />
                  <ReviewRow label="Profile Photo" value={profileImage ? 'Uploaded' : 'Not uploaded'} C={C} />
                </SectionCard>

                <SectionCard icon={<Text style={{ fontSize: 15 }}>❤️</Text>} title="Medical Information" C={C}>
                  <ReviewRow label="Blood Group" value={bloodGroup || 'Not set'} C={C} />
                  <ReviewRow label="Allergies" value={allergies || 'None'} C={C} />
                  <ReviewRow label="Conditions" value={conditions || 'None'} C={C} />
                  <ReviewRow label="Medications" value={medications || 'None'} C={C} />
                  <ReviewRow label="Doctor" value={doctorName || 'Not set'} C={C} />
                  <ReviewRow label="Doctor Phone" value={doctorPhone || 'Not set'} C={C} />
                </SectionCard>

                <SectionCard
                  icon={<Text style={{ fontSize: 15 }}>📞</Text>}
                  title={`Emergency Contacts (${contacts.length})`}
                  accent={C.blue}
                  C={C}
                >
                  {contacts.length === 0
                    ? (
                      <View style={[s.reviewWarn, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Text style={[s.reviewWarnText, { color: C.red }]}>
                          ⚠️  No emergency contacts added. Go back to Step 3 and add at least one contact.
                        </Text>
                      </View>
                    )
                    : sortedContacts.map((c, i) => (
                      <ReviewRow
                        key={c.id ?? `review_${i}`}
                        label={`#${c.priority} ${c.relationship || 'Contact'}`}
                        value={`${c.name} · ${c.phone}`}
                        C={C}
                      />
                    ))
                  }
                </SectionCard>

                <View style={[s.note, { backgroundColor: C.okBg, borderColor: C.okBd, flexDirection: 'row', gap: 8 }]}>
                  <Text style={{ fontSize: 14 }}>🛡️</Text>
                  <Text style={[s.noteText, { color: C.ok, flex: 1 }]}>
                    {isNewUser
                      ? 'Review all information carefully. Tap "Activate Card" when ready. You can update this any time from the profile screen.'
                      : 'Changes will take effect immediately after saving.'}
                  </Text>
                </View>
              </View>
            )}

          </Animated.View>
          <View style={{ height: 24 }} />
        </ScrollView>

        <NavFooter
          step={step}
          isNewUser={isNewUser}
          onBack={goBack}
          onNext={goNext}
          nextLabel={nextLabel}
          saving={saving}
          canProceed={canProceed}
          C={C}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH, paddingTop: spacing[5], paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, flex: 1, textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 14, gap: 14, paddingBottom: 30 },
  stepContent: { gap: 14 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  noteText: { fontSize: 11.5, flex: 1, lineHeight: 17 },
  callInfoBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  callInfoTitle: { fontSize: 13, fontWeight: '700' },
  callInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  callInfoDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  callInfoText: { fontSize: 12.5, flex: 1 },
  callInfoDivider: { height: 1, marginVertical: 2 },
  callInfoNote: { fontSize: 11.5, lineHeight: 17 },
  emptyContacts: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed' },
  addBtnIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addBtnLabel: { fontSize: 14, fontWeight: '700' },
  addBtnSub: { fontSize: 11.5, marginTop: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 16 },
  reviewAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewAvatarImg: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#fff', flexShrink: 0 },
  reviewAvatarText: { fontSize: 20, fontWeight: '900' },
  reviewName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  reviewClass: { fontSize: 12, marginTop: 2 },
  reviewStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  reviewStatusDot: { width: 5, height: 5, borderRadius: 3 },
  reviewStatusText: { fontSize: 11, fontWeight: '700' },
  reviewWarn: { borderRadius: 10, borderWidth: 1, padding: 12 },
  reviewWarnText: { fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
});