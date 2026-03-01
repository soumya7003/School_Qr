import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Colour tokens ───────────────────────────────────────────────
const C = {
  red: "#FF3131",
  redSoft: "rgba(255,49,49,0.10)",
  redBorder: "rgba(255,49,49,0.20)",
  redGlow: "rgba(255,49,49,0.35)",
  bg: "#050810",
  s1: "#0C1120",
  s2: "#111827",
  border: "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.12)",
  t1: "#EEF2FF",
  t2: "#8892B0",
  t3: "#3D4A6B",
  green: "#00DC6E",
  amber: "#FFA827",
  blue: "#4D8EFF",
  blueLight: "#7AAFFF",
};

// ─── Fade-up animated wrapper ─────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  mounted,
}: {
  children: React.ReactNode;
  delay?: number;
  mounted: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (mounted) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 550,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mounted]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Spinning ring ────────────────────────────────────────────────
function SpinningRing() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[styles.ringCanvas, { transform: [{ rotate }] }]}
    />
  );
}

// ─── Pulse dot ────────────────────────────────────────────────────
function PulseDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.5, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.pulseDot, { opacity: anim }]} />
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function Home() {
  const [active, setActive] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const knobAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    Animated.timing(knobAnim, {
      toValue: active ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: false,
    }).start();
  }, [active]);

  const knobLeft = knobAnim.interpolate({ inputRange: [0, 1], outputRange: [3, 25] });

  const handleMoveUpdatePage = () => router.push("/updates");

  const emergencyInfo = [
    { label: "Allergies", value: "Peanuts", red: false },
    { label: "Conditions", value: "Mild Asthma", red: false },
    { label: "Doctor", value: "Dr. Mehta", red: false },
    { label: "Doctor Phone", value: "+91 9876...", red: true },
  ];

  const contacts = [
    { initials: "P", name: "Priya Sharma", rel: "Mother", primary: true, colorStyle: "red" },
    { initials: "R", name: "Rajesh Sharma", rel: "Father", primary: false, colorStyle: "blue" },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PROFILE ── */}
        <FadeUp delay={0} mounted={mounted}>
          <View style={styles.profile}>
            {/* Ring + Avatar */}
            <View style={styles.ringWrap}>
              <SpinningRing />
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>A</Text>
                <View style={styles.verified}>
                  {/* checkmark */}
                  <View style={styles.checkmark} />
                </View>
              </View>
            </View>

            <Text style={styles.pname}>Arjun Sharma</Text>

            <View style={styles.chipRow}>
              <View style={[styles.chip, styles.chipBlue]}>
                <Text style={[styles.chipTxt, { color: C.blueLight }]}>🎓 Delhi Public School</Text>
              </View>
              <View style={[styles.chip, styles.chipAmber]}>
                <Text style={[styles.chipTxt, { color: C.amber }]}>Class 6-B</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* ── CARD STATUS ── */}
        <FadeUp delay={80} mounted={mounted}>
          <View style={styles.pad}>
            <View style={styles.card}>
              <View style={styles.csBody}>
                <View>
                  <Text style={styles.eyebrow}>Student Card</Text>
                  <Text style={styles.csNum}>SQ-2024-004891</Text>
                  <View style={styles.statusPill}>
                    <PulseDot />
                    <Text style={styles.statusTxt}>Awaiting Activation</Text>
                  </View>
                </View>

                <View style={styles.toggleSide}>
                  <Text style={styles.eyebrow}>Activate</Text>
                  <Pressable
                    onPress={() => setActive((v) => !v)}
                    style={[styles.tog, { backgroundColor: active ? C.red : "#1C2540" }]}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: active }}
                  >
                    <Animated.View
                      style={[
                        styles.togKnob,
                        {
                          left: knobLeft,
                          shadowColor: active ? C.red : "#000",
                          shadowOpacity: active ? 0.5 : 0.45,
                          shadowRadius: active ? 5 : 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 4,
                        },
                      ]}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* ── EMERGENCY INFO ── */}
        <FadeUp delay={160} mounted={mounted}>
          <View style={styles.pad}>
            <View style={styles.card}>
              {/* Section header */}
              <View style={styles.sh}>
                <Text style={styles.shTitle}>Emergency Info</Text>
                <TouchableOpacity onPress={handleMoveUpdatePage} style={styles.iconBtn}>
                  <Text style={{ color: C.t2, fontSize: 13 }}>✏️</Text>
                </TouchableOpacity>
              </View>

              {/* Blood row */}
              <View style={styles.bloodRow}>
                <View style={styles.bloodIcon}>
                  <Text style={{ fontSize: 18 }}>🩸</Text>
                </View>
                <View>
                  <Text style={styles.bloodEye}>Blood Group</Text>
                  <Text style={styles.bloodVal}>B+</Text>
                </View>
              </View>

              {/* Info grid */}
              <View style={styles.igrid}>
                {emergencyInfo.map(({ label, value, red }, i) => {
                  const isOdd = i % 2 === 0;
                  const isLastRow = i >= emergencyInfo.length - 2;
                  return (
                    <View
                      key={label}
                      style={[
                        styles.gcell,
                        isOdd && styles.gcellBorderRight,
                        !isLastRow && styles.gcellBorderBottom,
                      ]}
                    >
                      <Text style={styles.gcEye}>{label}</Text>
                      <Text style={[styles.gcVal, red && { color: C.red }]}>{value}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </FadeUp>

        {/* ── EMERGENCY CONTACTS ── */}
        <FadeUp delay={240} mounted={mounted}>
          <View style={styles.pad}>
            <View style={styles.card}>
              <View style={styles.sh}>
                <Text style={styles.shTitle}>Emergency Contacts</Text>
                <TouchableOpacity style={styles.iconBtn}>
                  <Text style={{ color: C.t2, fontSize: 16, lineHeight: 16 }}>+</Text>
                </TouchableOpacity>
              </View>

              {contacts.map(({ initials, name, rel, primary, colorStyle }, i) => (
                <View
                  key={name}
                  style={[styles.citem, i < contacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                >
                  <View style={styles.cleft}>
                    <View style={[styles.cavi, colorStyle === "red" ? styles.caviRed : styles.caviBlue]}>
                      <Text style={[styles.caviLetter, { color: colorStyle === "red" ? C.red : C.blueLight }]}>
                        {initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cname}>{name}</Text>
                      <View style={styles.cmeta}>
                        <Text style={styles.crel}>{rel}</Text>
                        {primary && (
                          <View style={styles.primTag}>
                            <Text style={styles.primTxt}>Primary</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Linking.openURL("tel:+919876543210")}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 16 }}>📞</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },

  // Profile
  profile: {
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ringWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ringCanvas: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "transparent",
    borderTopColor: "rgba(255,49,49,0.9)",
    borderRightColor: "rgba(255,49,49,0.3)",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: "#18223A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarLetter: {
    color: C.red,
    fontSize: 36,
    fontWeight: "700",
  },
  verified: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 21,
    height: 21,
    borderRadius: 7,
    backgroundColor: C.green,
    borderWidth: 2.5,
    borderColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.green,
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  checkmark: {
    width: 9,
    height: 9,
    // We use a simple ✓ text instead of SVG
  },
  pname: {
    color: C.t1,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBlue: {
    backgroundColor: "rgba(77,142,255,0.08)",
    borderColor: "rgba(77,142,255,0.22)",
  },
  chipAmber: {
    backgroundColor: "rgba(255,168,39,0.08)",
    borderColor: "rgba(255,168,39,0.22)",
  },
  chipTxt: {
    fontSize: 11.5,
    fontWeight: "500",
    letterSpacing: 0.01,
  },

  // Shared
  pad: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  card: {
    backgroundColor: C.s1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  // Card Status
  csBody: {
    padding: 18,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.t3,
    marginBottom: 5,
  },
  csNum: {
    color: C.t1,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: "rgba(255,168,39,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,168,39,0.22)",
    alignSelf: "flex-start",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.amber,
  },
  statusTxt: {
    fontSize: 11.5,
    fontWeight: "500",
    color: C.amber,
  },
  toggleSide: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  tog: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
  },
  togKnob: {
    position: "absolute",
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },

  // Section header
  sh: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  shTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.t3,
  },
  iconBtn: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: C.s2,
    borderWidth: 1,
    borderColor: C.borderHi,
    alignItems: "center",
    justifyContent: "center",
  },

  // Blood row
  bloodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  bloodIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.redSoft,
    borderWidth: 1,
    borderColor: C.redBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  bloodEye: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.t3,
  },
  bloodVal: {
    fontSize: 24,
    fontWeight: "700",
    color: C.red,
    lineHeight: 28,
  },

  // Info grid
  igrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gcell: {
    width: "50%",
    padding: 13,
    paddingHorizontal: 18,
  },
  gcellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  gcellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  gcEye: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.t3,
    marginBottom: 4,
  },
  gcVal: {
    fontSize: 14,
    fontWeight: "600",
    color: C.t1,
    letterSpacing: -0.1,
  },

  // Contacts
  citem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    paddingHorizontal: 18,
  },
  cleft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  cavi: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  caviRed: {
    backgroundColor: C.redSoft,
    borderColor: C.redBorder,
  },
  caviBlue: {
    backgroundColor: "rgba(77,142,255,0.08)",
    borderColor: "rgba(77,142,255,0.2)",
  },
  caviLetter: {
    fontSize: 17,
    fontWeight: "700",
  },
  cname: {
    fontSize: 14,
    fontWeight: "600",
    color: C.t1,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  cmeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  crel: {
    fontSize: 12,
    color: C.t2,
    fontWeight: "400",
  },
  primTag: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: "rgba(0,220,110,0.09)",
    borderWidth: 1,
    borderColor: "rgba(0,220,110,0.2)",
  },
  primTxt: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: C.green,
  },
  callBtn: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: C.redSoft,
    borderWidth: 1,
    borderColor: C.redBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tab bar
  tabbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(5,8,16,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  titem: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 48,
  },
  titemTxt: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: C.t3,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  tfab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});