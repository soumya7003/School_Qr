/**
 * app/(app)/change-phone.jsx
 * Change Phone Number Screen
 * All colors from useTheme().colors
 * All strings from i18n changePhone namespace
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowLeft = ({ c }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 19l-7-7 7-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CheckIcon = ({ c }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step, C }) {
    const { t } = useTranslation();
    return (
        <View style={[sb.wrap, { backgroundColor: C.s2, borderBottomColor: C.bd }]}>
            <View style={sb.stepsContainer}>
                {[1, 2].map((n) => (
                    <View key={n} style={sb.stepItem}>
                        <View style={[
                            sb.dot,
                            { borderColor: C.bd2, backgroundColor: C.s3 },
                            step === n && { borderColor: C.primary, backgroundColor: C.primaryBg },
                            step > n && { borderColor: C.okBd, backgroundColor: C.okBg },
                        ]}>
                            {step > n ? (
                                <CheckIcon c={C.ok} />
                            ) : (
                                <Text style={[sb.dotText, { color: step === n ? C.primary : C.tx3 }]}>{n}</Text>
                            )}
                        </View>
                        <Text style={[sb.label, { color: step === n ? C.tx : C.tx3 }]}>
                            {n === 1 ? t('changePhone.stepNewNumber') : t('changePhone.stepVerifyOtp')}
                        </Text>
                    </View>
                ))}
            </View>
            <View style={[sb.line, { backgroundColor: C.bd2 }, step > 1 && { backgroundColor: C.ok }]} />
        </View>
    );
}

const sb = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingVertical: 20,
        borderBottomWidth: 1,
        position: 'relative',
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 48,
        zIndex: 1,
    },
    stepItem: { alignItems: 'center', gap: 6 },
    line: {
        position: 'absolute',
        top: 14,
        left: '30%',
        right: '30%',
        height: 2,
        borderRadius: 1,
    },
    dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    dotText: { fontSize: 12, fontWeight: '800' },
    label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },
});

// ── Phone Input Field ─────────────────────────────────────────────────────────
function PhoneInputField({ value, onChange, error, autoFocus, C }) {
    const [focused, setFocused] = useState(false);

    const formatPhone = (text) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');
        // Format as +91 XXXXX XXXXX for display
        if (cleaned.startsWith('91') && cleaned.length > 2) {
            const country = '+' + cleaned.slice(0, 2);
            const first = cleaned.slice(2, 7);
            const second = cleaned.slice(7, 12);
            if (second) return `${country} ${first} ${second}`;
            if (first) return `${country} ${first}`;
            return country;
        }
        if (cleaned.length <= 10) {
            const first = cleaned.slice(0, 5);
            const second = cleaned.slice(5, 10);
            if (second) return `${first} ${second}`;
            return first;
        }
        return text;
    };

    const handleChange = (text) => {
        const raw = text.replace(/\D/g, '');
        onChange(raw);
    };

    return (
        <View style={pi.wrap}>
            <Text style={[pi.label, { color: C.tx3 }]}>New Phone Number</Text>
            <View style={[
                pi.box,
                {
                    backgroundColor: C.s3,
                    borderColor: error ? C.red : (focused ? C.primary : C.bd2),
                }
            ]}>
                <Text style={[pi.prefix, { color: C.tx3 }]}>+91</Text>
                <TextInput
                    style={[pi.input, { color: C.tx }]}
                    value={value}
                    onChangeText={handleChange}
                    placeholder="98765 43210"
                    placeholderTextColor={C.tx3}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    selectionColor={C.primary}
                />
            </View>
            {error && <Text style={[pi.error, { color: C.red }]}>{error}</Text>}
            <Text style={[pi.hint, { color: C.tx3 }]}>Enter your new mobile number</Text>
        </View>
    );
}

const pi = StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    box: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, minHeight: 56 },
    prefix: { fontSize: 16, fontWeight: '600', marginRight: 8 },
    input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 14 },
    error: { fontSize: 12, marginTop: 4 },
    hint: { fontSize: 11, marginTop: 4 },
});

// ── OTP Input ─────────────────────────────────────────────────────────────────
const OTP_LEN = 6;

function OtpInputField({ value, onChange, error, C }) {
    const refs = useRef([]);
    const digits = value.split('').slice(0, OTP_LEN);
    while (digits.length < OTP_LEN) digits.push('');

    const handleChange = (index, text) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        const newValue = newDigits.join('');
        onChange(newValue);

        if (digit && index < OTP_LEN - 1) {
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (index, key) => {
        if (key === 'Backspace' && !digits[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={ot.wrap}>
            <Text style={[ot.label, { color: C.tx3 }]}>Verification Code</Text>
            <View style={ot.row}>
                {digits.map((digit, idx) => (
                    <TextInput
                        key={idx}
                        ref={(el) => { refs.current[idx] = el; }}
                        style={[
                            ot.box,
                            {
                                borderColor: error ? C.red : (digit ? C.primary : C.bd2),
                                backgroundColor: digit ? C.primaryBg : C.s3,
                                color: C.tx,
                            }
                        ]}
                        value={digit}
                        onChangeText={(text) => handleChange(idx, text)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(idx, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        autoFocus={idx === 0}
                        selectionColor={C.primary}
                        textAlign="center"
                    />
                ))}
            </View>
            {error && <Text style={[ot.error, { color: C.red }]}>{error}</Text>}
        </View>
    );
}

const ot = StyleSheet.create({
    wrap: { gap: 12 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    box: { width: 48, height: 56, borderRadius: 14, borderWidth: 1.5, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    error: { fontSize: 12, marginTop: 4, textAlign: 'center' },
});

// ── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress, loading, disabled, C }) {
    return (
        <TouchableOpacity
            style={[
                pb.wrap,
                { backgroundColor: C.primary },
                (disabled || loading) && pb.disabled,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text style={[pb.label, { color: '#fff' }]}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

const pb = StyleSheet.create({
    wrap: { borderRadius: 30, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    disabled: { opacity: 0.5 },
    label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});

// ── Secondary Button ──────────────────────────────────────────────────────────
function SecondaryButton({ label, onPress, disabled, C }) {
    return (
        <TouchableOpacity
            style={[sbBtn.wrap, { borderColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Text style={[sbBtn.label, { color: C.tx3 }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const sbBtn = StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderRadius: 30 },
    label: { fontSize: 14, fontWeight: '500' },
});

// ─── Info Card ────────────────────────────────────────────────────────────────
function InfoCard({ icon, title, subtitle, C }) {
    return (
        <View style={[ic.wrap, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[ic.iconWrap, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                <Text style={ic.icon}>{icon}</Text>
            </View>
            <View style={ic.content}>
                <Text style={[ic.title, { color: C.tx }]}>{title}</Text>
                <Text style={[ic.subtitle, { color: C.tx3 }]}>{subtitle}</Text>
            </View>
        </View>
    );
}

const ic = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16 },
    iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    icon: { fontSize: 24 },
    content: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '700' },
    subtitle: { fontSize: 12 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChangePhoneScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();
    const { t } = useTranslation();
    const { parentUser } = useAuthStore();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResend] = useState(0);
    const [phoneError, setPhoneError] = useState('');
    const [otpError, setOtpError] = useState('');

    const maskedOld = parentUser?.phone
        ? parentUser.phone.slice(0, -4).replace(/\d/g, '•') + parentUser.phone.slice(-4)
        : '••••••••••';

    const isPhoneValid = phone.length === 10;
    const isOtpComplete = otpValue.length === OTP_LEN;

    const startCooldown = (secs = 30) => {
        setResend(secs);
        const iv = setInterval(() => {
            setResend((p) => {
                if (p <= 1) {
                    clearInterval(iv);
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        if (!isPhoneValid) {
            setPhoneError('Enter a valid 10-digit mobile number');
            return;
        }

        setPhoneError('');
        setLoading(true);

        try {
            // TODO: Call actual API
            await new Promise((r) => setTimeout(r, 1000));
            setStep(2);
            startCooldown(30);
            setOtpValue('');
            setOtpError('');
        } catch (err) {
            setPhoneError(err?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!isOtpComplete) {
            setOtpError('Enter the 6-digit verification code');
            return;
        }

        setOtpError('');
        setLoading(true);

        try {
            // TODO: Call actual API
            await new Promise((r) => setTimeout(r, 1000));
            Alert.alert(
                'Phone Number Updated',
                'Your phone number has been successfully changed. Please login again.',
                [{ text: 'OK', onPress: () => router.back() }],
            );
        } catch (err) {
            setOtpError(err?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setLoading(true);
        try {
            // TODO: Call actual API
            await new Promise((r) => setTimeout(r, 800));
            startCooldown(30);
            setOtpValue('');
            setOtpError('');
        } catch {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* Navigation Bar */}
                <Animated.View entering={FadeInDown.delay(0).duration(300)} style={[nav.bar, { borderBottomColor: C.bd }]}>
                    <TouchableOpacity style={[nav.back, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
                        <ArrowLeft c={C.tx} />
                    </TouchableOpacity>
                    <Text style={[nav.title, { color: C.tx }]}>{t('changePhone.title')}</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {/* Step Indicator */}
                <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                    <StepIndicator step={step} C={C} />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(120).duration(350)} style={styles.content}>
                    {step === 1 ? (
                        <View style={styles.form}>
                            <InfoCard
                                icon="📱"
                                title="Change Phone Number"
                                subtitle={`Current number: ${maskedOld}`}
                                C={C}
                            />

                            <PhoneInputField
                                value={phone}
                                onChange={setPhone}
                                error={phoneError}
                                autoFocus
                                C={C}
                            />

                            <PrimaryButton
                                label="Send Verification Code"
                                onPress={handleSendOtp}
                                loading={loading}
                                disabled={!isPhoneValid}
                                C={C}
                            />
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <InfoCard
                                icon="📱"
                                title="New Phone Number"
                                subtitle={`+91 ${phone.slice(0, 5)} ${phone.slice(5, 10)}`}
                                C={C}
                            />

                            <OtpInputField
                                value={otpValue}
                                onChange={setOtpValue}
                                error={otpError}
                                C={C}
                            />

                            <View style={styles.resendRow}>
                                <Text style={[styles.resendLabel, { color: C.tx3 }]}>Didn't receive the code?</Text>
                                <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading} activeOpacity={0.7}>
                                    <Text style={[styles.resendBtn, { color: resendCooldown > 0 ? C.tx3 : C.primary }]}>
                                        {resendCooldown > 0
                                            ? `Resend in ${resendCooldown}s`
                                            : 'Resend Code'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <PrimaryButton
                                label="Verify & Update"
                                onPress={handleVerify}
                                loading={loading}
                                disabled={!isOtpComplete}
                                C={C}
                            />

                            <SecondaryButton
                                label="← Back to phone number"
                                onPress={() => {
                                    setStep(1);
                                    setOtpValue('');
                                    setOtpError('');
                                }}
                                C={C}
                            />
                        </View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const nav = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[2],
        paddingBottom: spacing[2],
        borderBottomWidth: 1,
    },
    back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
});

const styles = StyleSheet.create({
    content: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 24 },
    form: { gap: 24 },
    resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    resendLabel: { fontSize: 13 },
    resendBtn: { fontSize: 13, fontWeight: '700' },
});