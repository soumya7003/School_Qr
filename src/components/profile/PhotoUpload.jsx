// src/components/profile/PhotoUpload.jsx - FIXED
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraSvg, InfoSvg, UploadSvg, XSvg } from './icons/profile.icon.index';

export function PhotoUpload({ imageUri, onImageChange, uploading, C }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [imageError, setImageError] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        checkPermissions();
    }, []);

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
                { text: 'Settings', onPress: () => Linking.openSettings?.() }
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
                { text: 'Settings', onPress: () => Linking.openSettings?.() }
            ]);
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestLibraryPermission();
        if (!hasPermission) return;
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
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
    };

    const takePhoto = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) return;
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
        } catch (error) {
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
                    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
                        .start(() => {
                            onImageChange(null);
                            fadeAnim.setValue(1);
                        });
                }
            },
        ]);
    };

    const handleImageError = () => {
        setImageError(true);
        console.log('[PhotoUpload] Image failed to load:', imageUri);
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: C.tx3 }]}>PROFILE PHOTO</Text>
            <View style={styles.content}>
                <Animated.View style={[styles.previewContainer, { opacity: fadeAnim }]}>
                    {imageUri && !imageError ? (
                        <View style={styles.previewWrapper}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.preview}
                                onError={handleImageError}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                style={[styles.removeBtn, { backgroundColor: C.red, borderColor: '#fff' }]}
                                onPress={handleRemove}
                                disabled={uploading}
                            >
                                <XSvg c="#fff" s={12} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: C.s3, borderColor: C.bd2 }]}>
                            <View style={[styles.placeholderIcon, { backgroundColor: C.primaryBg }]}>
                                <CameraSvg c={C.primary} s={28} />
                            </View>
                            <Text style={[styles.placeholderText, { color: C.tx3 }]}>
                                {imageError ? 'Failed to load image' : 'No photo uploaded'}
                            </Text>
                        </View>
                    )}
                </Animated.View>
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
                    <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                        <ActivityIndicator size="small" color="#fff" />
                    </View>
                )}
            </View>
            <View style={[styles.hint, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                <InfoSvg c={C.blue} s={12} />
                <Text style={[styles.hintText, { color: C.blue }]}>
                    A clear, recent photo helps first responders identify your child quickly.
                </Text>
            </View>
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
        borderColor: '#fff',
        backgroundColor: '#f0f0f0', // ✅ Added background color
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
        justifyContent: 'center'
    },
    placeholderText: { fontSize: 11, fontWeight: '500' },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 12
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1
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
        borderRadius: 60,
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 8
    },
    hintText: { fontSize: 11, flex: 1, lineHeight: 16 },
});