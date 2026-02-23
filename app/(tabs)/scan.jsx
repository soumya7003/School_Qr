import { Colors } from "@/constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Scan() {
    const [permission, requestPermission] = useCameraPermissions();
    const scanLine = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLine, {
                    toValue: 1,
                    duration: 1800,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLine, {
                    toValue: 0,
                    duration: 1800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    if (!permission?.granted) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.permissionText}>Camera access required</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const translateY = scanLine.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220],
    });

    return (
        <SafeAreaView style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Scan QR</Text>
                <Text style={styles.subtitle}>
                    Align the QR code within the frame
                </Text>
            </View>

            {/* Scanner Area */}
            <View style={styles.scannerWrapper}>
                <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />

                {/* Overlay Frame */}
                <View style={styles.overlay}>
                    <View style={styles.frame} />

                    <Animated.View
                        style={[
                            styles.scanLine,
                            { transform: [{ translateY }] },
                        ]}
                    />
                </View>
            </View>

            {/* Manual entry */}
            <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => router.push("/profile")}
            >
                <Text style={styles.manualText}>Enter details manually</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingHorizontal: 20,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.dark.background,
    },

    permissionText: {
        color: Colors.dark.text,
        marginBottom: 12,
    },

    header: {
        marginTop: 10,
        marginBottom: 20,
    },

    title: {
        fontSize: 26,
        fontWeight: "700",
        color: Colors.dark.text,
    },

    subtitle: {
        fontSize: 14,
        color: "#8A93A6",
        marginTop: 4,
    },

    scannerWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    camera: {
        width: 280,
        height: 280,
        borderRadius: 24,
        overflow: "hidden",
    },

    overlay: {
        position: "absolute",
        width: 280,
        height: 280,
        justifyContent: "center",
        alignItems: "center",
    },

    frame: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: Colors.dark.tint,
    },

    scanLine: {
        position: "absolute",
        width: 220,
        height: 2,
        backgroundColor: Colors.dark.tint,
        opacity: 0.9,
    },

    manualBtn: {
        marginBottom: 30,
        backgroundColor: Colors.dark.text,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
    },

    manualText: {
        color: "#000",
        fontWeight: "600",
        fontSize: 15,
    },

    button: {
        backgroundColor: Colors.dark.tint,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "600",
    },
});