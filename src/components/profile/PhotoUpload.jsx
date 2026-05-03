// src/components/profile/PhotoUpload.jsx - FIXED
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Linking,
    Modal,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CameraSvg, InfoSvg, UploadSvg, XSvg } from './icons/profile.icon.index';

export function PhotoUpload({ imageUri, onImageChange, uploading, C }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const viewerScale = useRef(new Animated.Value(0.88)).current;
    const viewerOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        checkPermissions();
    }, []);

    // Reset image error when URI changes
    useEffect(() => {
        setImageError(false);
    }, [imageUri]);

    const checkPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.getCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
        setHasPermission({
            camera: cameraStatus === 'granted',
            library: libraryStatus === 'granted',
        });
    };

    const requestLibraryPermission = async () => {
        if (hasPermission?.library) return true;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasPermission(prev => ({ ...prev, library: status === 'granted' }));
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => Linking.openSettings?.() },
            ]);
            return false;
        }
        return true;
    };

    const requestCameraPermission = async () => {
        if (hasPermission?.camera) return true;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasPermission(prev => ({ ...prev, camera: status === 'granted' }));
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => Linking.openSettings?.() },
            ]);
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const granted = await requestLibraryPermission();
        if (!granted) return;
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                allowsMultipleSelection: false,
                base64: false,
            });
            if (!result.canceled && result.assets[0]) {
                setImageError(false);
                Animated.sequence([
                    Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
                    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();
                onImageChange(result.assets[0].uri);
            }
        } catch {
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const takePhoto = async () => {
        const granted = await requestCameraPermission();
        if (!granted) return;
        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: false,
            });
            if (!result.canceled && result.assets[0]) {
                setImageError(false);
                Animated.sequence([
                    Animated.timing(fadeAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
                    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                ]).start();
                onImageChange(result.assets[0].uri);
            }
        } catch {
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    const handleRemove = () => {
        Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                        onImageChange(null);
                        fadeAnim.setValue(1);
                    });
                },
            },
        ]);
    };

    const openViewer = () => {
        setViewerVisible(true);
        viewerScale.setValue(0.88);
        viewerOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(viewerScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
            Animated.timing(viewerOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
    };

    const closeViewer = () => {
        Animated.parallel([
            Animated.timing(viewerScale, { toValue: 0.88, duration: 180, useNativeDriver: true }),
            Animated.timing(viewerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => setViewerVisible(false));
    };

    const hasPhoto = imageUri && !imageError;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: C.tx3 }]}>PROFILE PHOTO</Text>

            <View style={styles.content}>
                <Animated.View style={[styles.previewContainer, { opacity: fadeAnim }]}>
                    {hasPhoto ? (
                        /* ── Photo exists ── */
                        <View style={styles.previewWrapper}>
                            {/* Tap to view full screen */}
                            <TouchableOpacity
                                onPress={openViewer}
                                activeOpacity={0.85}
                                disabled={uploading}
                            >
                                <Image
                                    source={{ uri: imageUri }}
                                    style={[styles.preview, { borderColor: C.primaryBd || '#fff' }]}
                                    onError={() => setImageError(true)}
                                    resizeMode="cover"
                                />
                                {/* Tap hint overlay */}
                                <View style={styles.tapHint}>
                                    <Text style={styles.tapHintText}>Tap to view</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Remove button */}
                            <TouchableOpacity
                                style={[styles.removeBtn, { backgroundColor: C.red, borderColor: '#fff' }]}
                                onPress={handleRemove}
                                disabled={uploading}
                            >
                                <XSvg c="#fff" s={12} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* ── No photo / error ── */
                        <View style={[styles.placeholder, { backgroundColor: C.s3, borderColor: C.bd2 }]}>
                            <View style={[styles.placeholderIcon, { backgroundColor: C.primaryBg }]}>
                                <CameraSvg c={C.primary} s={28} />
                            </View>
                            <Text style={[styles.placeholderText, { color: C.tx2 }]}>
                                {imageError ? 'Failed to load' : 'No photo yet'}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Action buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
                        onPress={takePhoto}
                        disabled={uploading}
                        activeOpacity={0.7}
                    >
                        <CameraSvg c={C.primary} s={16} />
                        <Text style={[styles.actionText, { color: C.primary }]}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}
                        onPress={pickImage}
                        disabled={uploading}
                        activeOpacity={0.7}
                    >
                        <UploadSvg c={C.primary} s={16} />
                        <Text style={[styles.actionText, { color: C.primary }]}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                {uploading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.uploadingText}>Uploading…</Text>
                    </View>
                )}
            </View>

            {/* Hint */}
            <View style={[styles.hint, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                <InfoSvg c={C.blue} s={12} />
                <Text style={[styles.hintText, { color: C.blue }]}>
                    A clear, recent photo helps first responders identify your child quickly.
                </Text>
            </View>

            {/* ── Full-screen photo viewer (WhatsApp-style) ── */}
            <Modal
                visible={viewerVisible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeViewer}
            >
                <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
                <Pressable style={styles.viewerBackdrop} onPress={closeViewer}>
                    <Animated.View
                        style={[
                            styles.viewerInner,
                            { opacity: viewerOpacity, transform: [{ scale: viewerScale }] },
                        ]}
                    >
                        {/* Close button */}
                        <TouchableOpacity style={styles.viewerClose} onPress={closeViewer}>
                            <XSvg c="#fff" s={18} />
                        </TouchableOpacity>

                        {/* Full photo — stop propagation so tap on photo doesn't close */}
                        <Pressable onPress={e => e.stopPropagation()}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.viewerImage}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 8 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

    content: { position: 'relative' },
    previewContainer: { alignItems: 'center' },
    previewWrapper: { position: 'relative' },

    preview: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        backgroundColor: '#1a1a2e',
    },

    // "Tap to view" subtle hint at bottom of avatar
    tapHint: {
        position: 'absolute',
        bottom: 6,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tapHintText: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.4,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },

    removeBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    placeholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    placeholderIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // ✅ Use tx2 (not tx3) so it's visible against any bg
    placeholderText: { fontSize: 11, fontWeight: '500' },

    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    actionText: { fontSize: 13, fontWeight: '600' },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 60,
        gap: 6,
    },
    uploadingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8,
    },
    hintText: { fontSize: 11, flex: 1, lineHeight: 16 },

    // ── Viewer ──────────────────────────────────────────
    viewerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewerInner: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    viewerClose: {
        position: 'absolute',
        top: -60,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    viewerImage: {
        width: 320,
        height: 320,
        borderRadius: 16,
    },
});