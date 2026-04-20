/**
 * src/components/settings/LanguageModal.jsx
 *
 * Bottom-sheet language picker.
 * Calls changeLanguage() from i18n so the whole app re-renders in the new locale.
 */

import { changeLanguage } from "@/i18n";
import { useThemeContext } from "@/providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Polyline } from "react-native-svg";
import { useState } from "react";

// ─── Supported languages ──────────────────────────────────────────────────────
// Must match the resources registered in src/i18n/index.js
const LANGUAGES = [
    { code: "en", native: "English",    label: "English",   region: "Global" },
    { code: "hi", native: "हिन्दी",     label: "Hindi",     region: "India" },
    { code: "bn", native: "বাংলা",      label: "Bengali",   region: "India / Bangladesh" },
    { code: "te", native: "తెలుగు",     label: "Telugu",    region: "India" },
    { code: "mr", native: "मराठी",      label: "Marathi",   region: "India" },
    { code: "ta", native: "தமிழ்",      label: "Tamil",     region: "India / Sri Lanka" },
    { code: "gu", native: "ગુજરાતી",   label: "Gujarati",  region: "India" },
    { code: "kn", native: "ಕನ್ನಡ",     label: "Kannada",   region: "India" },
    { code: "ml", native: "മലയാളം",    label: "Malayalam", region: "India" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const CheckIcon = ({ color, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CloseIcon = ({ color, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2"
            strokeLinecap="round" />
    </Svg>
);

// ─── Language row ─────────────────────────────────────────────────────────────
function LangRow({ item, isSelected, onSelect, C }) {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSelect(item.code)}
            style={[
                lr.row,
                { borderBottomColor: C.bd },
                isSelected && { backgroundColor: C.blueBg },
            ]}
        >
            {/* Native script in a pill */}
            <View style={[lr.pill, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
                <Text style={[lr.native, { color: C.tx }]}>{item.native}</Text>
            </View>

            {/* Label + region */}
            <View style={lr.body}>
                <Text style={[lr.label, { color: C.tx }, isSelected && { color: C.blue }]}>
                    {item.label}
                </Text>
                <Text style={[lr.region, { color: C.tx3 }]}>{item.region}</Text>
            </View>

            {/* Check */}
            {isSelected && (
                <View style={[lr.check, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                    <CheckIcon color={C.blue} size={13} />
                </View>
            )}
        </TouchableOpacity>
    );
}

const lr = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    pill: {
        minWidth: 72,
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    native: { fontSize: 14, fontWeight: "700" },
    body: { flex: 1, gap: 2 },
    label: { fontSize: 14, fontWeight: "600" },
    region: { fontSize: 11.5 },
    check: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function LanguageModal({ visible, onClose }) {
    const { i18n } = useTranslation();
    const { colors: C } = useThemeContext() ?? {};
    const insets = useSafeAreaInsets();
    const [changing, setChanging] = useState(false);

    const currentCode = i18n.language;

    const handleSelect = async (code) => {
        if (code === currentCode) { onClose(); return; }
        setChanging(true);
        try {
            await changeLanguage(code);  // ← persists + updates i18n
        } finally {
            setChanging(false);
            onClose();
        }
    };

    if (!C) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Scrim */}
            <Pressable style={[m.scrim, { backgroundColor: "rgba(0,0,0,0.55)" }]} onPress={onClose} />

            {/* Sheet */}
            <View style={[m.sheet, { backgroundColor: C.s2, paddingBottom: insets.bottom + 12 }]}>
                {/* Handle */}
                <View style={[m.handle, { backgroundColor: C.s5 }]} />

                {/* Header */}
                <View style={[m.header, { borderBottomColor: C.bd }]}>
                    <View>
                        <Text style={[m.title, { color: C.tx }]}>Language</Text>
                        <Text style={[m.sub, { color: C.tx3 }]}>भाषा · ভাষা · ভাষা</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[m.closeBtn, { backgroundColor: C.s4, borderColor: C.bd2 }]}
                    >
                        <CloseIcon color={C.tx3} size={16} />
                    </TouchableOpacity>
                </View>

                {/* List */}
                {changing ? (
                    <View style={m.loadingWrap}>
                        <ActivityIndicator color={C.blue} />
                        <Text style={[m.loadingText, { color: C.tx3 }]}>Applying language…</Text>
                    </View>
                ) : (
                    <FlatList
                        data={LANGUAGES}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => (
                            <LangRow
                                item={item}
                                isSelected={item.code === currentCode}
                                onSelect={handleSelect}
                                C={C}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        style={{ maxHeight: 420 }}
                    />
                )}
            </View>
        </Modal>
    );
}

const m = StyleSheet.create({
    scrim: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        overflow: "hidden",
    },
    handle: {
        alignSelf: "center",
        width: 36,
        height: 4,
        borderRadius: 2,
        marginTop: 10,
        marginBottom: 4,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    title: { fontSize: 17, fontWeight: "800" },
    sub: { fontSize: 11.5, marginTop: 2 },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingWrap: {
        paddingVertical: 48,
        alignItems: "center",
        gap: 12,
    },
    loadingText: { fontSize: 13 },
});
