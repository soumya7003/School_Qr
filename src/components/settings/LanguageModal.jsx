/**
 * LanguageModal — Bottom sheet language picker.
 * Calls changeLanguage() from i18n which persists to AsyncStorage.
 * All screens using useTranslation() re-render automatically.
 */

import { CheckIcon } from '@/components/icon/AllIcon';
import { LANGUAGES } from '@/constants/constants';
import { changeLanguage } from '@/i18n';
import { colors, radius, spacing, typography } from '@/theme';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageModal({ visible, onClose }) {
    const { i18n } = useTranslation();

    const handleSelect = async (code) => {
        await changeLanguage(code);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.sheet}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>भाषा चुनें / Select Language</Text>

                    {LANGUAGES.map((lang, i) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.row,
                                i === LANGUAGES.length - 1 && styles.rowLast,
                            ]}
                            onPress={() => handleSelect(lang.code)}
                            activeOpacity={0.7}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.native}>{lang.native}</Text>
                                <Text style={styles.label}>{lang.label}</Text>
                            </View>
                            {i18n.language === lang.code && <CheckIcon />}
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.cardLg,
        borderTopRightRadius: radius.cardLg,
        padding: spacing[5],
        paddingBottom: spacing[8],
        gap: spacing[1],
    },
    handle: {
        width: 36, height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing[4],
    },
    title: {
        ...typography.h4,
        color: colors.textPrimary,
        marginBottom: spacing[3],
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    native: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    label: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },
});