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

const SCANS = [
  {
    id: "1",
    location: "City Hospital",
    date: "Feb 24, 2026",
    time: "10:32 AM",
  },
  {
    id: "2",
    location: "Metro Station Gate 3",
    date: "Feb 22, 2026",
    time: "05:14 PM",
  },
  {
    id: "3",
    location: "College Campus Entry",
    date: "Feb 20, 2026",
    time: "09:05 AM",
  },
];

function ScanCard({ item, index }) {
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
      <View style={styles.card}>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={styles.meta}>
          {item.date} • {item.time}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ScanHistory() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.dark.background}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Scan History</Text>
      </View>

      <FlatList
        data={SCANS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ScanCard item={item} index={index} />
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

  title: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#161921",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2A2F42",
  },

  location: {
    color: Colors.dark.text,
    fontWeight: "700",
    fontSize: 15,
  },

  meta: {
    color: "#8A93A6",
    marginTop: 6,
    fontSize: 12,
  },
});