/**
 * app/(app)/change-phone.jsx
 * All colors from useTheme().colors
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const ArrowLeft = ({ c }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 19l-7-7 7-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Step bar ──────────────────────────────────────────────────────────────────
function StepBar({ step, C }) {
    return (
        <View style={[sb.wrap, { backgroundColor: C.s2, borderBottomColor: C.bd }]}>
            {[1, 2].map((n) => (
                <View key={n} style={sb.item}>
                    <View style={[sb.dot, { borderColor: C.bd2, backgroundColor: C.s3 }, step === n && { borderColor: C.primary, backgroundColor: C.primaryBg }, step > n && { borderColor: C.okBd, backgroundColor: C.okBg }]}>
                        {step > n
                            ? <Svg width={10} height={10} viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke={C.ok} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
                            : <Text style={[sb.dotText, { color: step === n ? C.primary : C.tx3 }]}>{n}</Text>}
                    </View>
                    <Text style={[sb.label, { color: step === n ? C.tx : C.tx3 }]}>
                        {n === 1 ? 'New Number' : 'Verify OTP'}
                    </Text>
                </View>
            ))}
            <View style={[sb.line, { backgroundColor: C.bd2 }, step > 1 && { backgroundColor: C.ok }]} />
        </View>
    );
}
const sb = StyleSheet.create({
    wrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 48, paddingVertical: 20, borderBottomWidth: 1, position: 'relative' },
    line: { position: 'absolute', top: 33, left: '30%', right: '30%', height: 1 },
    item: { alignItems: 'center', gap: 6, zIndex: 1 },
    dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    dotText: { fontSize: 11, fontWeight: '800' },
    label: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3 },
});

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoFocus, editable = true, C }) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={fi.wrap}>
            <Text style={[fi.label, { color: C.tx3 }]}>{label}</Text>
            <View style={[fi.box, { backgroundColor: C.s3, borderColor: focused ? C.primary : C.bd2 }, !editable && { opacity: 0.5 }]}>
                <TextInput
                    style={[fi.input, { color: C.tx }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={C.tx3}
                    keyboardType={keyboardType ?? 'default'}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    selectionColor={C.primary}
                />
            </View>
        </View>
    );
}
const fi = StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    box: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
    input: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
});

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading, disabled, C }) {
    return (
        <TouchableOpacity
            style={[pb.wrap, { backgroundColor: C.primary }, (disabled || loading) && pb.wrapDisabled]}
            onPress={onPress}
            activeOpacity={0.75}
            disabled={disabled || loading}
        >
            {loading
                ? <ActivityIndicator size="small" color={C.white} />
                : <Text style={[pb.label, { color: C.white }]}>{label}</Text>}
        </TouchableOpacity>
    );
}
const pb = StyleSheet.create({
    wrap: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
    wrapDisabled: { opacity: 0.45 },
    label: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
});

// ── OTP input ─────────────────────────────────────────────────────────────────
const OTP_LEN = 6;

function OtpInput({ value, onChange, C }) {
    const refs = useRef([]);
    const handleKey = (index, key) => {
        if (key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus();
    };
    const handleChange = (index, char) => {
        const digit = char.replace(/[^0-9]/g, '').slice(-1);
        const arr = value.split('');
        arr[index] = digit;
        const next = arr.join('').padEnd(OTP_LEN, ' ').slice(0, OTP_LEN);
        onChange(next.trimEnd());
        if (digit && index < OTP_LEN - 1) refs.current[index + 1]?.focus();
    };
    return (
        <View style={ot.row}>
            {Array.from({ length: OTP_LEN }).map((_, i) => (
                <TextInput
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    style={[ot.box, { borderColor: C.bd2, backgroundColor: C.s3, color: C.tx }, value[i] && value[i].trim() && { borderColor: C.primary, backgroundColor: C.primaryBg }]}
                    value={value[i] ?? ''}
                    onChangeText={(char) => handleChange(i, char)}
                    onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={i === 0}
                    selectionColor={C.primary}
                    textAlign="center"
                />
            ))}
        </View>
    );
}
const ot = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    box: { width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, fontSize: 22, fontWeight: '800' },
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChangePhoneScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();
    const { parentUser } = useAuthStore();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResend] = useState(0);

    const maskedOld = parentUser?.phone
        ? parentUser.phone.slice(0, -4).replace(/\d/g, '•') + parentUser.phone.slice(-4)
        : '••••••••••';

    const isPhoneValid = phone.replace(/\D/g, '').length >= 10;
    const isOtpComplete = otpValue.replace(/\s/g, '').length === OTP_LEN;

    const startCooldown = (secs = 30) => {
        setResend(secs);
        const iv = setInterval(() => setResend((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
    };

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 1000));
            setStep(2);
            startCooldown(30);
        } catch { Alert.alert('Error', 'Could not send OTP. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 1000));
            Alert.alert('Phone Updated', 'Your phone number has been changed successfully.', [{ text: 'Done', onPress: () => router.back() }]);
        } catch { Alert.alert('Invalid OTP', 'The code you entered is incorrect.'); }
        finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try { await new Promise((r) => setTimeout(r, 800)); startCooldown(30); setOtpValue(''); }
        catch { Alert.alert('Error', 'Could not resend OTP.'); }
        finally { setLoading(false); }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* Nav bar */}
                <Animated.View entering={FadeInDown.delay(0).duration(300)} style={[nav.bar, { borderBottomColor: C.bd }]}>
                    <TouchableOpacity style={[nav.back, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
                        <ArrowLeft c={C.tx} />
                    </TouchableOpacity>
                    <Text style={[nav.title, { color: C.tx }]}>Change Phone Number</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {/* Step bar */}
                <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                    <StepBar step={step} C={C} />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(120).duration(350)} style={cp.content}>
                    {step === 1 ? (
                        <View style={cp.form}>
                            <View style={cp.headBlock}>
                                <View style={[cp.iconCircle, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                                    <Text style={{ fontSize: 22 }}>📱</Text>
                                </View>
                                <Text style={[cp.formTitle, { color: C.tx }]}>Enter New Number</Text>
                                <Text style={[cp.formSub, { color: C.tx3 }]}>
                                    Currently using{' '}
                                    <Text style={{ color: C.tx2, fontWeight: '700' }}>{maskedOld}</Text>
                                </Text>
                            </View>
                            <Field label="New Phone Number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" maxLength={15} autoFocus C={C} />
                            <View style={[cp.infoNote, { backgroundColor: C.s3, borderColor: C.bd }]}>
                                <Text style={{ fontSize: 14 }}>🛡️</Text>
                                <Text style={[cp.infoText, { color: C.tx2 }]}>A one-time password will be sent to verify your new number before the change takes effect.</Text>
                            </View>
                            <PrimaryBtn label="Send OTP" onPress={handleSendOtp} loading={loading} disabled={!isPhoneValid} C={C} />
                        </View>
                    ) : (
                        <View style={cp.form}>
                            <View style={cp.headBlock}>
                                <View style={[cp.iconCircle, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                                    <Text style={{ fontSize: 22 }}>🔐</Text>
                                </View>
                                <Text style={[cp.formTitle, { color: C.tx }]}>Enter OTP</Text>
                                <Text style={[cp.formSub, { color: C.tx3 }]}>
                                    Sent to{' '}
                                    <Text style={{ color: C.tx2, fontWeight: '700' }}>{phone}</Text>
                                </Text>
                            </View>
                            <OtpInput value={otpValue} onChange={setOtpValue} C={C} />
                            <View style={cp.resendRow}>
                                <Text style={[cp.resendLabel, { color: C.tx3 }]}>Didn't receive the code?</Text>
                                <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading} activeOpacity={0.7}>
                                    <Text style={[cp.resendBtn, { color: resendCooldown > 0 ? C.tx3 : C.primary }]}>
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <PrimaryBtn label="Verify & Update" onPress={handleVerify} loading={loading} disabled={!isOtpComplete} C={C} />
                            <TouchableOpacity style={cp.backToPhone} onPress={() => { setStep(1); setOtpValue(''); }} activeOpacity={0.7}>
                                <Text style={[cp.backToPhoneText, { color: C.tx3 }]}>← Change phone number</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>

            </KeyboardAvoidingView>
        </Screen>
    );
}

const nav = StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenH, paddingTop: spacing[2], paddingBottom: spacing[2], borderBottomWidth: 1 },
    back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
});
const cp = StyleSheet.create({
    content: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 24 },
    form: { gap: 20 },
    headBlock: { alignItems: 'center', gap: 8, paddingBottom: 8 },
    iconCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    formTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    formSub: { fontSize: 13, textAlign: 'center' },
    infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
    infoText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
    resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    resendLabel: { fontSize: 13 },
    resendBtn: { fontSize: 13, fontWeight: '700' },
    backToPhone: { alignItems: 'center', paddingVertical: 4 },
    backToPhoneText: { fontSize: 13, fontWeight: '500' },
});