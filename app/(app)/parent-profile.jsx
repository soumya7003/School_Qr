// app/(app)/parent-profile.jsx
// Parent Profile — Manage personal info, email, phone, avatar

import Screen from '@/components/common/Screen';
import { IconChevronRight, IconMail, IconPhone, IconUser } from '@/components/icon/AllIcon';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useProfile } from '@/features/profile/useProfile';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

// ─── Notion-style Avatar ──────────────────────────────────────────────────────
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

function Avatar({ name, size = 80, colorIndex = 0, imageUrl }) {
    const colors = AVATAR_PALETTE[colorIndex % AVATAR_PALETTE.length];

    if (imageUrl) {
        return (
            <Image
                source={{ uri: imageUrl }}
                style={[avatarStyles.image, { width: size, height: size, borderRadius: size * 0.25 }]}
            />
        );
    }

    const initial = name?.charAt(0)?.toUpperCase() ?? '?';
    return (
        <View style={[avatarStyles.container, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.bg }]}>
            <Text style={[avatarStyles.text, { fontSize: size * 0.35, color: colors.text }]}>{initial}</Text>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    text: { fontWeight: '700' },
    image: { overflow: 'hidden' },
});

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, onPress, loading, editable = true, C }) {
    const Wrapper = editable && onPress ? TouchableOpacity : View;

    return (
        <Wrapper
            style={[rowStyles.container, { borderBottomColor: C.bd }]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.7}
        >
            <View style={[rowStyles.iconWrap, { backgroundColor: C.s3 }]}>
                {icon}
            </View>
            <View style={rowStyles.content}>
                <Text style={[rowStyles.label, { color: C.tx3 }]}>{label}</Text>
                {loading ? (
                    <ActivityIndicator size="small" color={C.primary} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                ) : (
                    <Text style={[rowStyles.value, { color: value ? C.tx : C.tx3 }]}>
                        {value || `Add ${label.toLowerCase()}`}
                    </Text>
                )}
            </View>
            {editable && !loading && (
                <IconChevronRight color={C.tx3} size={14} />
            )}
        </Wrapper>
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
        justifyContent: 'center'
    },
    content: { flex: 1, gap: 4 },
    label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
    value: { fontSize: 16, fontWeight: '600' },
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ visible, type, currentValue, onSave, onClose, loading, C }) {
    const [value, setValue] = useState(currentValue || '');

    const config = {
        name: { title: 'Your Name', placeholder: 'Enter your full name', keyboard: 'default' },
        email: { title: 'Email Address', placeholder: 'Enter your email', keyboard: 'email-address' },
    };

    const { title, placeholder, keyboard } = config[type] || {};

    const handleSave = () => {
        if (!value.trim()) {
            Alert.alert('Required', `Please enter your ${type}`);
            return;
        }
        onSave(value.trim());
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={[modalStyles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    <Text style={[modalStyles.title, { color: C.tx }]}>{title}</Text>

                    <TextInput
                        style={[modalStyles.input, { backgroundColor: C.s3, borderColor: C.bd, color: C.tx }]}
                        value={value}
                        onChangeText={setValue}
                        placeholder={placeholder}
                        placeholderTextColor={C.tx3}
                        keyboardType={keyboard}
                        autoCapitalize={type === 'email' ? 'none' : 'words'}
                        autoFocus
                    />

                    <View style={modalStyles.buttonRow}>
                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.cancelButton, { borderColor: C.bd }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[modalStyles.buttonText, { color: C.tx3 }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.button, modalStyles.saveButton, { backgroundColor: C.primary }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    container: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 24,
        width: '100%',
        maxWidth: 340
    },
    title: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
    input: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    buttonRow: { flexDirection: 'row', gap: 12, width: '100%' },
    button: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
    cancelButton: { borderWidth: 1 },
    saveButton: {},
    buttonText: { fontSize: 14, fontWeight: '700' },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ParentProfileScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    const { parent } = useProfile();
    const parentUser = useAuthStore(useShallow((s) => s.parentUser));

    const {
        generateAvatarUploadUrl,
        confirmAvatarUpload,
        updateParentProfile,
        sendPhoneChangeOtp,
    } = useProfile();

    const refreshProfile = useProfileStore((s) => s.refresh);

    const [avatarUploading, setAvatarUploading] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [saving, setSaving] = useState(false);

    const displayName = parentUser?.name || parent?.name || 'Parent';
    const displayEmail = parentUser?.email || parent?.email || '';
    const displayPhone = parentUser?.phone || parent?.phone || '+91 •••• ••••';
    const displayAvatar = parentUser?.avatar_url || parent?.avatar_url || null;
    const isPhoneVerified = parentUser?.is_phone_verified || parent?.is_phone_verified || false;

    const handleAvatarUpload = async () => {
        // Use image picker
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

            Alert.alert('Success', 'Profile photo updated');
        } catch (err) {
            Alert.alert('Upload Failed', err?.message || 'Please try again');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSaveField = async (value) => {
        if (!editModal) return;

        setSaving(true);
        try {
            const payload = editModal === 'name'
                ? { name: value }
                : { email: value };

            await updateParentProfile(payload);
            await refreshProfile();
            setEditModal(null);
            Alert.alert('Success', `${editModal === 'name' ? 'Name' : 'Email'} updated`);
        } catch (err) {
            Alert.alert('Update Failed', err?.message || 'Please try again');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePhone = () => {
        router.push('/(app)/change-phone');
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <EditModal
                visible={!!editModal}
                type={editModal}
                currentValue={editModal === 'name' ? displayName : displayEmail}
                onSave={handleSaveField}
                onClose={() => setEditModal(null)}
                loading={saving}
                C={C}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View entering={FadeInDown.delay(40).duration(350)} style={styles.pageHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="chevron-left" size={28} color={C.tx} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.pageTitle, { color: C.tx }]}>Your Profile</Text>
                        <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>Manage your personal information</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.avatarSection}>
                    <TouchableOpacity onPress={handleAvatarUpload} disabled={avatarUploading}>
                        <Avatar name={displayName} size={100} imageUrl={displayAvatar} />
                        {avatarUploading ? (
                            <View style={[styles.avatarBadge, { backgroundColor: C.s2, borderColor: C.bd }]}>
                                <ActivityIndicator size="small" color={C.primary} />
                            </View>
                        ) : (
                            <View style={[styles.avatarBadge, { backgroundColor: C.primary, borderColor: C.s2 }]}>
                                <Feather name="camera" size={14} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.avatarHint, { color: C.tx3 }]}>Tap to change photo</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(120).duration(350)}>
                    <SectionCard C={C}>
                        <InfoRow
                            icon={<IconUser color={C.primary} size={20} />}
                            label="Full Name"
                            value={displayName !== 'Parent' ? displayName : ''}
                            onPress={() => setEditModal('name')}
                            C={C}
                        />
                        <InfoRow
                            icon={<IconMail color={C.blue} size={20} />}
                            label="Email Address"
                            value={displayEmail}
                            onPress={() => setEditModal('email')}
                            C={C}
                        />
                        <InfoRow
                            icon={<IconPhone color={C.ok} size={20} />}
                            label="Phone Number"
                            value={displayPhone}
                            onPress={handleChangePhone}
                            C={C}
                        />

                        {isPhoneVerified && (
                            <View style={[styles.verifiedRow, { borderTopColor: C.bd }]}>
                                <View style={[styles.verifiedBadge, { backgroundColor: C.okBg }]}>
                                    <Feather name="check-circle" size={14} color={C.ok} />
                                    <Text style={[styles.verifiedText, { color: C.ok }]}>Phone Verified</Text>
                                </View>
                            </View>
                        )}
                    </SectionCard>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.infoBox}>
                    <Feather name="info" size={16} color={C.tx3} />
                    <Text style={[styles.infoText, { color: C.tx3 }]}>
                        Your phone number is used for emergency alerts and account security.
                    </Text>
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
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 4,
    },
    backBtn: { marginLeft: -8, padding: 4 },
    pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
    pageSubtitle: { fontSize: 13 },

    avatarSection: { alignItems: 'center', marginBottom: 8 },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarHint: { fontSize: 12, marginTop: 8, fontWeight: '500' },

    verifiedRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopWidth: 0.5,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    verifiedText: { fontSize: 12, fontWeight: '600' },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 4,
    },
    infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});

