// app/(app)/parent-profile.jsx
// Parent Profile — Manage personal info, email (with OTP verification), phone, avatar

import Screen from '@/components/common/Screen';
import { IconChevronRight, IconMail, IconPhone, IconUser } from '@/components/icon/AllIcon';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useProfile } from '@/features/profile/useProfile';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
    { bg: '#EEF2FF', text: '#4F46E5' },
    { bg: '#E6F7EC', text: '#059669' },
    { bg: '#FFF1F0', text: '#DC2626' },
    { bg: '#FEF3C7', text: '#D97706' },
    { bg: '#F3E8FF', text: '#9333EA' },
    { bg: '#FFE4E6', text: '#E11D48' },
    { bg: '#E0F2FE', text: '#0284C7' },
    { bg: '#FCE7F3', text: '#DB2777' },
];

function Avatar({ name, size = 80, colorIndex = 0, imageUrl, uploading, C }) {
    const colors = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];
    const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <View style={{ position: 'relative' }}>
            {/* Outer ring */}
            <View style={[
                avatarStyles.ring,
                {
                    width: size + 8,
                    height: size + 8,
                    borderRadius: (size + 8) * 0.28,
                    borderColor: C.primary + '40',
                }
            ]}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={[avatarStyles.image, { width: size, height: size, borderRadius: size * 0.25 }]}
                    />
                ) : (
                    <View style={[
                        avatarStyles.placeholder,
                        { width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.bg }
                    ]}>
                        <Text style={[avatarStyles.initial, { fontSize: size * 0.38, color: colors.text }]}>
                            {initial}
                        </Text>
                    </View>
                )}
            </View>

            {/* Camera badge */}
            <View style={[
                avatarStyles.badge,
                { backgroundColor: uploading ? C.s2 : C.primary, borderColor: C.bg }
            ]}>
                {uploading
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <Feather name="camera" size={13} color="#fff" />
                }
            </View>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    ring: {
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: { overflow: 'hidden' },
    placeholder: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    initial: { fontWeight: '800' },
    badge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, onPress, verified, unverified, C }) {
    return (
        <TouchableOpacity
            style={[rowStyles.container, { borderBottomColor: C.bd }]}
            onPress={onPress}
            activeOpacity={0.65}
        >
            <View style={[rowStyles.iconWrap, { backgroundColor: C.s3 }]}>
                {icon}
            </View>
            <View style={rowStyles.content}>
                <Text style={[rowStyles.label, { color: C.tx3 }]}>{label}</Text>
                <Text style={[rowStyles.value, { color: value ? C.tx : C.tx3 }]}>
                    {value || `Add ${label.toLowerCase()}`}
                </Text>
                {verified && (
                    <View style={[rowStyles.verifiedPill, { backgroundColor: C.okBg }]}>
                        <Feather name="check-circle" size={11} color={C.ok} />
                        <Text style={[rowStyles.verifiedText, { color: C.ok }]}>Verified</Text>
                    </View>
                )}
                {unverified && (
                    <View style={[rowStyles.verifiedPill, { backgroundColor: '#FEF3C7' }]}>
                        <Feather name="alert-circle" size={11} color="#D97706" />
                        <Text style={[rowStyles.verifiedText, { color: '#D97706' }]}>Not verified — tap to verify</Text>
                    </View>
                )}
            </View>
            <IconChevronRight color={C.tx3} size={14} />
        </TouchableOpacity>
    );
}

const rowStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        borderBottomWidth: 0.5,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { flex: 1, gap: 3 },
    label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
    value: { fontSize: 15, fontWeight: '600' },
    verifiedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginTop: 4,
    },
    verifiedText: { fontSize: 11, fontWeight: '600' },
});

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ children, C }) {
    return (
        <View style={[cardStyles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {children}
        </View>
    );
}

const cardStyles = StyleSheet.create({
    container: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 16 },
});

// ─── Name Edit Modal ───────────────────────────────────────────────────────────
function NameModal({ visible, currentValue, onSave, onClose, loading, C }) {
    const [value, setValue] = useState(currentValue || '');

    useEffect(() => {
        if (visible) setValue(currentValue || '');
    }, [visible, currentValue]);

    const handleSave = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (trimmed.length < 2) {
            Alert.alert('Too short', 'Name must be at least 2 characters');
            return;
        }
        onSave(trimmed);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={modalStyles.keyboardView}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
                        {/* Header */}
                        <View style={modalStyles.modalHeader}>
                            <View style={[modalStyles.modalIconWrap, { backgroundColor: C.s3 }]}>
                                <Feather name="user" size={20} color={C.primary} />
                            </View>
                            <Text style={[modalStyles.title, { color: C.tx }]}>Edit Name</Text>
                            <Text style={[modalStyles.subtitle, { color: C.tx3 }]}>
                                This name will appear on your profile
                            </Text>
                        </View>

                        <TextInput
                            style={[modalStyles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]}
                            value={value}
                            onChangeText={setValue}
                            placeholder="Enter your full name"
                            placeholderTextColor={C.tx3}
                            keyboardType="default"
                            autoCapitalize="words"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />

                        <View style={modalStyles.buttonRow}>
                            <TouchableOpacity
                                style={[modalStyles.button, modalStyles.cancelBtn, { borderColor: C.bd }]}
                                onPress={onClose}
                                disabled={loading}
                            >
                                <Text style={[modalStyles.btnText, { color: C.tx3 }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modalStyles.button, { backgroundColor: C.primary }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={[modalStyles.btnText, { color: '#fff' }]}>Save</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Email Verification Modal ──────────────────────────────────────────────────
// Step 1: Enter new email
// Step 2: Enter OTP sent to that email
function EmailModal({ visible, currentEmail, onSave, onClose, loading, sendEmailOtp, C }) {
    const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);
    const cooldownRef = useRef(null);

    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            setStep(1);
            setEmail('');
            setOtp(['', '', '', '', '', '']);
            setResendCooldown(0);
        }
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, [visible]);

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const startCooldown = () => {
        setResendCooldown(60);
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async () => {
        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }
        if (email.trim().toLowerCase() === currentEmail?.toLowerCase()) {
            Alert.alert('Same Email', 'This is already your current email address');
            return;
        }

        setSendingOtp(true);
        try {
            await sendEmailOtp(email.trim());
            setStep(2);
            startCooldown();
        } catch (err) {
            Alert.alert('Failed', err?.response?.data?.message || err?.message || 'Could not send verification code');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleOtpChange = (text, index) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyAndSave = () => {
        const code = otp.join('');
        if (code.length < 6) {
            Alert.alert('Incomplete', 'Please enter the full 6-digit code');
            return;
        }
        // Pass email + otp to parent handler
        onSave({ email: email.trim(), otp: code });
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setSendingOtp(true);
        try {
            await sendEmailOtp(email.trim());
            setOtp(['', '', '', '', '', '']);
            startCooldown();
            Alert.alert('Sent!', 'A new code has been sent to your email');
        } catch (err) {
            Alert.alert('Failed', err?.response?.data?.message || err?.message || 'Could not resend code');
        } finally {
            setSendingOtp(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={modalStyles.keyboardView}
            >
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>

                        {/* Step indicator */}
                        <View style={emailStyles.stepRow}>
                            <View style={[emailStyles.stepDot, { backgroundColor: C.primary }]} />
                            <View style={[emailStyles.stepLine, { backgroundColor: step === 2 ? C.primary : C.bd }]} />
                            <View style={[emailStyles.stepDot, { backgroundColor: step === 2 ? C.primary : C.bd }]} />
                        </View>

                        {step === 1 ? (
                            <>
                                <View style={modalStyles.modalHeader}>
                                    <View style={[modalStyles.modalIconWrap, { backgroundColor: '#E0F2FE' }]}>
                                        <Feather name="mail" size={20} color="#0284C7" />
                                    </View>
                                    <Text style={[modalStyles.title, { color: C.tx }]}>Change Email</Text>
                                    <Text style={[modalStyles.subtitle, { color: C.tx3 }]}>
                                        Enter your new email address. We'll send a verification code.
                                    </Text>
                                </View>

                                <TextInput
                                    style={[modalStyles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter new email"
                                    placeholderTextColor={C.tx3}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                    returnKeyType="send"
                                    onSubmitEditing={handleSendOtp}
                                />

                                <View style={modalStyles.buttonRow}>
                                    <TouchableOpacity
                                        style={[modalStyles.button, modalStyles.cancelBtn, { borderColor: C.bd }]}
                                        onPress={onClose}
                                        disabled={sendingOtp}
                                    >
                                        <Text style={[modalStyles.btnText, { color: C.tx3 }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[modalStyles.button, { backgroundColor: C.primary }]}
                                        onPress={handleSendOtp}
                                        disabled={sendingOtp}
                                    >
                                        {sendingOtp
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <Text style={[modalStyles.btnText, { color: '#fff' }]}>Send Code</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={modalStyles.modalHeader}>
                                    <View style={[modalStyles.modalIconWrap, { backgroundColor: '#E6F7EC' }]}>
                                        <Feather name="shield" size={20} color="#059669" />
                                    </View>
                                    <Text style={[modalStyles.title, { color: C.tx }]}>Verify Email</Text>
                                    <Text style={[modalStyles.subtitle, { color: C.tx3 }]}>
                                        Enter the 6-digit code sent to{'\n'}
                                        <Text style={{ color: C.tx, fontWeight: '700' }}>{email}</Text>
                                    </Text>
                                </View>

                                {/* OTP boxes */}
                                <View style={emailStyles.otpRow}>
                                    {otp.map((digit, i) => (
                                        <TextInput
                                            key={i}
                                            ref={(ref) => (otpRefs.current[i] = ref)}
                                            style={[
                                                emailStyles.otpBox,
                                                {
                                                    backgroundColor: C.s3,
                                                    borderColor: digit ? C.primary : C.bd,
                                                    color: C.tx,
                                                }
                                            ]}
                                            value={digit}
                                            onChangeText={(t) => handleOtpChange(t, i)}
                                            onKeyPress={(e) => handleOtpKeyPress(e, i)}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            textAlign="center"
                                            selectTextOnFocus
                                        />
                                    ))}
                                </View>

                                {/* Resend */}
                                <TouchableOpacity
                                    onPress={handleResend}
                                    disabled={resendCooldown > 0 || sendingOtp}
                                    style={emailStyles.resendBtn}
                                >
                                    <Text style={[emailStyles.resendText, { color: resendCooldown > 0 ? C.tx3 : C.primary }]}>
                                        {resendCooldown > 0
                                            ? `Resend code in ${resendCooldown}s`
                                            : sendingOtp ? 'Sending...' : 'Resend code'
                                        }
                                    </Text>
                                </TouchableOpacity>

                                <View style={modalStyles.buttonRow}>
                                    <TouchableOpacity
                                        style={[modalStyles.button, modalStyles.cancelBtn, { borderColor: C.bd }]}
                                        onPress={() => setStep(1)}
                                        disabled={loading}
                                    >
                                        <Text style={[modalStyles.btnText, { color: C.tx3 }]}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[modalStyles.button, { backgroundColor: C.primary }]}
                                        onPress={handleVerifyAndSave}
                                        disabled={loading || otp.join('').length < 6}
                                    >
                                        {loading
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <Text style={[modalStyles.btnText, { color: '#fff' }]}>Verify & Save</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const emailStyles = StyleSheet.create({
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginBottom: 20,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    stepLine: {
        width: 48,
        height: 2,
        borderRadius: 1,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    otpBox: {
        width: 44,
        height: 52,
        borderRadius: 12,
        borderWidth: 1.5,
        fontSize: 22,
        fontWeight: '700',
    },
    resendBtn: {
        alignSelf: 'center',
        marginBottom: 20,
        paddingVertical: 4,
    },
    resendText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

const modalStyles = StyleSheet.create({
    keyboardView: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 24,
        width: '100%',
        maxWidth: 360,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    modalIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
    input: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    buttonRow: { flexDirection: 'row', gap: 12 },
    button: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelBtn: { borderWidth: 1 },
    btnText: { fontSize: 14, fontWeight: '700' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ParentProfileScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    const {
        parent,
        generateAvatarUploadUrl,
        confirmAvatarUpload,
        updateParentProfile,
        sendEmailOtp,
        verifyEmail,
        changeEmail,
        sendEmailChangeOtp,
        verifyEmailChange,
    } = useProfile();

    const parentUser = useAuthStore(useShallow((s) => s.parentUser));
    const refreshProfile = useProfileStore((s) => s.refresh);

    const [avatarUploading, setAvatarUploading] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);

    const displayName = parentUser?.name || parent?.name || '';
    const displayEmail = parentUser?.email || parent?.email || '';
    const displayPhone = parentUser?.phone || parent?.phone || '';
    const displayAvatar = parentUser?.avatar_url || parent?.avatar_url || null;
    const isPhoneVerified = parentUser?.is_phone_verified || parent?.is_phone_verified || false;
    const isEmailVerified = parentUser?.is_email_verified || parent?.is_email_verified || false;

    const handleAvatarUpload = async () => {
        const { launchImageLibraryAsync } = await import('expo-image-picker');
        const result = await launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]?.uri) return;

        setAvatarUploading(true);
        try {
            const localUri = result.assets[0].uri;
            const response = await fetch(localUri);
            const blob = await response.blob();

            const { uploadUrl, key, nonce } = await generateAvatarUploadUrl(
                blob.type || 'image/jpeg',
                blob.size
            );

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': blob.type },
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            await confirmAvatarUpload(key, nonce);
            await refreshProfile();
            Alert.alert('Done', 'Profile photo updated');
        } catch (err) {
            Alert.alert('Upload Failed', err?.message || 'Please try again');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSaveName = async (name) => {
        setSavingName(true);
        try {
            await updateParentProfile({ name });
            await refreshProfile();
            setNameModalVisible(false);
        } catch (err) {
            Alert.alert('Update Failed', err?.message || 'Please try again');
        } finally {
            setSavingName(false);
        }
    };

    // Called after OTP verified — receives { email, otp }
    const handleSaveEmail = async ({ email, otp }) => {
        setSavingEmail(true);
        try {
            if (displayEmail) {
                // ✅ USE NEW ENDPOINTS FOR EMAIL CHANGE
                await verifyEmailChange(email, otp);
            } else {
                await verifyEmail(email, otp);
            }
            setEmailModalVisible(false);
            Alert.alert('Email Updated', 'Your email has been verified and updated.');
        } catch (err) {
            Alert.alert('Verification Failed', err?.response?.data?.message || err?.message || 'Invalid code. Please try again.');
        } finally {
            setSavingEmail(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            {/* Name Modal */}
            <NameModal
                visible={nameModalVisible}
                currentValue={displayName}
                onSave={handleSaveName}
                onClose={() => setNameModalVisible(false)}
                loading={savingName}
                C={C}
            />

            {/* Email Modal with OTP verification */}
            <EmailModal
                visible={emailModalVisible}
                currentEmail={displayEmail}
                onSave={handleSaveEmail}
                onClose={() => setEmailModalVisible(false)}
                loading={savingEmail}
                sendEmailOtp={displayEmail ? sendEmailChangeOtp : sendEmailOtp}
                C={C}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.pageHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="chevron-left" size={28} color={C.tx} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.pageTitle, { color: C.tx }]}>Your Profile</Text>
                        <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>Manage your personal information</Text>
                    </View>
                </Animated.View>

                {/* Avatar */}
                <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.avatarSection}>
                    <TouchableOpacity onPress={handleAvatarUpload} disabled={avatarUploading} activeOpacity={0.8}>
                        <Avatar
                            name={displayName}
                            size={96}
                            imageUrl={displayAvatar}
                            uploading={avatarUploading}
                            C={C}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.avatarHint, { color: C.tx3 }]}>
                        {avatarUploading ? 'Uploading...' : 'Tap to change photo'}
                    </Text>
                </Animated.View>

                {/* Info Card */}
                <Animated.View entering={FadeInDown.delay(120).duration(350)}>
                    <SectionCard C={C}>
                        <InfoRow
                            icon={<IconUser color={C.primary} size={20} />}
                            label="Full Name"
                            value={displayName}
                            onPress={() => setNameModalVisible(true)}
                            C={C}
                        />
                        <InfoRow
                            icon={<IconMail color={C.blue} size={20} />}
                            label="Email Address"
                            value={displayEmail}
                            onPress={() => setEmailModalVisible(true)}
                            verified={isEmailVerified}
                            unverified={displayEmail && !isEmailVerified}
                            C={C}
                        />
                        <InfoRow
                            icon={<IconPhone color={C.ok} size={20} />}
                            label="Phone Number"
                            value={displayPhone}
                            onPress={() => router.push('/(app)/change-phone')}
                            verified={isPhoneVerified}
                            C={C}
                        />
                    </SectionCard>
                </Animated.View>

                {/* Info hint */}
                <Animated.View entering={FadeInDown.delay(160).duration(350)}>
                    <View style={[styles.infoBox, { backgroundColor: C.s2, borderColor: C.bd }]}>
                        <Feather name="info" size={15} color={C.tx3} />
                        <Text style={[styles.infoText, { color: C.tx3 }]}>
                            Your phone and email are used for emergency alerts and account security.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: spacing.screenH,
        paddingTop: 8,
        paddingBottom: spacing[12],
        gap: 20,
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    backBtn: { marginLeft: -8, padding: 4 },
    pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, marginTop: 2 },

    avatarSection: { alignItems: 'center', gap: 10, marginBottom: 4 },
    avatarHint: { fontSize: 12, fontWeight: '500' },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});