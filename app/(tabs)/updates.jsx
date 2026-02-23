import { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

const THEME = {
  colors: {
    bg: Colors.dark.background,
    card: Colors.dark.background,
    light: Colors.dark.text,
    muted: "#6B7280",
    accent: Colors.dark.tint,
    accentGlow: "rgba(91,127,255,0.18)",
    mint: "#34D399",
    mintSoft: "rgba(52,211,153,0.12)",
    danger: "#F87171",
    dangerSoft: "rgba(248,113,113,0.12)",
    warning: "#FBBF24",
    warningSoft: "rgba(251,191,36,0.12)",
  },
};

const TYPE_CONFIG = {
  info: {
    color: THEME.colors.accent,
    bg: THEME.colors.accentGlow,
    icon: "ℹ",
    label: "INFO",
  },
  success: {
    color: THEME.colors.mint,
    bg: THEME.colors.mintSoft,
    icon: "✓",
    label: "SUCCESS",
  },
  alert: {
    color: THEME.colors.danger,
    bg: THEME.colors.dangerSoft,
    icon: "!",
    label: "ALERT",
  },
  warning: {
    color: THEME.colors.warning,
    bg: THEME.colors.warningSoft,
    icon: "⚠",
    label: "WARNING",
  },
};

const UPDATES = [
  {
    id: "1",
    title: "Profile Updated",
    description: "Your personal details were successfully saved.",
    date: "Feb 23, 2026",
    type: "success",
  },
  {
    id: "2",
    title: "Emergency Contact Changed",
    description: "A new guardian number has been linked to your profile.",
    date: "Feb 20, 2026",
    type: "alert",
  },
];

function UpdateCard({ item, index }) {
  const config = TYPE_CONFIG[item.type];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay: index * 90, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay: index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={styles.card}>
        <View style={[styles.cardBar, { backgroundColor: config.color }]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

export default function Updates() {
  const { width } = useWindowDimensions();
  const scale = (size) => (width / 375) * size;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bg} />
      <FlatList
        data={UPDATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <UpdateCard item={item} index={index} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.bg },
  card: { flexDirection: "row", backgroundColor: THEME.colors.card, margin: 10, borderRadius: 10 },
  cardBar: { width: 4 },
  cardContent: { padding: 12 },
  cardTitle: { color: THEME.colors.light, fontWeight: "700" },
  cardDesc: { color: THEME.colors.muted },
});