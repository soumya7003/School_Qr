import { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

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
    description: "A new guardian number has been linked.",
    date: "Feb 20, 2026",
    type: "alert",
  },
];

const TYPE_CONFIG = {
  success: { color: "#34D399" },
  alert: { color: "#F87171" },
};

function UpdateCard({ item, index }) {
  const config = TYPE_CONFIG[item.type];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={[styles.card, { borderLeftColor: config.color }]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </Animated.View>
  );
}

export default function UpdatesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update History</Text>
      </View>

      <FlatList
        data={UPDATES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <UpdateCard item={item} index={index} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 20,
  },

  header: {
    marginVertical: 20,
  },

  back: {
    color: Colors.dark.tint,
    fontWeight: "600",
    marginBottom: 10,
  },

  headerTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#161921",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
  },

  title: {
    color: Colors.dark.text,
    fontWeight: "700",
  },

  desc: {
    color: "#8A93A6",
    marginTop: 4,
  },

  date: {
    color: "#6B7280",
    marginTop: 6,
    fontSize: 12,
  },
});