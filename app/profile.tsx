import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";

// ─── Theme (matches Dashboard, Welcome, Updates, Profile) ─────────────────────

const THEME = {
  colors: {
    bg: "#0D0F14",
    surface: "#161921",
    card: "#1E2230",
    cardBorder: "#2A2F42",
    accent: "#5B7FFF",
    accentGlow: "rgba(91, 127, 255, 0.18)",
    mint: "#34D399",
    mintSoft: "rgba(52, 211, 153, 0.12)",
    light: "#E8ECF4",
    muted: "#6B7280",
    dimmed: "#3D4358",
    white: "#FFFFFF",
  },
  font: {
    display: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    body: Platform.select({ ios: "Helvetica Neue", android: "sans-serif", default: "sans-serif" }),
    mono: Platform.select({ ios: "Courier New", android: "monospace", default: "monospace" }),
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 50 },
};

// ─── Field Config ─────────────────────────────────────────────────────────────

const FIELDS = [
  { key: "fullName",  label: "FULL NAME",              icon: "👤", required: true,  multiline: false, keyboard: "default"   as const },
  { key: "guardian",  label: "GUARDIAN NAME",           icon: "🛡",  required: true,  multiline: false, keyboard: "default"   as const },
  { key: "emergency", label: "EMERGENCY CONTACT",       icon: "📞", required: true,  multiline: false, keyboard: "phone-pad" as const },
  { key: "blood",     label: "BLOOD TYPE",              icon: "🩸", required: true,  multiline: false, keyboard: "default"   as const },
  { key: "medical",   label: "MEDICAL INFO (OPTIONAL)", icon: "🏥", required: false, multiline: true,  keyboard: "default"   as const },
];

type FormKeys = "fullName" | "guardian" | "emergency" | "blood" | "medical";

// ─── Animated Field Row ───────────────────────────────────────────────────────

function FieldRow({
  field,
  value,
  focused,
  index,
  onChange,
  onFocus,
  onBlur,
  scale,
}: {
  field: typeof FIELDS[0];
  value: string;
  focused: boolean;
  index: number;
  onChange: (v: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  scale: (n: number) => number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: 320 + index * 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 75, friction: 11, delay: 320 + index * 70, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(borderAnim, { toValue: focused ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME.colors.cardBorder, THEME.colors.accent],
  });
  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [THEME.colors.card, "#191E2E"],
  });

  return (
    <Animated.View style={[fStyles.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={fStyles.labelRow}>
        <Text style={fStyles.icon}>{field.icon}</Text>
        <Text style={fStyles.label}>{field.label}</Text>
        {field.required && <View style={fStyles.dot} />}
      </View>
      <Animated.View style={[fStyles.inputWrap, { borderColor, backgroundColor: bgColor }]}>
        <TextInput
          style={[
            fStyles.input,
            { fontSize: scale(15) },
            field.multiline && { height: scale(90), textAlignVertical: "top" },
          ]}
          multiline={field.multiline}
          value={value}
          placeholder={`Enter ${field.label.toLowerCase().replace(" (optional)", "")}`}
          placeholderTextColor={THEME.colors.dimmed}
          keyboardType={field.keyboard}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {focused && <View style={fStyles.focusDot} />}
      </Animated.View>
    </Animated.View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  icon: { fontSize: 12 },
  label: {
    fontSize: 10, fontWeight: "700", letterSpacing: 1.4,
    color: THEME.colors.muted, fontFamily: THEME.font.mono,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: THEME.colors.accent, marginLeft: 2 },
  inputWrap: {
    borderRadius: THEME.radius.md, borderWidth: 1.5,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  input: { flex: 1, color: THEME.colors.light, fontFamily: THEME.font.body, padding: 0 },
  focusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.accent, marginLeft: 8 },
});

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ filled, total }: { filled: number; total: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: filled / total, tension: 60, friction: 10, useNativeDriver: false }).start();
  }, [filled]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={pStyles.track}>
      <Animated.View style={[pStyles.fill, { width }]} />
    </View>
  );
}

const pStyles = StyleSheet.create({
  track: {
    height: 4, backgroundColor: THEME.colors.cardBorder,
    borderRadius: 2, overflow: "hidden", marginTop: 8, marginBottom: 28,
  },
  fill: { height: "100%", backgroundColor: THEME.colors.accent, borderRadius: 2 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = (size: number) => (width / 375) * size;
  const hPad = isTablet ? width * 0.18 : 20;

  const [photo, setPhoto] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [form, setForm] = useState<Record<FormKeys, string>>({
    fullName: "", guardian: "", emergency: "", blood: "", medical: "",
  });

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-16)).current;
  const photoFade = useRef(new Animated.Value(0)).current;
  const photoEntrance = useRef(new Animated.Value(0.9)).current;
  const photoScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(photoFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(photoEntrance, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleChange = (key: FormKeys, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickImage = async () => {
    Animated.sequence([
      Animated.timing(photoScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(photoScale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow gallery access to upload a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const requiredKeys: FormKeys[] = ["fullName", "guardian", "emergency", "blood"];
  const filledCount = requiredKeys.filter((k) => form[k].length > 0).length + (photo ? 1 : 0);
  const totalCount = requiredKeys.length + 1;
  const isComplete = filledCount === totalCount;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();

  const avatarSize = scale(isTablet ? 130 : 108);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />
      <View style={styles.stripe} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Wordmark ── */}
        <Animated.View style={[styles.wordmark, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmarkText}>SAFETY QR</Text>
        </Animated.View>

        <View style={styles.divider} />

        {/* ── Header ── */}
        <Animated.View style={[{ opacity: headerFade, transform: [{ translateY: headerSlide }] }, { marginBottom: 28 }]}>
          <Text style={[styles.title, { fontSize: scale(isTablet ? 30 : 24) }]}>
            Create{"\n"}Your Profile
          </Text>
          <Text style={styles.subtitle}>
            Fill in your details to generate a personal safety QR card
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{filledCount} of {totalCount} fields complete</Text>
            <Text style={[styles.progressLabel, { color: THEME.colors.accent }]}>
              {Math.round((filledCount / totalCount) * 100)}%
            </Text>
          </View>
          <ProgressBar filled={filledCount} total={totalCount} />
        </Animated.View>

        {/* ── Photo ── */}
        <Animated.View style={[styles.photoCard, { opacity: photoFade, transform: [{ scale: photoEntrance }] }]}>
          <TouchableOpacity onPress={pickImage} activeOpacity={1}>
            <Animated.View style={{ transform: [{ scale: photoScale }] }}>
              {photo ? (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: photo }} style={[styles.photo, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
                  <View style={styles.editBadge}>
                    <Text style={styles.editBadgeText}>✎</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.photoPlaceholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                  <Text style={styles.photoPlaceholderPlus}>+</Text>
                  <Text style={styles.photoPlaceholderSub}>Photo</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.photoMeta}>
            <Text style={styles.photoMetaTitle}>{photo ? "Photo added ✓" : "Upload your photo"}</Text>
            <Text style={styles.photoMetaSub}>{photo ? "Tap to change" : "Required for your QR card"}</Text>
          </View>
        </Animated.View>

        {/* ── Fields Card ── */}
        <View style={styles.fieldsCard}>
          <View style={styles.fieldsCardHeader}>
            <Text style={styles.fieldsCardTitle}>STUDENT DETAILS</Text>
            <View style={styles.fieldsCardDot} />
          </View>
          <View style={styles.fieldsCardBody}>
            {FIELDS.map((field, index) => (
              <FieldRow
                key={field.key}
                field={field}
                value={form[field.key as FormKeys]}
                focused={focusedField === field.key}
                index={index}
                onChange={(v) => handleChange(field.key as FormKeys, v)}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
                scale={scale}
              />
            ))}
          </View>
        </View>

        {/* ── Button ── */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.primaryBtn, !isComplete && styles.primaryBtnDisabled]}
            disabled={!isComplete}
            onPress={() => router.replace("/(tabs)/dashboard")}
            onPressIn={() => isComplete && pressIn(btnScale)}
            onPressOut={() => pressOut(btnScale)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Save and Generate QR"
          >
            <Text style={[styles.primaryBtnText, !isComplete && styles.primaryBtnTextDisabled]}>
              Save & Generate QR
            </Text>
            {isComplete && (
              <View style={styles.arrowBadge}>
                <Text style={styles.arrowText}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {!isComplete && (
          <Text style={styles.hint}>
            {totalCount - filledCount} field{totalCount - filledCount !== 1 ? "s" : ""} remaining
          </Text>
        )}

        <Text style={styles.footer}>
          Your data is stored securely on-device · {new Date().getFullYear()}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.bg },
  stripe: {
    position: "absolute", top: 0, right: 0,
    width: 3, height: "100%",
    backgroundColor: THEME.colors.accent, opacity: 0.4, zIndex: 10,
  },
  scroll: { paddingTop: 28, paddingBottom: 40 },

  wordmark: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  wordmarkText: {
    fontSize: 11, fontWeight: "700", letterSpacing: 2.5,
    color: THEME.colors.accent, fontFamily: THEME.font.mono,
  },
  divider: { height: 1, backgroundColor: THEME.colors.cardBorder, marginBottom: 22, opacity: 0.5 },

  title: {
    fontWeight: "800", color: THEME.colors.light,
    fontFamily: THEME.font.display, letterSpacing: -0.5, marginBottom: 10,
  },
  subtitle: {
    fontSize: 13, color: THEME.colors.muted, fontFamily: THEME.font.body,
    letterSpacing: 0.2, lineHeight: 19, marginBottom: 18,
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11, color: THEME.colors.muted, fontFamily: THEME.font.mono, letterSpacing: 0.4 },

  // Photo
  photoCard: {
    flexDirection: "row", alignItems: "center", gap: 20,
    backgroundColor: THEME.colors.card, borderRadius: THEME.radius.md,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    padding: 18, marginBottom: 20,
  },
  photoWrap: { position: "relative" },
  photo: { borderWidth: 2.5, borderColor: THEME.colors.accent },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: THEME.colors.accent,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: THEME.colors.bg,
  },
  editBadgeText: { color: THEME.colors.white, fontSize: 13, fontWeight: "700" },
  photoPlaceholder: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 2, borderColor: THEME.colors.cardBorder,
    borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  photoPlaceholderPlus: { color: THEME.colors.accent, fontSize: 22, fontWeight: "700" },
  photoPlaceholderSub: { color: THEME.colors.muted, fontSize: 10, fontFamily: THEME.font.body, letterSpacing: 0.5 },
  photoMeta: { flex: 1 },
  photoMetaTitle: { fontSize: 14, fontWeight: "700", color: THEME.colors.light, fontFamily: THEME.font.body, marginBottom: 4 },
  photoMetaSub: { fontSize: 12, color: THEME.colors.muted, fontFamily: THEME.font.body },

  // Fields card
  fieldsCard: {
    backgroundColor: THEME.colors.card, borderRadius: THEME.radius.lg,
    borderWidth: 1, borderColor: THEME.colors.cardBorder,
    overflow: "hidden", marginBottom: 20,
  },
  fieldsCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 13,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1, borderBottomColor: THEME.colors.cardBorder,
  },
  fieldsCardTitle: { fontSize: 10, fontFamily: THEME.font.mono, color: THEME.colors.muted, letterSpacing: 2, fontWeight: "700" },
  fieldsCardDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.accent },
  fieldsCardBody: { padding: 20 },

  // Button
  primaryBtn: {
    backgroundColor: THEME.colors.accent, borderRadius: THEME.radius.md,
    paddingVertical: 16, paddingHorizontal: 24,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: THEME.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5, borderColor: THEME.colors.cardBorder,
    shadowOpacity: 0, elevation: 0,
  },
  primaryBtnText: { color: THEME.colors.white, fontSize: 16, fontWeight: "700", fontFamily: THEME.font.body, letterSpacing: 0.3 },
  primaryBtnTextDisabled: { color: THEME.colors.dimmed },
  arrowBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  arrowText: { color: THEME.colors.white, fontSize: 18, fontWeight: "600" },

  hint: { textAlign: "center", marginTop: 10, color: THEME.colors.dimmed, fontSize: 11, fontFamily: THEME.font.mono, letterSpacing: 0.4 },
  footer: { textAlign: "center", color: THEME.colors.dimmed, fontSize: 11, fontFamily: THEME.font.body, letterSpacing: 0.3, marginTop: 20 },
});