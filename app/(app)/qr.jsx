/**
 * QR Screen — Physical Card Manager
 *
 * No QR code shown — card is physical only.
 * Shows card info, status, actions, and glossary.
 *
 * Store shape fix applied:
 *   uses s.students + s.activeStudentId (not flat keys)
 *
 * Token actions (block/unblock/revoke/activate) are
 * stubbed as no-ops — wire to your API when ready.
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { colors, radius, spacing, typography } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconShield = ({ color = colors.success, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconLock = ({ color = colors.warning, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconUnlock = ({ color = colors.success, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={color} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 019.9-1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconAlertTriangle = ({ color = colors.primary, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconRefresh = ({ color = colors.info, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M23 4v6h-6M1 20v-6h6"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconCheck = ({ color = colors.white, size = 16 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconZap = ({ color = colors.success, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconPhone = ({ color = colors.info, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconInfo = ({ color = colors.textTertiary, size = 14 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
        <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const IconShare = ({ color = colors.textSecondary, size = 18 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const IconCard = ({ color = colors.primary, size = 28 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={1} y={4} width={22} height={16} rx={3} stroke={color} strokeWidth={1.8} />
        <Path d="M1 10h22" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M5 16h4M15 16h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function tokenMeta(status) {
    switch (status) {
        case 'ACTIVE':
            return { label: 'Active', color: colors.success, bg: colors.successBg, desc: 'Card is working normally', pulse: true };
        case 'INACTIVE':
            return { label: 'Blocked', color: colors.warning, bg: colors.warningBg, desc: 'Scanning is temporarily paused', pulse: false };
        case 'ISSUED':
            return { label: 'Not Activated', color: colors.info, bg: colors.infoBg, desc: 'Tap Activate to enable this card', pulse: false };
        case 'REVOKED':
            return { label: 'Reported Lost', color: colors.primary, bg: colors.primaryBg, desc: 'Card is permanently disabled', pulse: false };
        case 'EXPIRED':
            return { label: 'Expired', color: colors.primary, bg: colors.primaryBg, desc: 'Request a replacement from school', pulse: false };
        case 'UNASSIGNED':
            return { label: 'Not Set Up', color: colors.textTertiary, bg: colors.surface3, desc: 'Contact school to set up this card', pulse: false };
        default:
            return { label: status ?? '—', color: colors.textTertiary, bg: colors.surface3, desc: '', pulse: false };
    }
}

// ─── Physical Card Banner ─────────────────────────────────────────────────────
// Replaces QrCard — no QR stored in backend, card is physical PDF only

function PhysicalCardBanner({ student, token, card }) {
    const isExpiringSoon = token?.expires_at &&
        (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;

    const meta = tokenMeta(token?.status ?? 'UNASSIGNED');

    return (
        <View style={styles.physicalCard}>
            {/* Status accent line at top */}
            <View style={[styles.physicalCardAccent, { backgroundColor: meta.color }]} />

            <View style={styles.physicalCardInner}>
                {/* Card icon */}
                <View style={[styles.physicalCardIconWrap, { backgroundColor: `${meta.color}15` }]}>
                    <IconCard color={meta.color} size={26} />
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: spacing[1.5] }}>
                    <Text style={styles.physicalCardTitle}>
                        {student?.first_name
                            ? `${student.first_name}'s Emergency Card`
                            : 'Emergency Card'}
                    </Text>
                    <Text style={styles.physicalCardNumber}>
                        {card?.card_number ?? '—'}
                    </Text>
                    {token?.expires_at && (
                        <Text style={[
                            styles.physicalCardExpiry,
                            isExpiringSoon && { color: colors.warning },
                        ]}>
                            Valid until {fmtDate(token.expires_at)}
                            {isExpiringSoon ? '  ⚠ Expiring soon' : ''}
                        </Text>
                    )}
                </View>
            </View>

            {/* Info note */}
            <View style={styles.physicalCardNote}>
                <IconInfo color={colors.textTertiary} size={13} />
                <Text style={styles.physicalCardNoteText}>
                    Your child carries this card physically. First responders scan it to instantly view emergency info — no app needed.
                </Text>
            </View>
        </View>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ visible, title, body, confirmLabel, confirmColor = colors.primary, onConfirm, onCancel, icon, warning }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={styles.modalOverlay} onPress={onCancel}>
                <Animated.View entering={FadeInUp.duration(280)} style={styles.modalSheet}>
                    <View style={[styles.modalIconWrap, { backgroundColor: `${confirmColor}15` }]}>
                        {icon}
                    </View>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalBody}>{body}</Text>
                    {warning && (
                        <View style={styles.modalWarning}>
                            <IconAlertTriangle color={colors.warning} size={14} />
                            <Text style={styles.modalWarningText}>{warning}</Text>
                        </View>
                    )}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.7}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: confirmColor }]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalConfirmText}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionBtn({ icon, label, sublabel, onPress, color, bg, border, disabled }) {
    return (
        <TouchableOpacity
            style={[
                styles.actionBtn,
                { backgroundColor: bg, borderColor: border ?? colors.border },
                disabled && styles.actionBtnDisabled,
            ]}
            onPress={onPress}
            activeOpacity={disabled ? 1 : 0.75}
            disabled={disabled}
        >
            <View style={[styles.actionBtnIcon, { backgroundColor: `${color}18` }]}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
                {sublabel ? <Text style={styles.actionBtnSublabel}>{sublabel}</Text> : null}
            </View>
        </TouchableOpacity>
    );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value, valueColor, last }) {
    return (
        <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function QrScreen() {
    useScreenSecurity()
    const router = useRouter();

    // ── Fixed store access (uses students array, not flat keys) ──────
    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null
    );

    const student = activeStudent;
    const token = activeStudent?.token ?? null;
    const card = token?.card_number ? { card_number: token.card_number } : null;
    const emergencyProfile = activeStudent?.emergency ?? null;

    // Card actions — not yet wired to API, show informative alert until backend ready
    const _cardActionNotReady = (action) => Alert.alert(
        'Not Available Yet',
        `Card ${action} will be available once connected to your backend. Wire this to profileApi when ready.`,
        [{ text: 'OK' }]
    );
    const blockCard = () => _cardActionNotReady('block');
    const unblockCard = () => _cardActionNotReady('unblock');
    const revokeCard = () => _cardActionNotReady('revoke');
    const activateCard = () => _cardActionNotReady('activate');

    const status = token?.status ?? 'UNASSIGNED';
    const meta = tokenMeta(status);

    // ── Modal states ─────────────────────────────────────────────────
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [actionDone, setActionDone] = useState(null);

    // ── Action handlers ──────────────────────────────────────────────
    const doBlock = async () => {
        setShowBlockConfirm(false);
        await blockCard?.();
        setActionDone('blocked');
        setTimeout(() => setActionDone(null), 3000);
    };

    const doUnblock = async () => {
        setShowUnblockConfirm(false);
        await unblockCard?.();
        setActionDone('unblocked');
        setTimeout(() => setActionDone(null), 3000);
    };

    const doRevoke = async () => {
        setShowRevokeConfirm(false);
        await revokeCard?.();
        setActionDone('revoked');
    };

    const doActivate = async () => {
        setShowActivateConfirm(false);
        await activateCard?.();
        setActionDone('activated');
        setTimeout(() => setActionDone(null), 3000);
    };

    const handleShare = async () => {
        await Share.share({
            message: `${student?.first_name ?? 'Child'}'s emergency card — Card No: ${card?.card_number ?? '—'}. Scan in case of emergency.`,
        });
    };

    // ── Actions by status ────────────────────────────────────────────
    const renderActions = () => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <>
                        <ActionBtn
                            icon={<IconLock color={colors.warning} size={16} />}
                            label="Block Card Temporarily"
                            sublabel="Scanning will be paused until you unblock"
                            color={colors.warning}
                            bg={colors.warningBg}
                            border="rgba(245,158,11,0.25)"
                            onPress={() => setShowBlockConfirm(true)}
                        />
                        <ActionBtn
                            icon={<IconAlertTriangle color={colors.primary} size={16} />}
                            label="Report Card Lost"
                            sublabel="Permanently disables this card — can't be undone"
                            color={colors.primary}
                            bg={colors.primaryBg}
                            border="rgba(232,52,42,0.2)"
                            onPress={() => setShowRevokeConfirm(true)}
                        />
                    </>
                );

            case 'INACTIVE':
                return (
                    <>
                        <ActionBtn
                            icon={<IconUnlock color={colors.success} size={16} />}
                            label="Unblock Card"
                            sublabel="Resume normal scanning"
                            color={colors.success}
                            bg={colors.successBg}
                            border="rgba(22,163,74,0.25)"
                            onPress={() => setShowUnblockConfirm(true)}
                        />
                        <ActionBtn
                            icon={<IconAlertTriangle color={colors.primary} size={16} />}
                            label="Report Card Lost Instead"
                            sublabel="Permanently disables this card — can't be undone"
                            color={colors.primary}
                            bg={colors.primaryBg}
                            border="rgba(232,52,42,0.2)"
                            onPress={() => setShowRevokeConfirm(true)}
                        />
                    </>
                );

            case 'ISSUED':
                return (
                    <ActionBtn
                        icon={<IconZap color={colors.success} size={16} />}
                        label="Activate Card"
                        sublabel="Enable this card so it can be scanned"
                        color={colors.success}
                        bg={colors.successBg}
                        border="rgba(22,163,74,0.25)"
                        onPress={() => setShowActivateConfirm(true)}
                    />
                );

            case 'REVOKED':
            case 'EXPIRED':
                return (
                    <>
                        <View style={styles.revokedNotice}>
                            <IconAlertTriangle color={colors.primary} size={16} />
                            <Text style={styles.revokedNoticeText}>
                                {status === 'REVOKED'
                                    ? 'This card has been permanently disabled. Anyone trying to scan it will see an error.'
                                    : 'This card has expired. It can no longer be scanned.'}
                            </Text>
                        </View>
                        <ActionBtn
                            icon={<IconRefresh color={colors.info} size={16} />}
                            label="Request a Replacement Card"
                            sublabel="Contact your school to get a new physical card"
                            color={colors.info}
                            bg={colors.infoBg}
                            border="rgba(59,130,246,0.25)"
                            onPress={() => router.push('/(app)/support')}
                        />
                        <ActionBtn
                            icon={<IconPhone color={colors.textSecondary} size={16} />}
                            label="Contact School Support"
                            sublabel="We'll help you get sorted"
                            color={colors.textSecondary}
                            bg={colors.surface3}
                            border={colors.border}
                            onPress={() => router.push('/(app)/support')}
                        />
                    </>
                );

            default:
                return (
                    <View style={styles.revokedNotice}>
                        <IconInfo color={colors.textTertiary} size={14} />
                        <Text style={styles.revokedNoticeText}>
                            Contact your school to set up this card.
                        </Text>
                    </View>
                );
        }
    };

    // ── Toast ────────────────────────────────────────────────────────
    const toastMeta = {
        blocked: { label: 'Card blocked — scanning is paused', color: colors.warning, bg: colors.warningBg },
        unblocked: { label: 'Card unblocked — scanning is active', color: colors.success, bg: colors.successBg },
        revoked: { label: 'Card reported lost — permanently locked', color: colors.primary, bg: colors.primaryBg },
        activated: { label: 'Card activated — ready to scan', color: colors.success, bg: colors.successBg },
    };
    const toast = actionDone ? toastMeta[actionDone] : null;

    return (
        <Screen bg={colors.screenBg} scroll edges={['top', 'left', 'right']}>

            {/* ── Confirm modals ── */}
            <ConfirmModal
                visible={showBlockConfirm}
                title="Block Card Temporarily?"
                body={`This will pause all scanning for ${student?.first_name ?? 'your child'}'s card. No one will be able to scan it until you unblock it.`}
                warning="Use this if the card is misplaced but not fully lost."
                confirmLabel="Block Card"
                confirmColor={colors.warning}
                icon={<IconLock color={colors.warning} size={24} />}
                onConfirm={doBlock}
                onCancel={() => setShowBlockConfirm(false)}
            />
            <ConfirmModal
                visible={showUnblockConfirm}
                title="Unblock This Card?"
                body={`This will restore normal scanning for ${student?.first_name ?? 'your child'}'s card immediately.`}
                confirmLabel="Unblock Card"
                confirmColor={colors.success}
                icon={<IconUnlock color={colors.success} size={24} />}
                onConfirm={doUnblock}
                onCancel={() => setShowUnblockConfirm(false)}
            />
            <ConfirmModal
                visible={showRevokeConfirm}
                title="Report Card as Lost?"
                body={`This will permanently disable ${student?.first_name ?? 'your child'}'s card. Anyone who tries to scan it will see that it's been reported lost.`}
                warning="This cannot be undone. You'll need to request a new card from your school."
                confirmLabel="Yes, Report Lost"
                confirmColor={colors.primary}
                icon={<IconAlertTriangle color={colors.primary} size={24} />}
                onConfirm={doRevoke}
                onCancel={() => setShowRevokeConfirm(false)}
            />
            <ConfirmModal
                visible={showActivateConfirm}
                title="Activate This Card?"
                body={`Once activated, ${student?.first_name ?? 'your child'}'s card will be live and can be scanned in an emergency.`}
                confirmLabel="Activate Card"
                confirmColor={colors.success}
                icon={<IconZap color={colors.success} size={24} />}
                onConfirm={doActivate}
                onCancel={() => setShowActivateConfirm(false)}
            />

            <View style={styles.container}>

                {/* ── Header ── */}
                <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pageTitle}>
                            {student?.first_name ? `${student.first_name}'s Card` : 'Emergency Card'}
                        </Text>
                        <Text style={styles.pageSubtitle}>
                            Manage your child's physical emergency card
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                        <IconShare color={colors.textSecondary} size={17} />
                    </TouchableOpacity>
                </Animated.View>

                {/* ── Toast ── */}
                {toast && (
                    <Animated.View
                        entering={FadeInDown.duration(300)}
                        style={[styles.toast, { backgroundColor: toast.bg, borderColor: `${toast.color}30` }]}
                    >
                        <IconCheck color={toast.color} size={14} />
                        <Text style={[styles.toastText, { color: toast.color }]}>{toast.label}</Text>
                    </Animated.View>
                )}

                {/* ── Status pill ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.statusPillRow}>
                    <View style={[styles.statusPill, { backgroundColor: meta.bg, borderColor: `${meta.color}30` }]}>
                        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                        <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={styles.statusDesc}>{meta.desc}</Text>
                </Animated.View>

                {/* ── Physical card banner (replaces QrCard) ── */}
                <Animated.View entering={FadeIn.delay(80).duration(500)}>
                    <PhysicalCardBanner
                        student={student}
                        token={token}
                        card={card}
                    />
                </Animated.View>

                {/* ── Card actions ── */}
                <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.actionsSection}>
                    <Text style={styles.sectionLabel}>Card Actions</Text>
                    <View style={styles.actionsList}>
                        {renderActions()}
                    </View>
                </Animated.View>

                {/* ── Card details ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.detailsCard}>
                    <Text style={styles.sectionLabel}>Card Details</Text>
                    <View style={styles.detailsBlock}>
                        <DetailRow
                            label="Card Number"
                            value={card?.card_number ?? '—'}
                        />
                        <DetailRow
                            label="Student"
                            value={[student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—'}
                        />
                        <DetailRow
                            label="Class"
                            value={student?.class
                                ? `${student.class}${student?.section ? `-${student.section}` : ''}`
                                : '—'}
                        />
                        <DetailRow
                            label="School"
                            value={student?.school?.name ?? '—'}
                        />
                        <DetailRow
                            label="Valid Until"
                            value={fmtDate(token?.expires_at)}
                            valueColor={
                                token?.expires_at &&
                                    (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000
                                    ? colors.warning : undefined
                            }
                        />
                        <DetailRow
                            label="Card Status"
                            value={meta.label}
                            valueColor={meta.color}
                            last
                        />
                    </View>
                </Animated.View>

                {/* ── Safety tip ── */}
                <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.safetyTip}>
                    <IconShield color={colors.success} size={14} />
                    <Text style={styles.safetyTipText}>
                        🔒  This card is unique to your child. The QR on the physical card links directly to their emergency profile — keep it safe.
                    </Text>
                </Animated.View>

                {/* ── Status glossary ── */}
                <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.glossary}>
                    <Text style={styles.glossaryTitle}>What do the statuses mean?</Text>
                    {[
                        { label: 'Active', desc: 'Card works normally. Emergency info shows when scanned.', color: colors.success },
                        { label: 'Blocked', desc: 'Temporarily paused by you. Unblock at any time.', color: colors.warning },
                        { label: 'Lost / Revoked', desc: 'Permanently disabled. Request a replacement from school.', color: colors.primary },
                        { label: 'Expired', desc: 'Card past its valid date. Request renewal from school.', color: colors.primary },
                    ].map((g, i) => (
                        <View key={i} style={[styles.glossaryRow, i < 3 && styles.glossaryRowBorder]}>
                            <View style={[styles.glossaryDot, { backgroundColor: g.color }]} />
                            <Text style={[styles.glossaryLabel, { color: g.color }]}>{g.label}</Text>
                            <Text style={styles.glossaryDesc}>{g.desc}</Text>
                        </View>
                    ))}
                </Animated.View>

            </View>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[10],
        gap: spacing[4],
    },

    // ── Header ────────────────────────────────────────────────────────
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
        flexShrink: 0,
    },

    // ── Toast ─────────────────────────────────────────────────────────
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        borderRadius: radius.cardSm,
        borderWidth: 1,
        padding: spacing[3],
    },
    toastText: {
        ...typography.labelSm,
        fontWeight: '600',
    },

    // ── Status pill ───────────────────────────────────────────────────
    statusPillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1.5],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1.5],
        borderRadius: radius.chipFull,
        borderWidth: 1,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    statusPillText: {
        ...typography.labelSm,
        fontWeight: '700',
    },
    statusDesc: {
        ...typography.labelXs,
        color: colors.textTertiary,
        flex: 1,
    },

    // ── Physical card banner ──────────────────────────────────────────
    physicalCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    physicalCardAccent: {
        height: 3,
        width: '100%',
    },
    physicalCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        padding: spacing[4],
    },
    physicalCardIconWrap: {
        width: 56,
        height: 56,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    physicalCardTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    physicalCardNumber: {
        ...typography.mono,
        color: colors.textSecondary,
        fontSize: 13,
        letterSpacing: 0.5,
    },
    physicalCardExpiry: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
    physicalCardNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
        backgroundColor: colors.surface3,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: spacing[3],
    },
    physicalCardNoteText: {
        ...typography.labelXs,
        color: colors.textTertiary,
        flex: 1,
        lineHeight: 17,
    },

    // ── Section label ─────────────────────────────────────────────────
    sectionLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[2],
        paddingLeft: spacing[0.5],
    },

    // ── Actions ───────────────────────────────────────────────────────
    actionsSection: {
        gap: 0,
    },
    actionsList: {
        gap: spacing[2],
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        borderRadius: radius.cardSm,
        borderWidth: 1,
        padding: spacing[4],
    },
    actionBtnDisabled: {
        opacity: 0.4,
    },
    actionBtnIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionBtnLabel: {
        ...typography.labelLg,
        fontWeight: '700',
    },
    actionBtnSublabel: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 3,
        lineHeight: 15,
    },

    // ── Revoked notice ────────────────────────────────────────────────
    revokedNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2.5],
        backgroundColor: colors.primaryBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(232,52,42,0.2)',
        padding: spacing[3.5],
    },
    revokedNoticeText: {
        ...typography.bodySm,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 18,
    },

    // ── Card details ──────────────────────────────────────────────────
    detailsCard: {
        gap: 0,
    },
    detailsBlock: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    detailRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    detailLabel: {
        ...typography.labelSm,
        color: colors.textTertiary,
    },
    detailValue: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
        maxWidth: '55%',
        textAlign: 'right',
    },

    // ── Safety tip ────────────────────────────────────────────────────
    safetyTip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2.5],
        backgroundColor: colors.successBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        padding: spacing[3.5],
    },
    safetyTipText: {
        ...typography.labelXs,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 16,
    },

    // ── Glossary ──────────────────────────────────────────────────────
    glossary: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        padding: spacing[4],
        gap: spacing[1],
    },
    glossaryTitle: {
        ...typography.overline,
        color: colors.textTertiary,
        marginBottom: spacing[2],
    },
    glossaryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2.5],
        paddingVertical: spacing[2],
    },
    glossaryRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    glossaryDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginTop: 5,
        flexShrink: 0,
    },
    glossaryLabel: {
        ...typography.labelSm,
        fontWeight: '700',
        width: 96,
        flexShrink: 0,
    },
    glossaryDesc: {
        ...typography.labelXs,
        color: colors.textTertiary,
        flex: 1,
        lineHeight: 16,
    },

    // ── Modal ─────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[5],
    },
    modalSheet: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardLg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[6],
        width: '100%',
        gap: spacing[3],
        alignItems: 'center',
    },
    modalIconWrap: {
        width: 60,
        height: 60,
        borderRadius: radius.cardSm,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[1],
    },
    modalTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        textAlign: 'center',
    },
    modalBody: {
        ...typography.bodyMd,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
        backgroundColor: colors.warningBg,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
        padding: spacing[3],
        width: '100%',
    },
    modalWarningText: {
        ...typography.labelXs,
        color: colors.warning,
        flex: 1,
        lineHeight: 16,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing[2],
        width: '100%',
        marginTop: spacing[1],
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: spacing[3.5],
        borderRadius: radius.btn,
        backgroundColor: colors.surface3,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    modalCancelText: {
        ...typography.btnSm,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: spacing[3.5],
        borderRadius: radius.btn,
        alignItems: 'center',
    },
    modalConfirmText: {
        ...typography.btnSm,
        color: colors.white,
        fontWeight: '700',
    },
});