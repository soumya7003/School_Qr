/**
 * UpdatesScreen — Professional Wizard / Stepper
 *
 * Design: "Clinical Command Center"
 * Dark, authoritative, zero-childish. Matches emergency.jsx / qr.jsx aesthetic.
 *
 * Architecture:
 *  - 4-step wizard: Child → Medical → Contacts → Review & Submit
 *  - SINGLE API call: PATCH /parent/profile/complete  (batches all data)
 *  - Step progress bar at top — numbered, labeled, connected
 *  - Onboarding mode: step 4 = "Activate Card"
 *  - Edit mode: step 4 = "Save All Changes"
 *
 * API payload shape:
 * {
 *   student:   { first_name, last_name, class, section },
 *   emergency: { blood_group, allergies, conditions, medications,
 *                doctor_name, doctor_phone, notes },
 *   contacts:  [ { name, phone, relationship, priority } ],
 *   card_visibility: { visibility, hidden_fields }
 * }
 */

import Screen from "@/components/common/Screen";
import { useAuthStore } from "@/features/auth/auth.store";
import { useProfileStore } from "@/features/profile/profile.store";
import { spacing, typography } from "@/theme";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  bg: "#07070A",
  s1: "#0C0C10",
  s2: "#111116",
  s3: "#17171E",
  s4: "#1E1E27",
  s5: "#25252F",
  bd: "rgba(255,255,255,0.07)",
  bd2: "rgba(255,255,255,0.12)",
  tx: "#F0F0F5",
  tx2: "rgba(240,240,245,0.62)",
  tx3: "rgba(240,240,245,0.32)",
  red: "#E8342A",
  redBg: "rgba(232,52,42,0.08)",
  redBd: "rgba(232,52,42,0.22)",
  ok: "#12A150",
  okBg: "rgba(18,161,80,0.08)",
  okBd: "rgba(18,161,80,0.22)",
  amb: "#D97706",
  blue: "#3B82F6",
  blueBg: "rgba(59,130,246,0.08)",
  blueBd: "rgba(59,130,246,0.22)",
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Ic = {
  User: ({ c = T.tx3, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={1.7} />
    </Svg>
  ),
  Heart: ({ c = T.red, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Phone: ({ c = T.tx3, s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  ),
  Check: ({ c = "#fff", s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  ChevronRight: ({ c = T.tx3, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  ChevronLeft: ({ c = T.tx2, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Plus: ({ c = "#fff", s = 18 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  ),
  Edit: ({ c = T.tx2, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Trash: ({ c = T.red, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  ),
  Camera: ({ c = T.tx3, s = 20 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={c} strokeWidth={1.7} />
    </Svg>
  ),
  Drop: ({ c = T.red, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  Shield: ({ c = T.ok, s = 16 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L4 6v7c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6L12 2z" stroke={c} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  ),
  Lightning: ({ c = "#fff", s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  X: ({ c = T.red, s = 14 }) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  ),
};

// ─── Constants ───────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "O+", "O−", "AB+", "AB−", "Unknown"];
const PRIORITY_COLORS = ["#E8342A", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

const STEPS = [
  { id: 0, key: "child", label: "Student", shortLabel: "01" },
  { id: 1, key: "medical", label: "Medical", shortLabel: "02" },
  { id: 2, key: "contacts", label: "Contacts", shortLabel: "03" },
  { id: 3, key: "review", label: "Review", shortLabel: "04" },
];

// ─── Single API endpoint ─────────────────────────────────────────────────────
// Consolidated payload sent in one transaction to PATCH /parent/profile/complete
// This avoids partial saves and race conditions across tabs.
async function submitAllData(patchStudent, studentId, payload) {
  return await patchStudent(studentId, payload);
}

// ─── StepBar ─────────────────────────────────────────────────────────────────
function StepBar({ current, completed }) {
  return (
    <View style={sb.wrap}>
      {STEPS.map((step, i) => {
        const isActive = i === current;
        const isDone = completed.includes(i);
        const isLast = i === STEPS.length - 1;

        return (
          <View key={step.id} style={sb.stepGroup}>
            {/* Connector line before */}
            {i > 0 && (
              <View style={[sb.line, (isDone || isActive) && sb.lineActive]} />
            )}

            {/* Circle */}
            <View style={[
              sb.circle,
              isActive && sb.circleActive,
              isDone && sb.circleDone,
            ]}>
              {isDone ? (
                <Ic.Check c="#fff" s={10} />
              ) : (
                <Text style={[sb.circleNum, isActive && sb.circleNumActive]}>
                  {step.shortLabel}
                </Text>
              )}
            </View>

            {/* Label */}
            <Text style={[sb.label, isActive && sb.labelActive, isDone && sb.labelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: spacing.screenH,
    paddingVertical: spacing[4],
    backgroundColor: T.s1,
    borderBottomWidth: 1,
    borderBottomColor: T.bd,
    gap: 0,
  },
  stepGroup: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  line: {
    position: "absolute",
    top: 13,
    right: "50%",
    left: "-50%",
    height: 1,
    backgroundColor: T.bd2,
  },
  lineActive: {
    backgroundColor: T.red,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.bd2,
    backgroundColor: T.s3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    zIndex: 1,
  },
  circleActive: {
    borderColor: T.red,
    backgroundColor: T.redBg,
  },
  circleDone: {
    borderColor: T.ok,
    backgroundColor: T.okBg,
  },
  circleNum: {
    fontSize: 9,
    fontWeight: "800",
    color: T.tx3,
    letterSpacing: 0.3,
  },
  circleNumActive: {
    color: T.red,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: T.tx3,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  labelActive: { color: T.tx },
  labelDone: { color: T.ok },
});

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, hint, required }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const animate = (to) =>
    Animated.timing(anim, { toValue: to, duration: 160, useNativeDriver: false }).start();

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [T.bd2, T.red],
  });

  return (
    <View style={fld.wrap}>
      <View style={fld.labelRow}>
        <Text style={fld.label}>{label}</Text>
        {required && <View style={fld.reqDot} />}
      </View>
      <Animated.View style={[fld.box, { borderColor }]}>
        <TextInput
          style={[fld.input, multiline && fld.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.tx3}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType ?? "default"}
          textAlignVertical={multiline ? "top" : "center"}
          selectionColor={T.red}
          cursorColor={T.red}
          onFocus={() => animate(1)}
          onBlur={() => animate(0)}
        />
      </Animated.View>
      {hint && <Text style={fld.hint}>{hint}</Text>}
    </View>
  );
}

const fld = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: T.tx3,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  reqDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.red, marginTop: 1 },
  box: {
    borderWidth: 1,
    borderColor: T.bd2,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: T.s2,
  },
  input: {
    ...typography.bodyMd,
    color: T.tx,
    height: 44,
    paddingVertical: 0,
    fontSize: 14.5,
  },
  inputMulti: {
    height: 84,
    paddingTop: 12,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  hint: { fontSize: 11, color: T.tx3, fontStyle: "italic" },
});

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, accent = T.red }) {
  return (
    <View style={sc.card}>
      <View style={[sc.head, { borderLeftColor: accent }]}>
        <View style={[sc.iconWrap, { backgroundColor: `${accent}12`, borderColor: `${accent}30` }]}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sc.title}>{title}</Text>
          {subtitle && <Text style={sc.sub}>{subtitle}</Text>}
        </View>
      </View>
      <View style={sc.body}>{children}</View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: T.s2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.bd,
    overflow: "hidden",
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.bd,
    borderLeftWidth: 3,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 13.5, fontWeight: "700", color: T.tx },
  sub: { fontSize: 11, color: T.tx3, marginTop: 1 },
  body: { padding: 16, gap: 14 },
});

// ─── Row Layout ───────────────────────────────────────────────────────────────
function Row({ children }) {
  return <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>;
}

// ─── Blood Picker ─────────────────────────────────────────────────────────────
function BloodPicker({ value, onChange }) {
  return (
    <View style={bp.wrap}>
      <View style={bp.grid}>
        {BLOOD_GROUPS.map((bg) => {
          const sel = value === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[bp.chip, sel && bp.chipSel]}
              onPress={() => onChange(bg)}
              activeOpacity={0.7}
            >
              {sel && <Ic.Drop c={T.red} s={10} />}
              <Text style={[bp.text, sel && bp.textSel]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {!value && (
        <View style={bp.warn}>
          <Text style={bp.warnText}>Select blood group — critical for emergency response</Text>
        </View>
      )}
    </View>
  );
}

const bp = StyleSheet.create({
  wrap: { gap: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.bd2,
    backgroundColor: T.s3,
    minWidth: 54,
    justifyContent: "center",
  },
  chipSel: {
    borderColor: T.redBd,
    backgroundColor: T.redBg,
  },
  text: { fontSize: 13, fontWeight: "700", color: T.tx2 },
  textSel: { color: T.red },
  warn: {
    backgroundColor: "rgba(217,119,6,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.22)",
    padding: 10,
  },
  warnText: { fontSize: 12, color: T.amb, fontWeight: "600" },
});

// ─── Photo Row ────────────────────────────────────────────────────────────────
function PhotoRow({ photoUrl, onPress }) {
  return (
    <TouchableOpacity style={ph.row} onPress={onPress} activeOpacity={0.75}>
      <View style={ph.avatar}>
        <Ic.User c={T.tx3} s={24} />
        <View style={ph.badge}>
          <Ic.Camera c="#fff" s={9} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ph.label}>{photoUrl ? "Change Photo" : "Add Profile Photo"}</Text>
        <Text style={ph.sub}>Helps first responders identify your child instantly</Text>
      </View>
      <View style={ph.arrow}>
        <Ic.ChevronRight c={T.tx3} s={14} />
      </View>
    </TouchableOpacity>
  );
}

const ph = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.s3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.bd2,
    padding: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: T.s4,
    borderWidth: 1,
    borderColor: T.bd2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.red,
    borderWidth: 2,
    borderColor: T.s3,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13.5, fontWeight: "700", color: T.tx },
  sub: { fontSize: 11.5, color: T.tx3, marginTop: 2 },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: T.s4,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ contact, index, onEdit, onDelete }) {
  const pc = PRIORITY_COLORS[(contact.priority - 1) % PRIORITY_COLORS.length];
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, delay: index * 55, useNativeDriver: true, tension: 85, friction: 8,
    }).start();
  }, []);

  return (
    <Animated.View style={[cc.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Priority badge */}
      <View style={[cc.priority, { backgroundColor: `${pc}12`, borderColor: `${pc}30` }]}>
        <Text style={[cc.priorityNum, { color: pc }]}>{contact.priority}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={cc.top}>
          <Text style={cc.name}>{contact.name}</Text>
          {contact.priority === 1 && (
            <View style={cc.firstTag}>
              <Text style={cc.firstTagText}>First Call</Text>
            </View>
          )}
        </View>
        <Text style={cc.meta}>
          {contact.relationship || "Guardian"} · {contact.phone}
        </Text>
      </View>

      <View style={cc.actions}>
        <TouchableOpacity style={cc.btn} onPress={() => onEdit(contact)} activeOpacity={0.7}>
          <Ic.Edit c={T.tx2} s={12} />
        </TouchableOpacity>
        <TouchableOpacity style={[cc.btn, cc.btnRed]} onPress={() => onDelete(contact)} activeOpacity={0.7}>
          <Ic.Trash c={T.red} s={12} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const cc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.s3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.bd,
    padding: 14,
  },
  priority: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  priorityNum: { fontSize: 13, fontWeight: "900" },
  top: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 13.5, fontWeight: "700", color: T.tx },
  firstTag: {
    backgroundColor: "rgba(232,52,42,0.1)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(232,52,42,0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  firstTagText: { fontSize: 9, fontWeight: "800", color: T.red, letterSpacing: 0.5, textTransform: "uppercase" },
  meta: { fontSize: 11.5, color: T.tx3, marginTop: 3 },
  actions: { flexDirection: "row", gap: 6 },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.s4,
    borderWidth: 1,
    borderColor: T.bd,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRed: { backgroundColor: T.redBg, borderColor: T.redBd },
});

// ─── Contact Modal ─────────────────────────────────────────────────────────────
function ContactModal({ visible, contact, onSave, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRel] = useState("");

  useEffect(() => {
    if (visible) {
      setName(contact?.name ?? "");
      setPhone(contact?.phone ?? "");
      setRel(contact?.relationship ?? "");
    }
  }, [visible, contact]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Name and phone are required.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      Alert.alert("Invalid Phone", "Enter a valid 10-digit Indian mobile number.");
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), relationship: relationship.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={cm.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={cm.sheet}>
            <View style={cm.handle} />
            <View style={cm.sheetHead}>
              <View>
                <Text style={cm.sheetTitle}>{contact?.id ? "Edit Contact" : "Add Contact"}</Text>
                <Text style={cm.sheetSub}>Called when QR card is scanned</Text>
              </View>
              <TouchableOpacity style={cm.closeBtn} onPress={onClose}>
                <Ic.X c={T.tx3} s={14} />
              </TouchableOpacity>
            </View>
            <View style={cm.fields}>
              <Field label="Full Name" value={name} onChangeText={setName} placeholder="Priya Sharma" required />
              <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="98765 43210" keyboardType="phone-pad" required />
              <Field label="Relationship" value={relationship} onChangeText={setRel} placeholder="Mother / Father / Guardian…" />
            </View>
            <TouchableOpacity style={cm.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ic.Check c="#fff" s={14} />
              <Text style={cm.saveBtnText}>{contact?.id ? "Save Changes" : "Add Contact"}</Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: T.s1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: T.bd2,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  handle: { width: 36, height: 4, backgroundColor: T.s4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: T.tx, letterSpacing: -0.3 },
  sheetSub: { fontSize: 12, color: T.tx3, marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: T.s3,
    borderWidth: 1,
    borderColor: T.bd,
    alignItems: "center",
    justifyContent: "center",
  },
  fields: { gap: 12 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: T.red,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 4,
    shadowColor: T.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  saveBtnText: { fontSize: 14.5, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
});

// ─── Review Row ───────────────────────────────────────────────────────────────
function ReviewRow({ label, value, empty }) {
  return (
    <View style={rv.row}>
      <Text style={rv.label}>{label}</Text>
      <Text style={[rv.value, empty && rv.empty]}>{value || "—"}</Text>
    </View>
  );
}

const rv = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: T.bd },
  label: { fontSize: 12, color: T.tx3, flex: 1, fontWeight: "600" },
  value: { fontSize: 13, color: T.tx, flex: 2, textAlign: "right", fontWeight: "600" },
  empty: { color: T.tx3, fontStyle: "italic", fontWeight: "400" },
});

// ─── Nav Footer ───────────────────────────────────────────────────────────────
function NavFooter({ step, onBack, onNext, nextLabel, saving, canProceed }) {
  const isFirst = step === 0;

  return (
    <View style={nf.bar}>
      {/* Back */}
      <TouchableOpacity
        style={[nf.backBtn, isFirst && nf.backBtnHidden]}
        onPress={onBack}
        disabled={isFirst}
        activeOpacity={0.7}
      >
        <Ic.ChevronLeft c={T.tx2} s={16} />
        <Text style={nf.backText}>Back</Text>
      </TouchableOpacity>

      {/* Next / Submit */}
      <TouchableOpacity
        style={[nf.nextBtn, saving && nf.nextBtnBusy, !canProceed && nf.nextBtnDisabled]}
        onPress={onNext}
        disabled={saving || !canProceed}
        activeOpacity={0.85}
      >
        {saving ? (
          <Text style={nf.nextText}>Saving…</Text>
        ) : (
          <>
            <Text style={nf.nextText}>{nextLabel}</Text>
            {nextLabel.includes("Next") ? (
              <Ic.ChevronRight c="#fff" s={15} />
            ) : (
              <Ic.Lightning c="#fff" s={13} />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const nf = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenH,
    paddingTop: 14,
    paddingBottom: spacing[6],
    backgroundColor: T.s1,
    borderTopWidth: 1,
    borderTopColor: T.bd,
    gap: 10,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.bd2,
    backgroundColor: T.s2,
  },
  backBtnHidden: { opacity: 0, pointerEvents: "none" },
  backText: { fontSize: 14, fontWeight: "600", color: T.tx2 },

  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: T.red,
    borderRadius: 12,
    paddingVertical: 15,
    shadowColor: T.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  nextBtnBusy: { opacity: 0.6 },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { fontSize: 14.5, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function UpdatesScreen() {
  const router = useRouter();

  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setIsNewUser = useAuthStore((s) => s.setIsNewUser);

  const profileStore = useProfileStore();
  const patchStudent = useProfileStore((s) => s.patchStudent);
  const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
  const student = useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null
  );
  const emergencyProfile = student?.emergency ?? null;
  const rawContacts = student?.emergency?.contacts ?? [];

  // ── Wizard state
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [saving, setSaving] = useState(false);

  // ── Child fields
  const [firstName, setFirstName] = useState(student?.first_name ?? "");
  const [lastName, setLastName] = useState(student?.last_name ?? "");
  const [cls, setCls] = useState(student?.class ?? "");
  const [section, setSection] = useState(student?.section ?? "");

  // ── Medical fields
  const [bloodGroup, setBloodGroup] = useState(emergencyProfile?.blood_group ?? "");
  const [allergies, setAllergies] = useState(emergencyProfile?.allergies ?? "");
  const [conditions, setConditions] = useState(emergencyProfile?.conditions ?? "");
  const [medications, setMedications] = useState(emergencyProfile?.medications ?? "");
  const [doctorName, setDoctorName] = useState(emergencyProfile?.doctor_name ?? "");
  const [doctorPhone, setDoctorPhone] = useState(emergencyProfile?.doctor_phone ?? "");
  const [notes, setNotes] = useState(emergencyProfile?.notes ?? "");

  // ── Contacts
  const [contacts, setContacts] = useState(rawContacts ?? []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditContact] = useState(null);

  // Sync from store
  useEffect(() => {
    setFirstName(student?.first_name ?? "");
    setLastName(student?.last_name ?? "");
    setCls(student?.class ?? "");
    setSection(student?.section ?? "");
  }, [student]);

  useEffect(() => {
    setBloodGroup(emergencyProfile?.blood_group ?? "");
    setAllergies(emergencyProfile?.allergies ?? "");
    setConditions(emergencyProfile?.conditions ?? "");
    setMedications(emergencyProfile?.medications ?? "");
    setDoctorName(emergencyProfile?.doctor_name ?? "");
    setDoctorPhone(emergencyProfile?.doctor_phone ?? "");
    setNotes(emergencyProfile?.notes ?? "");
  }, [emergencyProfile]);

  useEffect(() => setContacts(rawContacts ?? []), [rawContacts]);

  // ── Scroll ref
  const scrollRef = useRef(null);

  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  // ── Step validation
  const canProceed = (() => {
    if (step === 0) return firstName.trim().length > 0 && lastName.trim().length > 0;
    if (step === 1) return true; // medical all optional
    if (step === 2) return true; // contacts optional
    if (step === 3) return true; // review always
    return true;
  })();

  // ── Next / Back
  const goNext = () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Required", "First name and last name are required.");
        return;
      }
    }
    if (step === 1 && doctorPhone && !/^[6-9]\d{9}$/.test(doctorPhone.trim())) {
      Alert.alert("Invalid Phone", "Enter a valid doctor phone number.");
      return;
    }
    if (step < 3) {
      setCompleted((prev) => prev.includes(step) ? prev : [...prev, step]);
      setStep(step + 1);
      scrollTop();
    } else {
      handleSubmitAll();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      scrollTop();
    }
  };

  // ── SINGLE API — submit all data at once
  const handleSubmitAll = async () => {
    setSaving(true);
    try {
      const payload = {
        student: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class: cls.trim(),
          section: section.trim(),
        },
        emergency: {
          blood_group: bloodGroup,
          allergies: allergies.trim(),
          conditions: conditions.trim(),
          medications: medications.trim(),
          doctor_name: doctorName.trim(),
          doctor_phone: doctorPhone.trim(),
          notes: notes.trim(),
        },
        contacts: contacts.map((c, i) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relationship: c.relationship,
          priority: i + 1,
          is_active: true,
        })),
      };

      await submitAllData(patchStudent, student.id, payload);

      setCompleted([0, 1, 2, 3]);

      if (isNewUser) {
        await fetchAndPersist();   // ← gets fresh token status (now ACTIVE)
        await setIsNewUser(false);
        setTimeout(() => router.replace("/(app)/home"), 900);
      } else {
        // Show inline success on review step
        Alert.alert("Saved", "All changes have been saved to your child's card.");
      }
    } catch {
      Alert.alert("Error", "Could not save. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Contact handlers
  const handleSaveContact = (data) => {
    if (editingContact?.id) {
      const updated = contacts.map((c) =>
        c.id === editingContact.id ? { ...c, ...data } : c
      );
      setContacts(updated);
      updateContact?.({ ...editingContact, ...data });
    } else {
      const newC = {
        id: `tmp_${Date.now()}`,
        ...data,
        priority: contacts.length + 1,
        is_active: true,
      };
      setContacts((p) => [...p, newC]);
      addContact?.(newC);
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert("Remove Contact", `Remove ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: () => {
          const updated = contacts
            .filter((c) => c.id !== contact.id)
            .map((c, i) => ({ ...c, priority: i + 1 }));
          setContacts(updated);
          deleteContact?.(contact.id);
        },
      },
    ]);
  };

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  // ── Next button label
  const nextLabel = step === 3
    ? (isNewUser ? "Activate Card" : "Save All")
    : "Next";

  // ── Animated step transition
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const transitionStep = (newStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 20, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(-20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  };

  return (
    <Screen bg={T.bg} edges={["top", "left", "right"]}>
      <ContactModal
        visible={modalVisible}
        contact={editingContact}
        onSave={handleSaveContact}
        onClose={() => setModalVisible(false)}
      />

      {/* ── HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>
            {isNewUser ? "Activate Your Card" : (student?.first_name ? `${student.first_name}'s Profile` : "Update Profile")}
          </Text>
          <Text style={s.headerSub}>
            {isNewUser
              ? "Complete all steps to activate the emergency card"
              : "All changes saved in a single transaction"}
          </Text>
        </View>
        {isNewUser && (
          <View style={s.onboardBadge}>
            <View style={s.onboardDot} />
            <Text style={s.onboardText}>New</Text>
          </View>
        )}
      </View>

      {/* ── STEP BAR */}
      <StepBar current={step} completed={completed} />

      {/* ── CONTENT */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ════ STEP 0 — CHILD ════ */}
          {step === 0 && (
            <View style={s.stepContent}>
              {isNewUser && (
                <View style={s.onboardBanner}>
                  <Ic.Shield c={T.ok} s={16} />
                  <Text style={s.onboardBannerText}>
                    Registration successful. Fill in your child's details below to activate their emergency card.
                  </Text>
                </View>
              )}

              <SectionCard
                icon={<Ic.Camera c={T.tx3} s={17} />}
                title="Profile Photo"
                subtitle="Helps responders identify your child"
              >
                <PhotoRow photoUrl={student?.photo_url} onPress={() => { }} />
              </SectionCard>

              <SectionCard
                icon={<Ic.User c={T.red} s={17} />}
                title="Student Name"
                subtitle="As it appears on school records"
                accent={T.red}
              >
                <Row>
                  <View style={{ flex: 1 }}>
                    <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="Aanya" required />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Sharma" required />
                  </View>
                </Row>
              </SectionCard>

              <SectionCard
                icon={<View style={{ width: 17, height: 17, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13 }}>🏫</Text>
                </View>}
                title="Class & Section"
                accent={T.blue}
              >
                <Row>
                  <View style={{ flex: 1 }}>
                    <Field label="Class" value={cls} onChangeText={setCls} placeholder="6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Section" value={section} onChangeText={setSection} placeholder="A" />
                  </View>
                </Row>
              </SectionCard>

              <View style={s.stepNote}>
                <Text style={s.stepNoteText}>
                  Fields marked with · are required to proceed.
                </Text>
              </View>
            </View>
          )}

          {/* ════ STEP 1 — MEDICAL ════ */}
          {step === 1 && (
            <View style={s.stepContent}>
              <SectionCard
                icon={<Ic.Drop c={T.red} s={17} />}
                title="Blood Group"
                subtitle="Displayed immediately on card scan"
                accent={T.red}
              >
                <BloodPicker value={bloodGroup} onChange={setBloodGroup} />
              </SectionCard>

              <SectionCard
                icon={<View><Text style={{ fontSize: 15 }}>⚠️</Text></View>}
                title="Allergies"
                subtitle="Food, medication, environmental"
                accent={T.amb}
              >
                <Field
                  label="Known Allergies"
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="e.g. Peanuts, Penicillin, Latex…"
                  multiline
                  hint="Separate multiple allergies with commas"
                />
              </SectionCard>

              <SectionCard
                icon={<View><Text style={{ fontSize: 15 }}>🫁</Text></View>}
                title="Medical Conditions"
                accent={T.blue}
              >
                <Field
                  label="Conditions"
                  value={conditions}
                  onChangeText={setConditions}
                  placeholder="e.g. Asthma, Type 1 Diabetes, Epilepsy…"
                  multiline
                />
              </SectionCard>

              <SectionCard
                icon={<View><Text style={{ fontSize: 15 }}>💊</Text></View>}
                title="Current Medications"
                subtitle="Include dosage if relevant"
                accent={T.blue}
              >
                <Field
                  label="Medications"
                  value={medications}
                  onChangeText={setMedications}
                  placeholder="e.g. Salbutamol inhaler 100mcg…"
                  multiline
                />
              </SectionCard>

              <SectionCard
                icon={<View><Text style={{ fontSize: 15 }}>👨‍⚕️</Text></View>}
                title="Family Doctor"
                accent={T.ok}
              >
                <Row>
                  <View style={{ flex: 1 }}>
                    <Field label="Doctor's Name" value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Full Name" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Phone" value={doctorPhone} onChangeText={setDoctorPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
                  </View>
                </Row>
              </SectionCard>

              <SectionCard
                icon={<View><Text style={{ fontSize: 15 }}>📋</Text></View>}
                title="Responder Notes"
                subtitle="Special instructions shown on card scan"
              >
                <Field
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Carries inhaler. Do NOT give aspirin. Needs EpiPen."
                  multiline
                />
              </SectionCard>
            </View>
          )}

          {/* ════ STEP 2 — CONTACTS ════ */}
          {step === 2 && (
            <View style={s.stepContent}>
              {/* Call order info */}
              <View style={s.callInfoBox}>
                <Text style={s.callInfoTitle}>How emergency calls work</Text>
                <View style={s.callInfoList}>
                  {[
                    { color: PRIORITY_COLORS[0], text: "Contact #1 is called immediately on card scan" },
                    { color: PRIORITY_COLORS[1], text: "Contact #2 called if #1 doesn't answer" },
                    { color: PRIORITY_COLORS[2], text: "#3 and beyond serve as backups" },
                  ].map((item, i) => (
                    <View key={i} style={s.callInfoRow}>
                      <View style={[s.callInfoDot, { backgroundColor: item.color }]} />
                      <Text style={s.callInfoText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Contact list */}
              {sortedContacts.length === 0 ? (
                <View style={s.emptyContacts}>
                  <View style={s.emptyIcon}>
                    <Text style={{ fontSize: 28 }}>📵</Text>
                  </View>
                  <Text style={s.emptyTitle}>No contacts added</Text>
                  <Text style={s.emptySub}>
                    Add at least one contact — they'll be called the moment the card is scanned in an emergency.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {sortedContacts.map((c, i) => (
                    <ContactCard
                      key={c.id}
                      contact={c}
                      index={i}
                      onEdit={(contact) => { setEditContact(contact); setModalVisible(true); }}
                      onDelete={handleDeleteContact}
                    />
                  ))}
                </View>
              )}

              {/* Add contact */}
              {contacts.length < 5 && (
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => { setEditContact(null); setModalVisible(true); }}
                  activeOpacity={0.75}
                >
                  <View style={s.addBtnIcon}>
                    <Ic.Plus c="#fff" s={18} />
                  </View>
                  <View>
                    <Text style={s.addBtnLabel}>Add Emergency Contact</Text>
                    <Text style={s.addBtnSub}>{contacts.length}/5 contacts</Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={s.stepNote}>
                <Ic.Lightning c={T.ok} s={12} />
                <Text style={[s.stepNoteText, { color: T.ok }]}>
                  Contact changes apply instantly to the card.
                </Text>
              </View>
            </View>
          )}

          {/* ════ STEP 3 — REVIEW ════ */}
          {step === 3 && (
            <View style={s.stepContent}>
              {/* Summary header */}
              <View style={s.reviewHeader}>
                <View style={s.reviewAvatar}>
                  <Text style={s.reviewAvatarText}>
                    {firstName ? firstName[0].toUpperCase() : "?"}
                  </Text>
                </View>
                <View>
                  <Text style={s.reviewName}>
                    {firstName || lastName
                      ? `${firstName} ${lastName}`.trim()
                      : "Student Profile"}
                  </Text>
                  <Text style={s.reviewClass}>
                    {cls && section ? `Class ${cls}-${section}` : cls ? `Class ${cls}` : "Class not set"}
                  </Text>
                </View>
                <View style={[s.reviewStatus, completed.length >= 3 && s.reviewStatusReady]}>
                  <View style={[s.reviewStatusDot, completed.length >= 3 && s.reviewStatusDotReady]} />
                  <Text style={[s.reviewStatusText, completed.length >= 3 && s.reviewStatusTextReady]}>
                    {completed.length >= 3 ? "Ready" : "Draft"}
                  </Text>
                </View>
              </View>

              {/* Student details */}
              <SectionCard
                icon={<Ic.User c={T.red} s={16} />}
                title="Student Details"
                accent={T.red}
              >
                <ReviewRow label="First Name" value={firstName} empty={!firstName} />
                <ReviewRow label="Last Name" value={lastName} empty={!lastName} />
                <ReviewRow label="Class" value={cls} empty={!cls} />
                <ReviewRow label="Section" value={section} empty={!section} />
              </SectionCard>

              {/* Medical */}
              <SectionCard
                icon={<Ic.Heart c={T.red} s={16} />}
                title="Medical Information"
                accent={T.red}
              >
                <ReviewRow label="Blood Group" value={bloodGroup} empty={!bloodGroup} />
                <ReviewRow label="Allergies" value={allergies} empty={!allergies} />
                <ReviewRow label="Conditions" value={conditions} empty={!conditions} />
                <ReviewRow label="Medications" value={medications} empty={!medications} />
                <ReviewRow label="Doctor" value={doctorName} empty={!doctorName} />
                <ReviewRow label="Doctor Phone" value={doctorPhone} empty={!doctorPhone} />
              </SectionCard>

              {/* Contacts */}
              <SectionCard
                icon={<Ic.Phone c={T.blue} s={16} />}
                title={`Emergency Contacts (${contacts.length})`}
                accent={T.blue}
              >
                {contacts.length === 0 ? (
                  <Text style={s.reviewNoContacts}>No contacts added — they won't be called on scan</Text>
                ) : (
                  sortedContacts.map((c) => (
                    <ReviewRow
                      key={c.id}
                      label={`#${c.priority} ${c.relationship || "Contact"}`}
                      value={`${c.name} · ${c.phone}`}
                    />
                  ))
                )}
              </SectionCard>

              {/* Activate / Save note */}
              <View style={[s.stepNote, { backgroundColor: T.okBg, borderColor: T.okBd, flexDirection: "row", gap: 8 }]}>
                <Ic.Shield c={T.ok} s={14} />
                <Text style={[s.stepNoteText, { color: T.ok, flex: 1 }]}>
                  {isNewUser
                    ? "Tapping 'Activate Card' will submit all data in a single secure transaction and make your card live."
                    : "All three sections will be saved in one API call. No partial saves."}
                </Text>
              </View>
            </View>
          )}

        </Animated.View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── NAV FOOTER */}
      <NavFooter
        step={step}
        onBack={goBack}
        onNext={goNext}
        nextLabel={nextLabel}
        saving={saving}
        canProceed={canProceed}
      />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: T.bd,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: T.tx,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    color: T.tx3,
    marginTop: 2,
  },
  onboardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.okBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.okBd,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  onboardDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.ok },
  onboardText: { fontSize: 11, fontWeight: "700", color: T.ok },

  // Onboarding banner
  onboardBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: T.okBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.okBd,
    padding: 14,
  },
  onboardBannerText: {
    fontSize: 13,
    color: T.ok,
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },

  // Scroll
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 18, gap: 14 },
  stepContent: { gap: 14 },

  // Step note
  stepNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.s2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.bd,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stepNoteText: { fontSize: 11.5, color: T.tx3 },

  // Call info
  callInfoBox: {
    backgroundColor: T.s2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.bd,
    padding: 16,
    gap: 12,
  },
  callInfoTitle: { fontSize: 13, fontWeight: "700", color: T.tx },
  callInfoList: { gap: 8 },
  callInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  callInfoDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  callInfoText: { fontSize: 12.5, color: T.tx2, flex: 1 },

  // Empty contacts
  emptyContacts: {
    backgroundColor: T.s2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.bd,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: { marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: T.tx },
  emptySub: { fontSize: 12.5, color: T.tx3, textAlign: "center", lineHeight: 18 },

  // Add contact button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: T.redBd,
    backgroundColor: T.redBg,
  },
  addBtnIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: T.red, alignItems: "center", justifyContent: "center" },
  addBtnLabel: { fontSize: 14, fontWeight: "700", color: T.red },
  addBtnSub: { fontSize: 11.5, color: T.tx3, marginTop: 2 },

  // Review
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: T.s2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.bd,
    padding: 16,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.redBg,
    borderWidth: 1.5,
    borderColor: T.redBd,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reviewAvatarText: { fontSize: 20, fontWeight: "900", color: T.red },
  reviewName: { fontSize: 16, fontWeight: "800", color: T.tx, letterSpacing: -0.2 },
  reviewClass: { fontSize: 12, color: T.tx3, marginTop: 2 },
  reviewStatus: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.s3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: T.bd,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewStatusReady: { backgroundColor: T.okBg, borderColor: T.okBd },
  reviewStatusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.tx3 },
  reviewStatusDotReady: { backgroundColor: T.ok },
  reviewStatusText: { fontSize: 11, fontWeight: "700", color: T.tx3 },
  reviewStatusTextReady: { color: T.ok },
  reviewNoContacts: { fontSize: 13, color: T.tx3, fontStyle: "italic" },
});