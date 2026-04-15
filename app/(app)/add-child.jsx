/**
 * app/(app)/add-child.jsx
 * Add Child Screen — Existing parent adds new child by card scan
 * No OTP — direct link, then redirect to updates page for profile completion
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useProfile } from '@/features/profile/useProfile';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
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

function SuccessCard({ studentName, onContinue, C }) {
    return (
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={[successStyles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
            <View style={[successStyles.iconCircle, { backgroundColor: C.okBg }]}>
                <Feather name="check" size={32} color={C.ok} />
            </View>
            <Text style={[successStyles.title, { color: C.tx }]}>Card Linked!</Text>
            <Text style={[successStyles.message, { color: C.tx3 }]}>
                {studentName ? `${studentName} has been` : 'Your child has been'} added. Please complete their profile.
            </Text>
            <TouchableOpacity style={[successStyles.button, { backgroundColor: C.primary }]} onPress={onContinue}>
                <Text style={successStyles.buttonText}>Complete Profile</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const successStyles = StyleSheet.create({
    card: { borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center', gap: 16 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    button: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default function AddChildScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();
    const { addChildByCard, refresh } = useProfile();
    const setActiveStudent = useProfileStore((s) => s.setActiveStudent);

    const [cardNumber, setCardNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [newStudentId, setNewStudentId] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [success, setSuccess] = useState(false);

    const formatCardNumber = (text) => {
        return text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    };

    useFocusEffect(
        useCallback(() => {
            // Reset all state to initial values
            setCardNumber('');
            setLoading(false);
            setError('');
            setNewStudentId(null);
            setStudentName('');
            setSuccess(false);

            // Optional: return cleanup function
            return () => {
                // Cleanup if needed
            };
        }, [])
    );

    // In add-child.jsx, replace handleAddChild:

    const handleAddChild = async () => {
        if (!cardNumber.trim()) {
            setError('Card number is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await addChildByCard({ card_number: cardNumber });

            console.log('[AddChild] Result:', result);

            // Check if we have a student ID
            const studentId = result?.student_id;

            if (studentId) {
                setNewStudentId(studentId);
                setStudentName(result?.student_name || '');

                // Wait for store to update
                await new Promise(resolve => setTimeout(resolve, 200));

                // Set the new student as active
                try {
                    await useProfileStore.getState().setActiveStudentWithSync(studentId);
                } catch (syncError) {
                    console.warn('[AddChild] Failed to sync active student:', syncError);
                    // Fallback: just set it locally
                    useProfileStore.setState({ activeStudentId: studentId });
                }

                setSuccess(true);
            } else {
                // No student ID in response - check if store has it
                const storeState = useProfileStore.getState();
                const newStudent = storeState.students[storeState.students.length - 1];

                if (newStudent) {
                    setNewStudentId(newStudent.id);
                    setStudentName(`${newStudent.first_name || ''} ${newStudent.last_name || ''}`.trim());
                    await useProfileStore.getState().setActiveStudentWithSync(newStudent.id);
                    setSuccess(true);
                } else {
                    throw new Error('No student information received');
                }
            }
        } catch (err) {
            console.error('[AddChild] Error:', err);

            // Don't show error if we already succeeded
            if (success) return;

            // Handle specific error cases
            const errorMessage = err?.response?.data?.message || err?.message || '';

            if (err?.response?.status === 404 || errorMessage.includes('not found')) {
                setError('Card not found. Check the number printed on your card.');
            } else if (err?.response?.status === 409 || errorMessage.includes('already linked')) {
                setError('This card is already linked to another parent.');
            } else if (errorMessage.includes('already linked to your account')) {
                setError('This child is already linked to your account.');
            } else {
                // Only show generic error if we don't have a specific one
                setError(errorMessage || 'Failed to add child. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = () => {
        // 🟢 Navigate to updates with the new student ID
        router.push({
            pathname: '/(app)/updates',
            params: { studentId: newStudentId, isNewStudent: 'true' }
        });
    };

    if (success) {
        return (
            <Screen bg={C.bg} edges={['top', 'left', 'right']}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <SuccessCard
                        studentName={studentName}
                        onContinue={handleCompleteProfile}
                        C={C}
                    />
                </ScrollView>
            </Screen>
        );
    }

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={C.tx} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: C.tx }]}>Add Child</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.formCard}>
                        <View style={[styles.card, { backgroundColor: C.s2, borderColor: C.bd }]}>
                            <CardInput
                                value={cardNumber}
                                onChange={(text) => { setCardNumber(formatCardNumber(text)); setError(''); }}
                                error={error}
                                C={C}
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Feather name="info" size={14} color={C.blue} />
                            <Text style={[styles.infoText, { color: C.tx3 }]}>
                                Enter the card number printed on your child's RESQID card. The child will be added to your account immediately.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.nextButton, { backgroundColor: C.primary, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleAddChild}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>Add Child</Text>
                                    <Feather name="plus" size={18} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
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
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 4 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 30, marginTop: 8 },
    nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});