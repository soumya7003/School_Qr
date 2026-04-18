/**
 * app/(app)/change-phone.jsx
 * Change Phone Number Screen
 * FIXED: Step indicator alignment, phone input formatting, icons, navigation
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { profileApi } from '@/features/profile/profile.api';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather } from '@expo/vector-icons';
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

// ─── Step Indicator (FIXED: Proper alignment) ─────────────────────────────────
function StepIndicator({ step, C }) {
    const { t } = useTranslation();

    return (
        <View style={[stepStyles.container, { borderBottomColor: C.bd }]}>
            <View style={stepStyles.stepsRow}>
                {/* Step 1 */}
                <View style={stepStyles.stepItem}>
                    <View style={[
                        stepStyles.dot,
                        {
                            borderColor: step >= 1 ? C.primary : C.bd2,
                            backgroundColor: step > 1 ? C.okBg : (step === 1 ? C.primaryBg : C.s3)
                        }
                    ]}>
                        {step > 1 ? (
                            <Feather name="check" size={14} color={C.ok} />
                        ) : (
                            <Text style={[stepStyles.dotText, { color: step === 1 ? C.primary : C.tx3 }]}>1</Text>
                        )}
                    </View>
                    <Text style={[stepStyles.label, { color: step === 1 ? C.tx : C.tx3 }]}>
                        {t('changePhone.stepNewNumber', 'New Number')}
                    </Text>
                </View>

                {/* Connector Line */}
                <View style={[stepStyles.connector, { backgroundColor: step > 1 ? C.ok : C.bd2 }]} />

                {/* Step 2 */}
                <View style={stepStyles.stepItem}>
                    <View style={[
                        stepStyles.dot,
                        {
                            borderColor: step === 2 ? C.primary : (step > 2 ? C.okBd : C.bd2),
                            backgroundColor: step > 2 ? C.okBg : (step === 2 ? C.primaryBg : C.s3)
                        }
                    ]}>
                        {step > 2 ? (
                            <Feather name="check" size={14} color={C.ok} />
                        ) : (
                            <Text style={[stepStyles.dotText, { color: step === 2 ? C.primary : C.tx3 }]}>2</Text>
                        )}
                    </View>
                    <Text style={[stepStyles.label, { color: step === 2 ? C.tx : C.tx3 }]}>
                        {t('changePhone.stepVerifyOtp', 'Verify OTP')}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
    },
    stepItem: {
        alignItems: 'center',
        gap: 6,
    },
    connector: {
        flex: 1,
        height: 2,
        marginHorizontal: 8,
        borderRadius: 1,
    },
    dot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotText: {
        fontSize: 13,
        fontWeight: '700',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
});

// ─── Phone Input Field (FIXED: Proper formatting) ─────────────────────────────
function PhoneInputField({ value, onChange, error, autoFocus, C }) {
    const [focused, setFocused] = useState(false);

    // Format for display only
    const displayValue = () => {
        if (!value) return '';
        if (value.length <= 5) return value;
        if (value.length <= 10) return `${value.slice(0, 5)} ${value.slice(5)}`;
        return value;
    };

    const handleChange = (text) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');
        onChange(cleaned);
    };

    return (
        <View style={phoneStyles.wrap}>
            <Text style={[phoneStyles.label, { color: C.tx3 }]}>New Phone Number</Text>
            <View style={[
                phoneStyles.box,
                {
                    backgroundColor: C.s3,
                    borderColor: error ? C.red : (focused ? C.primary : C.bd2),
                }
            ]}>
                <View style={phoneStyles.countryCode}>
                    <Text style={[phoneStyles.countryCodeText, { color: C.tx }]}>+91</Text>
                    <View style={[phoneStyles.divider, { backgroundColor: C.bd2 }]} />
                </View>
                <TextInput
                    style={[phoneStyles.input, { color: C.tx }]}
                    value={displayValue()}
                    onChangeText={handleChange}
                    placeholder="98765 43210"
                    placeholderTextColor={C.tx3}
                    keyboardType="phone-pad"
                    maxLength={11} // 5 + space + 5 = 11 chars max for display
                    autoFocus={autoFocus}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    selectionColor={C.primary}
                />
            </View>
            {error ? (
                <Text style={[phoneStyles.error, { color: C.red }]}>{error}</Text>
            ) : (
                <Text style={[phoneStyles.hint, { color: C.tx3 }]}>
                    Enter your new 10-digit mobile number
                </Text>
            )}
        </View>
    );
}

const phoneStyles = StyleSheet.create({
    wrap: { gap: 8 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        minHeight: 56,
        overflow: 'hidden',
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 24,
        marginLeft: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        paddingVertical: 14,
    },
    error: { fontSize: 12, marginTop: 4 },
    hint: { fontSize: 11, marginTop: 4 },
});

// ─── OTP Input ─────────────────────────────────────────────────────────────────
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
        <View style={otpStyles.wrap}>
            <Text style={[otpStyles.label, { color: C.tx3 }]}>Verification Code</Text>
            <View style={otpStyles.row}>
                {digits.map((digit, idx) => (
                    <TextInput
                        key={idx}
                        ref={(el) => { refs.current[idx] = el; }}
                        style={[
                            otpStyles.box,
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
            {error && <Text style={[otpStyles.error, { color: C.red }]}>{error}</Text>}
        </View>
    );
}

const otpStyles = StyleSheet.create({
    wrap: { gap: 12 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    box: {
        width: 48,
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    error: { fontSize: 12, marginTop: 4, textAlign: 'center' },
});

// ─── Primary Button ────────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress, loading, disabled, C }) {
    return (
        <TouchableOpacity
            style={[
                btnStyles.primary,
                { backgroundColor: C.primary },
                (disabled || loading) && btnStyles.disabled,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text style={btnStyles.primaryLabel}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

// ─── Secondary Button ──────────────────────────────────────────────────────────
function SecondaryButton({ label, onPress, disabled, C }) {
    return (
        <TouchableOpacity
            style={[btnStyles.secondary, { borderColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Text style={[btnStyles.secondaryLabel, { color: C.tx3 }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const btnStyles = StyleSheet.create({
    primary: {
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryLabel: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
        color: '#fff',
    },
    disabled: { opacity: 0.5 },
    secondary: {
        alignItems: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 30,
    },
    secondaryLabel: { fontSize: 14, fontWeight: '500' },
});

// ─── Info Card (FIXED: Proper icons) ──────────────────────────────────────────
function InfoCard({ title, subtitle, C, isWarning }) {
    return (
        <View style={[infoStyles.wrap, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[
                infoStyles.iconWrap,
                {
                    backgroundColor: isWarning ? C.ambBg : C.primaryBg,
                    borderColor: isWarning ? C.ambBd : C.primaryBd,
                }
            ]}>
                <Feather
                    name={isWarning ? 'alert-circle' : 'smartphone'}
                    size={22}
                    color={isWarning ? C.amb : C.primary}
                />
            </View>
            <View style={infoStyles.content}>
                <Text style={[infoStyles.title, { color: C.tx }]}>{title}</Text>
                <Text style={[infoStyles.subtitle, { color: C.tx3 }]}>{subtitle}</Text>
            </View>
        </View>
    );
}

const infoStyles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
    },
    iconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
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
    const [resendLoading, setResendLoading] = useState(false);
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
            await profileApi.sendPhoneChangeOtp(`+91${phone}`);
            setStep(2);
            startCooldown(30);
            setOtpValue('');
            setOtpError('');
        } catch (err) {
            setPhoneError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
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
            await profileApi.changePhone({ new_phone: `+91${phone}`, otp: otpValue });
            Alert.alert(
                'Phone Number Updated',
                'Your phone number has been successfully changed. Please login again.',
                [{
                    text: 'OK', onPress: () => {
                        useAuthStore.getState().logout();
                        router.replace('/(auth)/login');
                    }
                }],
            );
        } catch (err) {
            setOtpError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resendLoading) return;

        setResendLoading(true);
        try {
            await profileApi.sendPhoneChangeOtp(`+91${phone}`);
            startCooldown(30);
            setOtpValue('');
            setOtpError('');
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* Navigation Bar - FIXED: Consistent styling */}
                <Animated.View entering={FadeInDown.delay(0).duration(300)} style={[nav.bar, { borderBottomColor: C.bd }]}>
                    <TouchableOpacity
                        style={[nav.back, { backgroundColor: C.s2, borderColor: C.bd }]}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Feather name="chevron-left" size={22} color={C.tx} />
                    </TouchableOpacity>
                    <Text style={[nav.title, { color: C.tx }]}>{t('changePhone.title', 'Change Phone')}</Text>
                    <View style={nav.placeholder} />
                </Animated.View>

                {/* Step Indicator */}
                <Animated.View entering={FadeInDown.delay(60).duration(300)}>
                    <StepIndicator step={step} C={C} />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(120).duration(350)} style={styles.content}>
                    {step === 1 ? (
                        <View style={styles.form}>
                            <InfoCard
                                title="Current Phone Number"
                                subtitle={maskedOld}
                                C={C}
                            />

                            <InfoCard
                                title="Enter New Number"
                                subtitle="We'll send a verification code to this number"
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
                                title="Verifying Number"
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
                                <Text style={[styles.resendLabel, { color: C.tx3 }]}>
                                    Didn't receive the code?
                                </Text>
                                <TouchableOpacity
                                    onPress={handleResend}
                                    disabled={resendCooldown > 0 || resendLoading || loading}
                                    activeOpacity={0.7}
                                >
                                    {resendLoading ? (
                                        <ActivityIndicator size="small" color={C.primary} />
                                    ) : (
                                        <Text style={[styles.resendBtn, {
                                            color: resendCooldown > 0 ? C.tx3 : C.primary
                                        }]}>
                                            {resendCooldown > 0
                                                ? `Resend in ${resendCooldown}s`
                                                : 'Resend Code'}
                                        </Text>
                                    )}
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
    back: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    placeholder: { width: 40 },
});

const styles = StyleSheet.create({
    content: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 24 },
    form: { gap: 24 },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    resendLabel: { fontSize: 13 },
    resendBtn: { fontSize: 13, fontWeight: '700' },
});