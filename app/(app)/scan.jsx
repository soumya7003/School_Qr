/**
 * Scan Screen — Camera QR scanner.
 * Uses expo-camera for the viewfinder.
 * Install: expo install expo-camera
 */

import { colors, radius, spacing, typography } from '@/src/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

// ── Corner frame SVG ──────────────────────────────────────────────────────────
function ScanFrame() {
    const size = 240;
    const corner = 28;
    const stroke = 3;
    const c = colors.primary;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Top-left */}
            <G stroke={c} strokeWidth={stroke} strokeLinecap="round" fill="none">
                <Path d={`M ${corner} 0 L 0 0 L 0 ${corner}`} />
                {/* Top-right */}
                <Path d={`M ${size - corner} 0 L ${size} 0 L ${size} ${corner}`} />
                {/* Bottom-left */}
                <Path d={`M 0 ${size - corner} L 0 ${size} L ${corner} ${size}`} />
                {/* Bottom-right */}
                <Path d={`M ${size - corner} ${size} L ${size} ${size} L ${size} ${size - corner}`} />
            </G>
        </Svg>
    );
}

const XIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12"
            stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

const TorchIcon = ({ on }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M8 2v6l-2 4h12l-2-4V2H8zM8 22V18M12 22v-4M16 22v-4M6 12h12"
            stroke={on ? colors.warning : colors.white}
            strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [torch, setTorch] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [lastScan, setLastScan] = useState(null);

    const handleBarCodeScanned = ({ data }) => {
        if (scanned) return;
        setScanned(true);
        setLastScan(data);
    };

    const handleReset = () => {
        setScanned(false);
        setLastScan(null);
    };

    // ── No permission ─────────────────────────────────────────────────────────
    if (!permission) {
        return (
            <View style={styles.centred}>
                <Text style={styles.msgText}>Checking camera permission…</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centred}>
                <Text style={styles.msgTitle}>Camera Access Needed</Text>
                <Text style={styles.msgText}>
                    Allow camera access to scan student QR cards.
                </Text>
                <TouchableOpacity style={styles.allowBtn} onPress={requestPermission}>
                    <Text style={styles.allowBtnText}>Allow Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Scan result ───────────────────────────────────────────────────────────
    if (scanned && lastScan) {
        return (
            <Animated.View entering={FadeIn} style={[styles.centred, { backgroundColor: colors.screenBg }]}>
                <View style={styles.resultCard}>
                    <View style={styles.resultIconWrap}>
                        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                            <Path d="M20 6L9 17l-5-5"
                                stroke={colors.success} strokeWidth={2.5}
                                strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </View>
                    <Text style={styles.resultTitle}>Scan Successful</Text>
                    <Text style={styles.resultData}>{lastScan}</Text>
                    <TouchableOpacity style={styles.scanAgainBtn} onPress={handleReset}>
                        <Text style={styles.scanAgainText}>Scan Another →</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    // ── Camera viewfinder ─────────────────────────────────────────────────────
    return (
        <View style={styles.camera}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
            />

            {/* Dim overlay with hole */}
            <View style={styles.overlay}>
                {/* Top dim */}
                <View style={[styles.dimBlock, { flex: 1 }]} />

                {/* Middle row */}
                <View style={styles.middleRow}>
                    <View style={[styles.dimBlock, { flex: 1 }]} />
                    {/* Transparent cutout with frame */}
                    <View style={styles.scanWindow}>
                        <ScanFrame />
                    </View>
                    <View style={[styles.dimBlock, { flex: 1 }]} />
                </View>

                {/* Bottom dim + UI */}
                <View style={[styles.dimBlock, styles.bottomBlock]}>
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.bottomUi}>
                        <Text style={styles.scanHint}>Align the QR code inside the frame</Text>
                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={styles.controlBtn}
                                onPress={() => setTorch((t) => !t)}
                                activeOpacity={0.8}
                            >
                                <TorchIcon on={torch} />
                                <Text style={styles.controlLabel}>Torch</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}

const SCAN_SIZE = 240;

const styles = StyleSheet.create({
    camera: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
    },
    dimBlock: {
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    middleRow: {
        flexDirection: 'row',
        height: SCAN_SIZE,
    },
    scanWindow: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomBlock: {
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: spacing[8],
    },
    bottomUi: {
        alignItems: 'center',
        gap: spacing[6],
    },
    scanHint: {
        ...typography.bodyMd,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        gap: spacing[8],
    },
    controlBtn: {
        alignItems: 'center',
        gap: spacing[1.5],
    },
    controlLabel: {
        ...typography.labelXs,
        color: 'rgba(255,255,255,0.6)',
    },

    // ── Permission / result ───────────────────────
    centred: {
        flex: 1,
        backgroundColor: colors.screenBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[8],
        gap: spacing[4],
    },
    msgTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    msgText: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    allowBtn: {
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        marginTop: spacing[2],
    },
    allowBtnText: {
        ...typography.btnMd,
        color: colors.white,
    },

    // ── Result card ───────────────────────────────
    resultCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[8],
        alignItems: 'center',
        gap: spacing[3],
        width: '100%',
    },
    resultIconWrap: {
        width: 72,
        height: 72,
        backgroundColor: colors.successBg,
        borderRadius: radius['5xl'],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    resultTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    resultData: {
        ...typography.mono,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    scanAgainBtn: {
        marginTop: spacing[2],
        backgroundColor: colors.primary,
        borderRadius: radius.btn,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
    },
    scanAgainText: {
        ...typography.btnMd,
        color: colors.white,
    },
});