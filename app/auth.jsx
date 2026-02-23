import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Auth() {
    const [qrKey, setQrKey] = useState("");
    const [mobile, setMobile] = useState("");

    const handleGenerateOtp = () => {
        if (!qrKey || !mobile) return;
        router.push("/otp");
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* HERO SECTION */}
                <View style={styles.hero}>
                    <Text style={styles.heading}>Secure Access</Text>
                    <Text style={styles.subheading}>
                        Authenticate using your QR identity and registered mobile number
                    </Text>
                </View>

                {/* CARD CENTER */}
                <View style={styles.centerWrap}>
                    <View style={styles.card}>
                        {/* QR KEY */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>QR Key</Text>
                            <TextInput
                                value={qrKey}
                                onChangeText={setQrKey}
                                placeholder="Enter your secure QR key"
                                placeholderTextColor="#8A93A6"
                                style={styles.input}
                            />
                        </View>

                        {/* MOBILE */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Registered Mobile</Text>
                            <TextInput
                                value={mobile}
                                onChangeText={setMobile}
                                placeholder="Enter mobile number"
                                placeholderTextColor="#8A93A6"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                        </View>

                        {/* CTA */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleGenerateOtp}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.buttonText}>Generate OTP</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TRUST / SECURITY MESSAGE */}
                <View style={styles.trustBox}>
                    <Text style={styles.trustTitle}>Your Safety Matters</Text>
                    <Text style={styles.trustText}>
                        Every day, thousands of identity verifications help prevent misuse
                        and ensure secure access across institutions in India. Your QR-based
                        identity keeps your information protected and instantly verifiable.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 20,
    },

    /* HERO */
    hero: {
        marginTop: 50,
        marginBottom: 20,
    },

    heading: {
        fontSize: 30,
        fontWeight: "700",
        color: Colors.dark.text,
        letterSpacing: 0.3,
    },

    subheading: {
        fontSize: 14,
        color: "#8A93A6",
        marginTop: 6,
        lineHeight: 20,
    },

    /* CENTER WRAP */
    centerWrap: {
        flex: 1,
        justifyContent: "center",
    },

    /* CARD */
    card: {
        backgroundColor: "#161921",
        borderRadius: 22,
        padding: 22,
        borderWidth: 1,
        borderColor: "#2A2F42",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },

    inputGroup: {
        marginBottom: 18,
    },

    label: {
        color: "#9BA1A6",
        fontSize: 12,
        marginBottom: 6,
        fontWeight: "600",
        letterSpacing: 0.4,
    },

    input: {
        backgroundColor: "#0D0F14",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        color: Colors.dark.text,
        borderWidth: 1,
        borderColor: "#2A2F42",
    },

    button: {
        marginTop: 12,
        backgroundColor: Colors.dark.tint,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: "center",
    },

    buttonText: {
        color: "#000",
        fontWeight: "600",
        fontSize: 15,
        letterSpacing: 0.3,
    },

    /* TRUST */
    trustBox: {
        marginBottom: 30,
    },

    trustTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.dark.text,
        marginBottom: 6,
    },

    trustText: {
        fontSize: 12,
        color: "#7A8196",
        lineHeight: 18,
    },
});