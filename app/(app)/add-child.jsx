/**
 * app/(app)/add-child.jsx
 * Add Child Screen — Register a new child to existing parent account
 * Supports both: blank card + pre-filled card
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfile } from '@/features/profile/useProfile';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep, C }) {
    const steps = ['Card', 'Verify', 'Complete'];
    return (
        <View style={stepStyles.container}>
            {steps.map((label, idx) => (
                <View key={idx} style={stepStyles.step}>
                    <View style={[
                        stepStyles.circle,
                        {
                            backgroundColor: idx <= currentStep ? C.primary : C.s3,
                            borderColor: idx <= currentStep ? C.primaryBd : C.bd,
                        }
                    ]}>
                        {idx < currentStep ? (
                            <Feather name="check" size={14} color="#fff" />
                        ) : (
                            <Text style={[stepStyles.circleText, { color: idx <= currentStep ? '#fff' : C.tx3 }]}>
                                {idx + 1}
                            </Text>
                        )}
                    </View>
                    <Text style={[stepStyles.label, { color: idx <= currentStep ? C.primary : C.tx3 }]}>
                        {label}
                    </Text>
                    {idx < steps.length - 1 && (
                        <View style={[stepStyles.line, { backgroundColor: idx < currentStep ? C.primary : C.bd }]} />
                    )}
                </View>
            ))}
        </View>
    );
}

const stepStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        marginBottom: 8,
    },
    step: { flex: 1, alignItems: 'center', position: 'relative' },
    circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 8 },
    circleText: { fontSize: 14, fontWeight: '700' },
    label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
    line: { position: 'absolute', top: 18, left: '50%', right: '-50%', height: 2 },
});

// ── Card Input Field ──────────────────────────────────────────────────────────
function CardInput({ value, onChange, error, C }) {
    return (
        <View style={cardInputStyles.container}>
            <View style={[cardInputStyles.iconWrapper, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                <MaterialCommunityIcons name="credit-card-chip" size={22} color={C.primary} />
            </View>
            <View style={cardInputStyles.inputWrapper}>
                <Text style={[cardInputStyles.label, { color: C.tx3 }]}>Card Number</Text>
                <TextInput
                    style={[cardInputStyles.input, { color: C.tx, borderBottomColor: error ? C.red : C.bd }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g., RQ-XXXX-XXXXXXXX"
                    placeholderTextColor={C.tx3}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                {error && <Text style={[cardInputStyles.error, { color: C.red }]}>{error}</Text>}
            </View>
        </View>
    );
}

const cardInputStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
    iconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    inputWrapper: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    input: { fontSize: 16, fontWeight: '500', paddingVertical: 8, borderBottomWidth: 1 },
    error: { fontSize: 11, marginTop: 6 },
});

// ── Phone Input Field ─────────────────────────────────────────────────────────
function PhoneInput({ value, onChange, error, C }) {
    return (
        <View style={phoneStyles.container}>
            <View style={[phoneStyles.iconWrapper, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                <Feather name="phone" size={22} color={C.blue} />
            </View>
            <View style={phoneStyles.inputWrapper}>
                <Text style={[phoneStyles.label, { color: C.tx3 }]}>Phone Number</Text>
                <TextInput
                    style={[phoneStyles.input, { color: C.tx, borderBottomColor: error ? C.red : C.bd }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="+91 XXXXX 43210"
                    placeholderTextColor={C.tx3}
                    keyboardType="phone-pad"
                />
                {error && <Text style={[phoneStyles.error, { color: C.red }]}>{error}</Text>}
                <Text style={[phoneStyles.hint, { color: C.tx3 }]}>We'll send OTP to verify this number</Text>
            </View>
        </View>
    );
}

const phoneStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
    iconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    inputWrapper: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    input: { fontSize: 16, fontWeight: '500', paddingVertical: 8, borderBottomWidth: 1 },
    error: { fontSize: 11, marginTop: 6 },
    hint: { fontSize: 10, marginTop: 6 },
});

// ─── OTP Input Field ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange, error, onResend, timer, C }) {
    return (
        <View style={otpStyles.container}>
            <View style={[otpStyles.iconWrapper, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                <Feather name="key" size={22} color={C.ok} />
            </View>
            <View style={otpStyles.inputWrapper}>
                <Text style={[otpStyles.label, { color: C.tx3 }]}>Verification Code</Text>
                <TextInput
                    style={[otpStyles.input, { color: C.tx, borderBottomColor: error ? C.red : C.bd }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="6-digit code"
                    placeholderTextColor={C.tx3}
                    keyboardType="number-pad"
                    maxLength={6}
                />
                {error && <Text style={[otpStyles.error, { color: C.red }]}>{error}</Text>}
                <TouchableOpacity onPress={onResend} disabled={timer > 0} style={otpStyles.resendButton}>
                    <Text style={[otpStyles.resendText, { color: timer > 0 ? C.tx3 : C.primary }]}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const otpStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 16 },
    iconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    inputWrapper: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
    input: { fontSize: 16, fontWeight: '500', paddingVertical: 8, borderBottomWidth: 1 },
    error: { fontSize: 11, marginTop: 6 },
    resendButton: { marginTop: 10, alignSelf: 'flex-start' },
    resendText: { fontSize: 12, fontWeight: '600' },
});

// ─── Success Card ─────────────────────────────────────────────────────────────
function SuccessCard({ studentName, cardNumber, onContinue, C }) {
    return (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[successStyles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[successStyles.iconCircle, { backgroundColor: C.okBg }]}>
                <Feather name="check" size={32} color={C.ok} />
            </View>
            <Text style={[successStyles.title, { color: C.tx }]}>Child Added Successfully!</Text>
            <Text style={[successStyles.message, { color: C.tx3 }]}>
                {studentName ? `${studentName} has been` : 'Your child has been'} added to your account.
            </Text>
            {cardNumber && (
                <View style={[successStyles.cardPreview, { backgroundColor: C.s3, borderColor: C.bd }]}>
                    <MaterialCommunityIcons name="qrcode" size={20} color={C.primary} />
                    <Text style={[successStyles.cardNumber, { color: C.tx }]}>{cardNumber}</Text>
                </View>
            )}
            <TouchableOpacity style={[successStyles.button, { backgroundColor: C.primary }]} onPress={onContinue}>
                <Text style={successStyles.buttonText}>Continue</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const successStyles = StyleSheet.create({
    card: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 16 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    cardPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    cardNumber: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    button: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddChildScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();
    const { parentUser } = useAuthStore();

    // ✅ Use the new hook with addChildByCard
    const { addChildByCard, fetchAndPersist } = useProfile();
    const isNewUser = useAuthStore((s) => s.isNewUser);

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    // Form fields
    const [cardNumber, setCardNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [nonce, setNonce] = useState('');
    const [studentName, setStudentName] = useState('');

    // Errors
    const [cardError, setCardError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [otpError, setOtpError] = useState('');

    const formatCardNumber = (text) => {
        return text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    };

    const validatePhone = (num) => {
        const cleaned = num.replace(/\D/g, '');
        return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
    };

    const startTimer = () => {
        setTimer(30);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Step 1: Validate Card & Send OTP
    const handleInitRegistration = async () => {
        if (!cardNumber.trim()) {
            setCardError('Card number is required');
            return;
        }
        if (!validatePhone(phone)) {
            setPhoneError('Enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setCardError('');
        setPhoneError('');

        try {
            const { registrationApi } = await import('@/features/profile/profile.api');
            const response = await registrationApi.initRegistration({
                card_number: cardNumber,
                phone: phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`,
            });

            setNonce(response.nonce);
            setStudentName(response.student_first_name || '');
            startTimer();
            setStep(1);
        } catch (err) {
            console.error('Init error:', err);
            if (err?.message?.includes('404')) {
                setCardError('Card not found. Check the number printed on your card.');
            } else if (err?.message?.includes('409')) {
                setCardError('This card is already registered. Please sign in instead.');
            } else {
                setCardError(err?.message || 'Failed to send OTP. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP & Complete Registration
    const handleVerifyRegistration = async () => {
        if (!otp || otp.length < 6) {
            setOtpError('Enter 6-digit verification code');
            return;
        }

        setLoading(true);
        setOtpError('');

        try {
            const { registrationApi } = await import('@/features/profile/profile.api');
            const response = await registrationApi.verifyRegistration({
                nonce,
                otp,
                phone: phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`,
            });

            // ✅ Use addChildByCard from useProfile (handles API call + refresh + alert)
            await addChildByCard({
                card_number: cardNumber,
                phone: phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`,
            });

            // ✅ Refresh profile to show new child
            await fetchAndPersist();

            // ✅ Decide where to go based on isNewUser
            if (isNewUser) {
                // First child ever → go to updates page
                router.replace('/(app)/updates');
            } else {
                // Adding additional child → go back to settings
                setStep(2);
            }
        } catch (err) {
            console.error('Verify error:', err);
            setOtpError(err?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            const { registrationApi } = await import('@/features/profile/profile.api');
            await registrationApi.initRegistration({
                card_number: cardNumber,
                phone: phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`,
            });
            startTimer();
        } catch (err) {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        router.back();
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={C.tx} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: C.tx }]}>Add Child</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {step < 2 && <StepIndicator currentStep={step} C={C} />}

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 0 && (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formCard}>
                            <View style={[styles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
                                <CardInput
                                    value={cardNumber}
                                    onChange={(text) => { setCardNumber(formatCardNumber(text)); setCardError(''); }}
                                    error={cardError}
                                    C={C}
                                />
                                <View style={[styles.divider, { backgroundColor: C.bd }]} />
                                <PhoneInput
                                    value={phone}
                                    onChange={(text) => { setPhone(text); setPhoneError(''); }}
                                    error={phoneError}
                                    C={C}
                                />
                            </View>

                            <View style={styles.infoBox}>
                                <Feather name="info" size={14} color={C.blue} />
                                <Text style={[styles.infoText, { color: C.tx3 }]}>
                                    We'll send a verification code to this number to confirm ownership.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: C.primary, opacity: loading ? 0.7 : 1 }]}
                                onPress={handleInitRegistration}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>Send Verification Code</Text>
                                        <Feather name="arrow-right" size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {step === 1 && (
                        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formCard}>
                            <View style={[styles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
                                <OtpInput
                                    value={otp}
                                    onChange={(text) => { setOtp(text); setOtpError(''); }}
                                    error={otpError}
                                    onResend={handleResendOtp}
                                    timer={timer}
                                    C={C}
                                />
                            </View>

                            {studentName && (
                                <View style={[styles.previewCard, { backgroundColor: C.s3, borderColor: C.bd }]}>
                                    <Feather name="user" size={16} color={C.primary} />
                                    <Text style={[styles.previewText, { color: C.tx2 }]}>
                                        Adding: <Text style={{ fontWeight: '700', color: C.tx }}>{studentName}</Text>
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: C.primary, opacity: loading ? 0.7 : 1 }]}
                                onPress={handleVerifyRegistration}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>Verify & Add Child</Text>
                                        <Feather name="check" size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.backToCardButton, { borderColor: C.bd }]}
                                onPress={() => setStep(0)}
                            >
                                <Text style={[styles.backToCardText, { color: C.tx3 }]}>← Back to card details</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {step === 2 && (
                        <SuccessCard
                            studentName={studentName}
                            cardNumber={cardNumber}
                            onContinue={handleContinue}
                            C={C}
                        />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[5],
        paddingBottom: spacing[3],
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    scrollContent: { paddingHorizontal: spacing.screenH, paddingBottom: spacing[12], gap: 20 },
    formCard: { gap: 20 },
    card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    divider: { height: 1 },
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 4 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 30, marginTop: 8 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backToCardButton: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderRadius: 30 },
    backToCardText: { fontSize: 14, fontWeight: '500' },
    previewCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
    previewText: { fontSize: 13 },
});