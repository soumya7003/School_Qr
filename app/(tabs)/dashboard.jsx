import { Colors } from "@/constants/theme";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [qrActive, setQrActive] = useState(true);

  const USER = {
    name: "Alex Johnson",
    guardian: "Maria Johnson",
    blood: "O+",
    dob: "12 Aug 2003",
    medical: "Asthma, Penicillin allergy",
    photo:
      "https://i.pravatar.cc/300", // replace with real image
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back 👋</Text>
            <Text style={styles.name}>{USER.name}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>

            <TouchableOpacity style={styles.notification}>
              <Text style={{ color: "#fff" }}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <Image source={{ uri: USER.photo }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* QR STATUS */}
        <View style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>QR Status</Text>
            <Text style={styles.cardSubtitle}>
              Enable to allow identity verification
            </Text>
          </View>
          <Switch
            value={qrActive}
            onValueChange={setQrActive}
            trackColor={{ true: Colors.dark.tint }}
          />
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>

          <Info label="Guardian" value={USER.guardian} />
          <Info label="Blood Group" value={USER.blood} />
          <Info label="Date of Birth" value={USER.dob} />
          <Info label="Medical Info" value={USER.medical} />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activity</Text>

          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>Scan History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>Update History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 20,
  },

  /* HEADER */
  header: {
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: {
    color: "#8A93A6",
    fontSize: 13,
  },

  name: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  premiumBadge: {
    backgroundColor: "rgba(91,127,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  premiumText: {
    color: Colors.dark.tint,
    fontSize: 11,
    fontWeight: "700",
  },

  notification: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E2230",
    alignItems: "center",
    justifyContent: "center",
  },

  /* PROFILE */
  profileCard: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
  },

  editBtn: {
    backgroundColor: "#1E2230",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  editText: {
    color: Colors.dark.text,
    fontSize: 12,
  },

  /* CARDS */
  card: {
    backgroundColor: "#161921",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2A2F42",
    marginBottom: 16,
  },

  cardTitle: {
    color: Colors.dark.text,
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 14,
  },

  cardSubtitle: {
    color: "#8A93A6",
    fontSize: 12,
  },

  infoRow: {
    marginTop: 8,
  },

  infoLabel: {
    color: "#8A93A6",
    fontSize: 11,
  },

  infoValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },

  /* ACTIONS */
  actionBtn: {
    backgroundColor: "#1E2230",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    alignItems: "center",
  },

  actionText: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
});