/**
 * QR Screen — Full-screen student QR card with activate/deactivate toggle.
 */

import Badge from '@/src/components/common/Badge';
import Screen from '@/src/components/common/Screen';
import QrCard from '@/src/components/qr/QrCard';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const ShareIcon = () => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
            stroke={colors.textSecondary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default function QrScreen() {
    const { student, emergencyProfile, token, toggleCardStatus } = useProfileStore();
    const isActive = token?.status === 'ACTIVE';

    const handleShare = async () => {
        await Share.share({ message: `My child's SchoolQR card: ${token?.token_hash}` });
    };

    return (
        <Screen bg={colors.screenBg} scroll edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
                    <View>
                        <Text style={styles.pageTitle}>Student Card</Text>
                        <Text style={styles.pageSubtitle}>Show this to any scanner</Text>
                    </View>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                        <ShareIcon />
                    </TouchableOpacity>
                </Animated.View>

                {/* QR Card */}
                <Animated.View entering={FadeIn.delay(150).duration(500)}>
                    <QrCard
                        student={student}
                        token={token}
                        emergencyProfile={emergencyProfile}
                    />
                </Animated.View>

                {/* Status row */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusLabel}>Card Status</Text>
                        <Badge status={token?.status ?? 'INACTIVE'} />
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                        onPress={toggleCardStatus}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}>
                            {isActive ? 'Deactivate' : 'Activate'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Info strip */}
                <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.infoStrip}>
                    <Text style={styles.infoText}>
                        🔒  This QR code is tied to your child's identity. Only share with trusted school staff.
                    </Text>
                </Animated.View>

                {/* Expiry */}
                {token?.expires_at && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.expiryRow}>
                        <Text style={styles.expiryLabel}>Valid until</Text>
                        <Text style={styles.expiryVal}>
                            {new Date(token.expires_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </Text>
                    </Animated.View>
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[8],
        gap: spacing[4],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    pageTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.bodySm,
        color: colors.textTertiary,
        marginTop: 2,
    },
    shareBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Status ────────────────────────────────────
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
    },
    statusLeft: {
        gap: spacing[1.5],
    },
    statusLabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
    toggleBtn: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radius.btnSm,
        backgroundColor: colors.surface3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleBtnActive: {
        backgroundColor: colors.primaryBg,
        borderColor: `rgba(232,52,42,0.3)`,
    },
    toggleBtnText: {
        ...typography.btnSm,
        color: colors.textSecondary,
    },
    toggleBtnTextActive: {
        color: colors.primary,
    },

    // ── Info strip ────────────────────────────────
    infoStrip: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3.5],
    },
    infoText: {
        ...typography.bodySm,
        color: colors.textSecondary,
        lineHeight: 18,
    },

    // ── Expiry ────────────────────────────────────
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[1],
    },
    expiryLabel: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },
    expiryVal: {
        ...typography.labelMd,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});