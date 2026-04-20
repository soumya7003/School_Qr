/**
 * QrCard — Full student QR card display.
 * Shows student info + QR code + blood group chip.
 * Used on the QR screen (full screen) and as a preview elsewhere.
 */

import Badge from '@/components/common/Badge';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QrCard({ student, token, emergencyProfile, compact = false }) {
    const fullName = `${student?.first_name ?? ''} ${student?.last_name ?? ''}`.trim();
    const initials = (student?.first_name?.[0] ?? '') + (student?.last_name?.[0] ?? '');
    const classLabel = student?.class
        ? `Class ${student.class}${student.section ? `-${student.section}` : ''}`
        : '';
    const schoolName = student?.school?.name ?? '';
    const tokenHash = token?.token_hash ?? 'SQ-0000-000000';
    const bloodGroup = emergencyProfile?.blood_group;

    // QR value encodes the token hash — this is what scanners read
    const qrValue = `schoolqr://scan/${tokenHash}`;

    return (
        <View style={[styles.card, compact && styles.cardCompact, shadows.xl]}>
            {/* Top accent */}
            <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accent}
            />

            <View style={[styles.inner, compact && styles.innerCompact]}>
                {/* Header row */}
                <View style={styles.header}>
                    {/* Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.initials}>{initials.toUpperCase()}</Text>
                    </View>

                    {/* Student info */}
                    <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>{fullName}</Text>
                        <Text style={styles.meta}>{classLabel}</Text>
                        <Text style={styles.school} numberOfLines={1}>{schoolName}</Text>
                    </View>

                    {/* Blood group chip */}
                    {bloodGroup && (
                        <View style={styles.bloodChip}>
                            <Text style={styles.bloodText}>{bloodGroup}</Text>
                        </View>
                    )}
                </View>

                {/* QR Code */}
                <View style={styles.qrWrap}>
                    <View style={styles.qrInner}>
                        <QRCode
                            value={qrValue}
                            size={compact ? 120 : 160}
                            backgroundColor="transparent"
                            color={colors.textPrimary}
                            quietZone={compact ? 6 : 10}
                        />
                    </View>
                </View>

                {/* Card number + status */}
                <View style={styles.footer}>
                    <View>
                        <Text style={styles.cardNumLabel}>CARD NUMBER</Text>
                        <Text style={styles.cardNum}>{tokenHash}</Text>
                    </View>
                    <Badge status={token?.status ?? 'INACTIVE'} size="sm" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface2,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    cardCompact: {
        borderRadius: radius.card,
    },
    accent: {
        height: 4,
    },
    inner: {
        padding: spacing[5],
        gap: spacing[5],
    },
    innerCompact: {
        padding: spacing[4],
        gap: spacing[4],
    },

    // ── Header ────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: radius.avatar,
        backgroundColor: colors.surface3,
        borderWidth: 1.5,
        borderColor: colors.primaryBg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    initials: {
        ...typography.h4,
        color: colors.primary,
    },
    info: {
        flex: 1,
        gap: 2,
    },
    name: {
        ...typography.h4,
        color: colors.textPrimary,
    },
    meta: {
        ...typography.labelMd,
        color: colors.textSecondary,
    },
    school: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },
    bloodChip: {
        backgroundColor: colors.primaryBg,
        borderRadius: radius.chip,
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[0.5] + 1,
        borderWidth: 1,
        borderColor: colors.primaryBgSoft,
        alignSelf: 'flex-start',
    },
    bloodText: {
        ...typography.labelSm,
        color: colors.primary,
        fontWeight: '700',
    },

    // ── QR ───────────────────────────────────────
    qrWrap: {
        alignItems: 'center',
    },
    qrInner: {
        padding: spacing[4],
        backgroundColor: colors.surface3,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
    },

    // ── Footer ───────────────────────────────────
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardNumLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: 2,
    },
    cardNum: {
        ...typography.mono,
        color: colors.textPrimary,
        fontWeight: '600',
        letterSpacing: 1.5,
    },
});
