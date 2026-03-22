/**
 * Change Phone Number Screen
 * Flow: enter new number → receive OTP → verify → update
 * Design: matches Command Center dark aesthetic (settings / emergency / updates)
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    bg: "#07070A",
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
    ambBg: "rgba(217,119,6,0.08)",
    ambBd: "rgba(217,119,6,0.22)",
    blue: "#3B82F6",
    blueBg: "rgba(59,130,246,0.08)",
    blueBd: "rgba(59,130,246,0.22)",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const ArrowLeft = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 19l-7-7 7-7" stroke={T.tx} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PhoneIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .98h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={T.amb} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ShieldIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L4 6v7c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6L12 2z"
            stroke={T.blue} strokeWidth={1.7} strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4" stroke={T.blue} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }) {
    return (
        <View style={sb.wrap}>
            {[1, 2].map(n => (
                <View key={n} style={sb.item}>
                    <View style={[
                        sb.dot,
                        step === n && sb.dotActive,
                        step > n && sb.dotDone,
                    ]}>
                        {step > n
                            ? <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                                <Path d="M20 6L9 17l-5-5" stroke={T.ok} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                            : <Text style={[sb.dotText, step === n && sb.dotTextActive]}>{n}</Text>
                        }
                    </View>
                    <Text style={[sb.label, step === n && sb.labelActive]}>
                        {n === 1 ? "New Number" : "Verify OTP"}
                    </Text>
                </View>
            ))}
            <View style={[sb.line, step > 1 && sb.lineDone]} />
        </View>
    );
}
const sb = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 48,
        marginVertical: spacing[6],
        position: "relative",
    },
    line: {
        position: "absolute",
        top: 14,
        left: "30%",
        right: "30%",
        height: 1,
        backgroundColor: T.bd2,
    },
    lineDone: { backgroundColor: T.ok },
    item: { alignItems: "center", gap: 6, zIndex: 1 },
    dot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: T.bd2,
        backgroundColor: T.s3,
        alignItems: "center",
        justifyContent: "center",
    },
    dotActive: {
        borderColor: T.blue,
        backgroundColor: T.blueBg,
    },
    dotDone: {
        borderColor: T.okBd,
        backgroundColor: T.okBg,
    },
    dotText: { fontSize: 11, fontWeight: "700", color: T.tx3 },
    dotTextActive: { color: T.blue },
    label: { fontSize: 10.5, fontWeight: "600", color: T.tx3, letterSpacing: 0.3 },
    labelActive: { color: T.tx },
});

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoFocus, editable = true }) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={fi.wrap}>
            <Text style={fi.label}>{label}</Text>
            <View style={[fi.box, focused && fi.boxFocused, !editable && fi.boxDisabled]}>
                <TextInput
                    style={fi.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={T.tx3}
                    keyboardType={keyboardType ?? "default"}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    selectionColor={T.blue}
                />
            </View>
        </View>
    );
}
const fi = StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontSize: 11, fontWeight: "700", color: T.tx3, letterSpacing: 0.8, textTransform: "uppercase" },
    box: {
        backgroundColor: T.s3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.bd2,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    boxFocused: { borderColor: T.blue },
    boxDisabled: { opacity: 0.5 },
    input: { fontSize: 16, fontWeight: "600", color: T.tx, letterSpacing: 0.2 },
});

// ─── Primary button ───────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading, disabled }) {
    return (
        <TouchableOpacity
            style={[btn.wrap, (disabled || loading) && btn.wrapDisabled]}
            onPress={onPress}
            activeOpacity={0.75}
            disabled={disabled || loading}
        >
            {loading
                ? <ActivityIndicator size="small" color={T.tx} />
                : <Text style={btn.label}>{label}</Text>
            }
        </TouchableOpacity>
    );
}
const btn = StyleSheet.create({
    wrap: {
        backgroundColor: T.blue,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    wrapDisabled: { opacity: 0.45 },
    label: { fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },
});

// ─── Info note ────────────────────────────────────────────────────────────────
function InfoNote({ icon, text }) {
    return (
        <View style={inf.wrap}>
            {icon}
            <Text style={inf.text}>{text}</Text>
        </View>
    );
}
const inf = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        backgroundColor: T.s3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.bd,
        padding: 12,
    },
    text: { flex: 1, fontSize: 12.5, color: T.tx2, lineHeight: 18 },
});

// ─── OTP digit boxes ──────────────────────────────────────────────────────────
const OTP_LEN = 6;

function OtpInput({ value, onChange }) {
    const refs = useRef([]);

    const handleKey = (index, key) => {
        if (key === "Backspace" && !value[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handleChange = (index, char) => {
        const digit = char.replace(/[^0-9]/g, "").slice(-1);
        const arr = value.split("");
        arr[index] = digit;
        const next = arr.join("").padEnd(OTP_LEN, " ").slice(0, OTP_LEN);
        onChange(next.trimEnd());
        if (digit && index < OTP_LEN - 1) refs.current[index + 1]?.focus();
    };

    return (
        <View style={otp.row}>
            {Array.from({ length: OTP_LEN }).map((_, i) => (
                <TextInput
                    key={i}
                    ref={el => refs.current[i] = el}
                    style={[otp.box, value[i] && otp.boxFilled]}
                    value={value[i] ?? ""}
                    onChangeText={char => handleChange(i, char)}
                    onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={i === 0}
                    selectionColor={T.blue}
                    textAlign="center"
                />
            ))}
        </View>
    );
}
const otp = StyleSheet.create({
    row: { flexDirection: "row", gap: 10, justifyContent: "center" },
    box: {
        width: 46,
        height: 54,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: T.bd2,
        backgroundColor: T.s3,
        fontSize: 22,
        fontWeight: "800",
        color: T.tx,
    },
    boxFilled: { borderColor: T.blue, backgroundColor: T.blueBg },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ChangePhoneScreen() {
    const router = useRouter();
    const { parentUser } = useAuthStore();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const maskedOld = parentUser?.phone
        ? parentUser.phone.slice(0, -4).replace(/\d/g, "•") + parentUser.phone.slice(-4)
        : "••••••••••";

    const isPhoneValid = phone.replace(/\D/g, "").length >= 10;
    const isOtpComplete = otpValue.replace(/\s/g, "").length === OTP_LEN;

    // Start resend cooldown timer
    const startCooldown = (seconds = 30) => {
        setResendCooldown(seconds);
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            // TODO: call your API — e.g. await authApi.requestPhoneChange(phone)
            await new Promise(r => setTimeout(r, 1000)); // placeholder
            setStep(2);
            startCooldown(30);
        } catch {
            Alert.alert("Error", "Could not send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            // TODO: call your API — e.g. await authApi.verifyPhoneChange(phone, otpValue)
            await new Promise(r => setTimeout(r, 1000)); // placeholder
            Alert.alert(
                "Phone Updated",
                "Your phone number has been changed successfully.",
                [{ text: "Done", onPress: () => router.back() }]
            );
        } catch {
            Alert.alert("Invalid OTP", "The code you entered is incorrect. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            startCooldown(30);
            setOtpValue("");
        } catch {
            Alert.alert("Error", "Could not resend OTP.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen bg={T.bg} edges={["top", "left", "right"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* ── Nav bar ── */}
                <Animated.View entering={FadeInDown.delay(0).duration(300)} style={nav.bar}>
                    <TouchableOpacity style={nav.back} onPress={() => router.back()} activeOpacity={0.7}>
                        <ArrowLeft />
                    </TouchableOpacity>
                    <Text style={nav.title}>Change Phone Number</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {/* ── Step bar ── */}
                <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                    <StepBar step={step} />
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(120).duration(350)}
                    style={styles.content}
                >
                    {step === 1 ? (
                        /* ── Step 1: Enter new number ── */
                        <View style={styles.form}>
                            <View style={styles.headBlock}>
                                <View style={[styles.iconCircle, { backgroundColor: T.ambBg, borderColor: T.ambBd }]}>
                                    <PhoneIcon />
                                </View>
                                <Text style={styles.formTitle}>Enter New Number</Text>
                                <Text style={styles.formSub}>
                                    Currently using{" "}
                                    <Text style={{ color: T.tx2, fontWeight: "700" }}>{maskedOld}</Text>
                                </Text>
                            </View>

                            <Field
                                label="New Phone Number"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+91 98765 43210"
                                keyboardType="phone-pad"
                                maxLength={15}
                                autoFocus
                            />

                            <InfoNote
                                icon={<ShieldIcon />}
                                text="A one-time password will be sent to verify your new number before the change takes effect."
                            />

                            <PrimaryBtn
                                label="Send OTP"
                                onPress={handleSendOtp}
                                loading={loading}
                                disabled={!isPhoneValid}
                            />
                        </View>
                    ) : (
                        /* ── Step 2: Enter OTP ── */
                        <View style={styles.form}>
                            <View style={styles.headBlock}>
                                <View style={[styles.iconCircle, { backgroundColor: T.blueBg, borderColor: T.blueBd }]}>
                                    <ShieldIcon />
                                </View>
                                <Text style={styles.formTitle}>Enter OTP</Text>
                                <Text style={styles.formSub}>
                                    Sent to{" "}
                                    <Text style={{ color: T.tx2, fontWeight: "700" }}>
                                        {phone}
                                    </Text>
                                </Text>
                            </View>

                            <OtpInput value={otpValue} onChange={setOtpValue} />

                            {/* Resend row */}
                            <View style={styles.resendRow}>
                                <Text style={styles.resendLabel}>Didn't receive the code?</Text>
                                <TouchableOpacity
                                    onPress={handleResend}
                                    disabled={resendCooldown > 0 || loading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.resendBtn,
                                        resendCooldown > 0 && styles.resendBtnDisabled,
                                    ]}>
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <PrimaryBtn
                                label="Verify & Update"
                                onPress={handleVerify}
                                loading={loading}
                                disabled={!isOtpComplete}
                            />

                            <TouchableOpacity
                                style={styles.backToPhone}
                                onPress={() => { setStep(1); setOtpValue(""); }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.backToPhoneText}>← Change phone number</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const nav = StyleSheet.create({
    bar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[2],
        paddingBottom: spacing[1],
    },
    back: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: "rgba(240,240,245,0.9)",
        letterSpacing: -0.2,
    },
});

const styles = StyleSheet.create({
    content: {
        flex: 1,
        paddingHorizontal: spacing.screenH,
    },
    form: {
        gap: spacing[5],
    },
    headBlock: {
        alignItems: "center",
        gap: 8,
        paddingBottom: spacing[2],
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "rgba(240,240,245,1)",
        letterSpacing: -0.3,
    },
    formSub: {
        fontSize: 13,
        color: "rgba(240,240,245,0.4)",
        textAlign: "center",
    },
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    resendLabel: {
        fontSize: 13,
        color: "rgba(240,240,245,0.35)",
    },
    resendBtn: {
        fontSize: 13,
        fontWeight: "700",
        color: "#3B82F6",
    },
    resendBtnDisabled: {
        color: "rgba(240,240,245,0.25)",
    },
    backToPhone: {
        alignItems: "center",
        paddingVertical: 4,
    },
    backToPhoneText: {
        fontSize: 13,
        color: "rgba(240,240,245,0.35)",
        fontWeight: "500",
    },
});