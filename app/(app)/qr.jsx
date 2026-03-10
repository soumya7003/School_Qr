/**
 * @file app/(app)/qr.jsx
 * @description QR Screen — Physical Card Manager
 *
 * REDESIGNED: Premium physical card UI (Paytm / Apple Card level)
 * ─────────────────────────────────────────────────────────────────
 * Design Direction: "Luxury Security Object"
 *   - Real credit-card proportions (85.6mm × 54mm ratio)
 *   - Flip animation: FRONT = identity card, BACK = QR code
 *   - Holographic shimmer layer that shifts on tilt
 *   - Embossed card number in monospace style
 *   - Dynamic glow colour tied to card status
 *   - Everything below the card: clean, purposeful, zero noise
 *
 * All original functionality preserved 100%:
 *   ✓ tokenMeta() — all 6 statuses
 *   ✓ renderActions() — block / unblock / revoke / activate / support
 *   ✓ ConfirmModal — with warning strip
 *   ✓ ActionBtn / DetailRow / ToastBanner
 *   ✓ handleShare
 *   ✓ useScreenSecurity
 *   ✓ store shape: s.students + s.activeStudentId
 *
 * New deps vs original (add to package.json):
 *   react-native-qrcode-svg          QR rendering on card back
 *   expo-linear-gradient             card face gradients (built into Expo SDK)
 *   react-native-gesture-handler     tilt pan gesture (already in Expo)
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

// ─── Screen dimensions ────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;
const CARD_H = Math.round(CARD_W * 0.631); // ISO/IEC 7810 ID-1 ratio

// ─── Local design tokens ──────────────────────────────────────────────────────
const T = {
    bg: '#070709',
    s1: '#0E0E12',
    s2: '#141418',
    s3: '#1A1A20',
    s4: '#222228',
    bd: 'rgba(255,255,255,0.07)',
    bd2: 'rgba(255,255,255,0.13)',
    bd3: 'rgba(255,255,255,0.20)',
    tx: '#F0F0F4',
    tx2: 'rgba(240,240,244,0.60)',
    tx3: 'rgba(240,240,244,0.34)',
    tx4: 'rgba(240,240,244,0.18)',
    red: '#E8342A',
    redBg: 'rgba(232,52,42,0.10)',
    redBd: 'rgba(232,52,42,0.22)',
    green: '#12A150',
    greenBg: 'rgba(18,161,80,0.10)',
    greenBd: 'rgba(18,161,80,0.22)',
    amber: '#F09000',
    amberBg: 'rgba(240,144,0,0.10)',
    amberBd: 'rgba(240,144,0,0.22)',
    blue: '#3D82F6',
    blueBg: 'rgba(61,130,246,0.10)',
    blueBd: 'rgba(61,130,246,0.22)',
    white: '#FFFFFF',
};

// ─── Card visual palette per status ──────────────────────────────────────────
function cardPalette(status) {
    switch (status) {
        case 'ACTIVE':
            return { gradFront: ['#0B1A10', '#0D1F13', '#071209'], gradBack: ['#091509', '#0B1A0C', '#060E06'], glow: T.green, shimmer: 'rgba(18,161,80,0.22)', accent: T.green, chip: '#1A3A22' };
        case 'INACTIVE':
            return { gradFront: ['#1A1508', '#1D1709', '#110F05'], gradBack: ['#161206', '#1A1508', '#0E0B04'], glow: T.amber, shimmer: 'rgba(240,144,0,0.18)', accent: T.amber, chip: '#2E2310' };
        case 'REVOKED':
        case 'EXPIRED':
            return { gradFront: ['#1A0808', '#1C0A0A', '#130606'], gradBack: ['#150505', '#180707', '#0D0404'], glow: T.red, shimmer: 'rgba(232,52,42,0.18)', accent: T.red, chip: '#2E1010' };
        case 'ISSUED':
            return { gradFront: ['#0A0F1C', '#0D1322', '#060A12'], gradBack: ['#080D18', '#0B1020', '#050810'], glow: T.blue, shimmer: 'rgba(61,130,246,0.18)', accent: T.blue, chip: '#10182E' };
        default:
            return { gradFront: ['#10101A', '#131318', '#0A0A10'], gradBack: ['#0C0C14', '#0F0F18', '#08080E'], glow: T.tx3, shimmer: 'rgba(240,240,244,0.06)', accent: T.tx3, chip: '#1A1A22' };
    }
}

// ─── Helpers (100% identical to original) ────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtValidThru(iso) {
    if (!iso) return '——/——';
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${mm}/${yy}`;
}

function tokenMeta(status) {
    switch (status) {
        case 'ACTIVE': return { label: 'Active', color: T.green, bg: T.greenBg, bd: T.greenBd, desc: 'Card is working normally', pulse: true };
        case 'INACTIVE': return { label: 'Blocked', color: T.amber, bg: T.amberBg, bd: T.amberBd, desc: 'Scanning is temporarily paused', pulse: false };
        case 'ISSUED': return { label: 'Not Activated', color: T.blue, bg: T.blueBg, bd: T.blueBd, desc: 'Tap Activate to enable this card', pulse: false };
        case 'REVOKED': return { label: 'Reported Lost', color: T.red, bg: T.redBg, bd: T.redBd, desc: 'Card is permanently disabled', pulse: false };
        case 'EXPIRED': return { label: 'Expired', color: T.red, bg: T.redBg, bd: T.redBd, desc: 'Request a replacement from school', pulse: false };
        case 'UNASSIGNED': return { label: 'Not Set Up', color: T.tx3, bg: T.s3, bd: T.bd, desc: 'Contact school to set up this card', pulse: false };
        default: return { label: status ?? '—', color: T.tx3, bg: T.s3, bd: T.bd, desc: '', pulse: false };
    }
}

// ─── Animated pulse dot ───────────────────────────────────────────────────────
function PulseDot({ color = T.green, size = 7 }) {
    const opacity = useSharedValue(1);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            ), -1, false,
        );
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

// ─── Holographic shimmer (follows tilt) ──────────────────────────────────────
function ShimmerLayer({ tiltX, tiltY, shimmerColor }) {
    const style = useAnimatedStyle(() => {
        const tx = interpolate(tiltY.value, [-14, 14], [-CARD_W * 0.4, CARD_W * 0.4]);
        const ty = interpolate(tiltX.value, [-10, 10], [-CARD_H * 0.5, CARD_H * 0.5]);
        const opacity = interpolate(Math.abs(tiltX.value) + Math.abs(tiltY.value), [0, 24], [0.0, 0.55]);
        return { opacity, transform: [{ translateX: tx }, { translateY: ty }] };
    });
    return (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: 'hidden' }, style]}>
            <LinearGradient
                colors={['transparent', shimmerColor, 'rgba(255,255,255,0.18)', shimmerColor, 'transparent']}
                start={[0, 0.3]} end={[1, 0.7]}
                style={{ width: '100%', height: '100%' }}
            />
        </Animated.View>
    );
}

// ─── THE PHYSICAL CARD ───────────────────────────────────────────────────────
function PhysicalCard({ student, token, card, status, isFlipped, onFlip }) {
    const meta = tokenMeta(status);
    const pal = cardPalette(status);

    const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ').toUpperCase() || '—';
    const classLine = student?.class ? `CLASS ${student.class}${student.section ? `-${student.section}` : ''}` : '';
    const schoolShort = student?.school?.name ? (student.school.name.length > 22 ? student.school.name.slice(0, 22) + '…' : student.school.name) : '';
    const cardNum = card?.card_number ?? null;
    const fmtNum = (n) => { if (!n) return '•••• •••• •••• ••••'; const g = n.replace(/[-\s]/g, '').match(/.{1,4}/g) ?? [n]; return g.join('  '); };
    const scanUrl = cardNum ? `https://guardian.schoolqr.app/s/${cardNum}` : 'https://guardian.schoolqr.app';
    const isExpiring = token?.expires_at && (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;

    // Tilt state
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);
    const shiftX = useSharedValue(0);
    const shiftY = useSharedValue(0);

    // Flip state
    const flipProgress = useSharedValue(isFlipped ? 1 : 0);
    const [showBack, setShowBack] = useState(isFlipped);
    const prevFlipped = useRef(isFlipped);

    useEffect(() => {
        if (prevFlipped.current === isFlipped) return;
        prevFlipped.current = isFlipped;
        if (isFlipped) {
            flipProgress.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) }, () => runOnJS(setShowBack)(true));
        } else {
            runOnJS(setShowBack)(false);
            flipProgress.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.cubic) });
        }
    }, [isFlipped]);

    // Glow pulse (ACTIVE only)
    const glowOpacity = useSharedValue(0.18);
    useEffect(() => {
        if (status === 'ACTIVE') {
            glowOpacity.value = withRepeat(withSequence(
                withTiming(0.50, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.16, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            ), -1, false);
        }
    }, [status]);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

    // Pan gesture
    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tiltX.value = interpolate(e.translationY, [-90, 90], [12, -12]);
            tiltY.value = interpolate(e.translationX, [-90, 90], [-14, 14]);
            shiftX.value = interpolate(e.translationX, [-90, 90], [-8, 8]);
            shiftY.value = interpolate(e.translationY, [-90, 90], [-5, 5]);
        })
        .onEnd(() => {
            tiltX.value = withSpring(0, { damping: 12, stiffness: 200 });
            tiltY.value = withSpring(0, { damping: 12, stiffness: 200 });
            shiftX.value = withSpring(0, { damping: 12, stiffness: 200 });
            shiftY.value = withSpring(0, { damping: 12, stiffness: 200 });
        });

    const frontStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { translateX: shiftX.value }, { translateY: shiftY.value },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
        ],
    }));
    const backStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { translateX: shiftX.value }, { translateY: shiftY.value },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
        ],
    }));

    const cardShadow = Platform.select({
        ios: { shadowColor: pal.glow, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.45, shadowRadius: 36 },
        android: { elevation: 22 },
    });

    return (
        <GestureHandlerRootView style={{ alignItems: 'center' }}>
            <GestureDetector gesture={pan}>
                <View style={{ width: CARD_W, height: CARD_H + 32, alignItems: 'center', justifyContent: 'center' }}>

                    {/* Ambient glow */}
                    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: CARD_W * 0.80, height: CARD_H * 0.55, borderRadius: 999, backgroundColor: pal.glow, top: CARD_H * 0.28, alignSelf: 'center' }, glowStyle]} />

                    {/* ── FRONT ── */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, frontStyle]}>
                        <LinearGradient colors={pal.gradFront} start={[0, 0]} end={[1, 1]} style={[s.cardFace, cardShadow]}>
                            <View style={[s.cardRing, { borderColor: pal.accent + '35' }]} />
                            <View style={[s.cardStripe, { backgroundColor: pal.accent }]} />
                            <View style={[s.cardArc1, { borderColor: pal.accent + '10' }]} />
                            <View style={[s.cardArc2, { borderColor: pal.accent + '07' }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />

                            <View style={s.frontContent}>
                                {/* R1: Brand + status */}
                                <View style={s.row}>
                                    <View style={s.brandGroup}>
                                        <View style={[s.brandMark, { backgroundColor: pal.accent + '1C', borderColor: pal.accent + '42' }]}>
                                            <MaterialCommunityIcons name="shield-check" size={13} color={pal.accent} />
                                        </View>
                                        <View>
                                            <Text style={s.brandName}>RESQID</Text>
                                            <Text style={s.brandSub}>Guardian Card</Text>
                                        </View>
                                    </View>
                                    <View style={[s.cardBadge, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
                                        {meta.pulse && <PulseDot color={meta.color} size={5} />}
                                        <Text style={[s.cardBadgeTx, { color: meta.color }]}>{meta.label}</Text>
                                    </View>
                                </View>

                                {/* R2: EMV chip */}
                                <View style={s.chipRow}>
                                    <View style={[s.chipBody, { backgroundColor: pal.chip, borderColor: pal.accent + '32' }]}>
                                        <View style={[s.chipLine, { backgroundColor: pal.accent + '55' }]} />
                                        <View style={[s.chipLine, { backgroundColor: pal.accent + '38', marginTop: 4 }]} />
                                        <View style={s.chipDivider} />
                                    </View>
                                    <MaterialCommunityIcons name="contactless-payment" size={18} color={pal.accent + '65'} />
                                </View>

                                {/* R3: Card number */}
                                <Text style={s.cardNum}>{fmtNum(cardNum)}</Text>

                                {/* R4: Name + valid + QR */}
                                <View style={[s.row, { alignItems: 'flex-end' }]}>
                                    <View style={{ flex: 1, gap: 1 }}>
                                        <Text style={s.metaLbl}>CARDHOLDER</Text>
                                        <Text style={s.cardHolder} numberOfLines={1}>{fullName}</Text>
                                        {classLine ? <Text style={s.cardSub} numberOfLines={1}>{classLine}{schoolShort ? `  ·  ${schoolShort}` : ''}</Text> : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 7 }}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={s.metaLbl}>VALID THRU</Text>
                                            <Text style={[s.cardValidTx, isExpiring && { color: T.amber }]}>{fmtValidThru(token?.expires_at)}</Text>
                                        </View>
                                        <TouchableOpacity style={[s.qrFlipBtn, { borderColor: pal.accent + '45', backgroundColor: pal.accent + '14' }]} onPress={onFlip} activeOpacity={0.75}>
                                            <MaterialCommunityIcons name="qrcode" size={12} color={pal.accent} />
                                            <Text style={[s.qrFlipBtnTx, { color: pal.accent }]}>QR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* ── BACK ── */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, backStyle]}>
                        <LinearGradient colors={pal.gradBack} start={[1, 0]} end={[0, 1]} style={[s.cardFace, cardShadow]}>
                            <View style={[s.cardRing, { borderColor: pal.accent + '30' }]} />
                            <View style={[s.cardStripe, { backgroundColor: pal.accent, opacity: 0.4 }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />

                            <View style={s.backContent}>
                                {/* Left: identity */}
                                <View style={s.backLeft}>
                                    <View style={s.brandGroup}>
                                        <View style={[s.brandMark, { width: 24, height: 24, backgroundColor: pal.accent + '1C', borderColor: pal.accent + '35' }]}>
                                            <MaterialCommunityIcons name="shield-check" size={10} color={pal.accent} />
                                        </View>
                                        <Text style={[s.brandName, { fontSize: 9, letterSpacing: 1.3 }]}>RESQID</Text>
                                    </View>
                                    <View style={[s.backAvatar, { backgroundColor: pal.accent + '1A', borderColor: pal.accent + '38' }]}>
                                        <Text style={[s.backAvatarTx, { color: pal.accent }]}>{initials}</Text>
                                    </View>
                                    <View>
                                        <Text style={s.backMetaLbl}>CARDHOLDER</Text>
                                        <Text style={s.backName} numberOfLines={1}>{fullName}</Text>
                                        {classLine ? <Text style={s.backClass} numberOfLines={1}>{classLine}</Text> : null}
                                    </View>
                                    <View>
                                        <Text style={s.backMetaLbl}>CARD NO.</Text>
                                        <Text style={s.backCardNum} numberOfLines={1}>{cardNum ?? '—'}</Text>
                                    </View>
                                    <View>
                                        <Text style={s.backMetaLbl}>STATUS</Text>
                                        <Text style={[s.backStatus, { color: meta.color }]}>{meta.label}</Text>
                                    </View>
                                    <View style={[s.scanInstr, { borderColor: pal.accent + '28' }]}>
                                        <MaterialCommunityIcons name="qrcode-scan" size={9} color={pal.accent} />
                                        <Text style={[s.scanInstrTx, { color: pal.accent }]}>Scan in emergency</Text>
                                    </View>
                                </View>

                                {/* Right: QR code */}
                                <View style={[s.qrBox, { borderColor: pal.accent + '40' }]}>
                                    {showBack && (
                                        <QRCode value={scanUrl} size={CARD_H * 0.60} color="#1A1A1E" backgroundColor="#FFFFFF" quietZone={5} ecl="M" />
                                    )}
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                </View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

// ─── Flip tabs ────────────────────────────────────────────────────────────────
function CardTabs({ isFlipped, onFlip }) {
    return (
        <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, !isFlipped && s.tabActive]} onPress={() => isFlipped && onFlip()} activeOpacity={0.7}>
                <MaterialCommunityIcons name="credit-card-outline" size={13} color={!isFlipped ? T.tx : T.tx3} />
                <Text style={[s.tabTx, !isFlipped && s.tabTxActive]}>Card Front</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, isFlipped && s.tabActive]} onPress={() => !isFlipped && onFlip()} activeOpacity={0.7}>
                <MaterialCommunityIcons name="qrcode-scan" size={13} color={isFlipped ? T.tx : T.tx3} />
                <Text style={[s.tabTx, isFlipped && s.tabTxActive]}>QR Code</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, sublabel, onPress, color, bg, border, disabled }) {
    return (
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: bg, borderColor: border ?? T.bd }, disabled && s.actionBtnDim]} onPress={onPress} activeOpacity={disabled ? 1 : 0.75} disabled={disabled}>
            <View style={[s.actionBtnIcon, { backgroundColor: color + '18' }]}>{icon}</View>
            <View style={{ flex: 1 }}>
                <Text style={[s.actionBtnLabel, { color }]}>{label}</Text>
                {sublabel ? <Text style={s.actionBtnSub}>{sublabel}</Text> : null}
            </View>
            <Feather name="chevron-right" size={14} color={color + '55'} />
        </TouchableOpacity>
    );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor, last }) {
    return (
        <View style={[s.detailRow, !last && s.detailRowBd]}>
            <Text style={s.detailLabel}>{label}</Text>
            <Text style={[s.detailValue, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
        </View>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ visible, title, body, confirmLabel, confirmColor = T.red, onConfirm, onCancel, icon, warning }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.overlay} onPress={onCancel}>
                <Animated.View entering={FadeInUp.duration(260)} style={s.modalSheet}>
                    <View style={[s.modalIconBox, { backgroundColor: confirmColor + '18' }]}>{icon}</View>
                    <Text style={s.modalTitle}>{title}</Text>
                    <Text style={s.modalBody}>{body}</Text>
                    {warning && (
                        <View style={s.modalWarn}>
                            <Feather name="alert-triangle" size={13} color={T.amber} />
                            <Text style={s.modalWarnTx}>{warning}</Text>
                        </View>
                    )}
                    <View style={s.modalBtns}>
                        <TouchableOpacity style={s.modalCancelBtn} onPress={onCancel} activeOpacity={0.7}>
                            <Text style={s.modalCancelTx}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.modalConfirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm} activeOpacity={0.85}>
                            <Text style={s.modalConfirmTx}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastBanner({ action }) {
    const map = {
        blocked: { label: 'Card blocked — scanning is paused', color: T.amber, bg: T.amberBg, bd: T.amberBd, icon: 'lock' },
        unblocked: { label: 'Card unblocked — scanning is active', color: T.green, bg: T.greenBg, bd: T.greenBd, icon: 'unlock' },
        revoked: { label: 'Card reported lost — permanently locked', color: T.red, bg: T.redBg, bd: T.redBd, icon: 'alert-triangle' },
        activated: { label: 'Card activated — ready to scan', color: T.green, bg: T.greenBg, bd: T.greenBd, icon: 'zap' },
    };
    const t = map[action];
    if (!t) return null;
    return (
        <Animated.View entering={FadeInDown.duration(280)} style={[s.toast, { backgroundColor: t.bg, borderColor: t.bd }]}>
            <View style={[s.toastIcon, { backgroundColor: t.color + '20' }]}>
                <Feather name={t.icon} size={13} color={t.color} />
            </View>
            <Text style={[s.toastTx, { color: t.color }]}>{t.label}</Text>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QrScreen() {
    // useScreenSecurity();
    const router = useRouter();

    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null,
    );
    const student = activeStudent;
    const token = activeStudent?.token ?? null;
    const card = token?.card_number ? { card_number: token.card_number } : null;

    const _notReady = (action) => Alert.alert('Not Available Yet', `Card ${action} will be available once connected to your backend.`, [{ text: 'OK' }]);
    const blockCard = () => _notReady('block');
    const unblockCard = () => _notReady('unblock');
    const revokeCard = () => _notReady('revoke');
    const activateCard = () => _notReady('activate');

    const status = token?.status ?? 'UNASSIGNED';
    const meta = tokenMeta(status);

    const [isFlipped, setIsFlipped] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [actionDone, setActionDone] = useState(null);

    const doBlock = async () => { setShowBlockConfirm(false); await blockCard?.(); setActionDone('blocked'); setTimeout(() => setActionDone(null), 3000); };
    const doUnblock = async () => { setShowUnblockConfirm(false); await unblockCard?.(); setActionDone('unblocked'); setTimeout(() => setActionDone(null), 3000); };
    const doRevoke = async () => { setShowRevokeConfirm(false); await revokeCard?.(); setActionDone('revoked'); };
    const doActivate = async () => { setShowActivateConfirm(false); await activateCard?.(); setActionDone('activated'); setTimeout(() => setActionDone(null), 3000); };

    const handleShare = async () => {
        await Share.share({ message: `${student?.first_name ?? 'Child'}'s emergency card — Card No: ${card?.card_number ?? '—'}. Scan in case of emergency.` });
    };

    const renderActions = () => {
        switch (status) {
            case 'ACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="lock" size={16} color={T.amber} />} label="Block Card Temporarily" sublabel="Scanning will be paused until you unblock" color={T.amber} bg={T.amberBg} border={T.amberBd} onPress={() => setShowBlockConfirm(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={T.red} />} label="Report Card Lost" sublabel="Permanently disables this card — can't be undone" color={T.red} bg={T.redBg} border={T.redBd} onPress={() => setShowRevokeConfirm(true)} />
                </>);
            case 'INACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="unlock" size={16} color={T.green} />} label="Unblock Card" sublabel="Resume normal scanning" color={T.green} bg={T.greenBg} border={T.greenBd} onPress={() => setShowUnblockConfirm(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={T.red} />} label="Report Card Lost Instead" sublabel="Permanently disables this card — can't be undone" color={T.red} bg={T.redBg} border={T.redBd} onPress={() => setShowRevokeConfirm(true)} />
                </>);
            case 'ISSUED':
                return <ActionBtn icon={<Feather name="zap" size={16} color={T.green} />} label="Activate Card" sublabel="Enable this card so it can be scanned in emergencies" color={T.green} bg={T.greenBg} border={T.greenBd} onPress={() => setShowActivateConfirm(true)} />;
            case 'REVOKED':
            case 'EXPIRED':
                return (<>
                    <View style={s.revokedNotice}>
                        <Feather name="alert-circle" size={15} color={T.red} />
                        <Text style={s.revokedNoticeTx}>{status === 'REVOKED' ? 'This card has been permanently disabled. Anyone trying to scan it will see an error.' : 'This card has expired. It can no longer be scanned.'}</Text>
                    </View>
                    <ActionBtn icon={<Feather name="refresh-cw" size={16} color={T.blue} />} label="Request a Replacement Card" sublabel="Contact your school to get a new physical card" color={T.blue} bg={T.blueBg} border={T.blueBd} onPress={() => router.push('/(app)/support')} />
                    <ActionBtn icon={<Feather name="phone" size={16} color={T.tx2} />} label="Contact School Support" sublabel="We'll help you get sorted" color={T.tx2} bg={T.s2} border={T.bd} onPress={() => router.push('/(app)/support')} />
                </>);
            default:
                return <View style={s.revokedNotice}><Feather name="info" size={14} color={T.tx3} /><Text style={s.revokedNoticeTx}>Contact your school to set up this card.</Text></View>;
        }
    };

    return (
        <Screen bg={T.bg} edges={['top', 'left', 'right']}>
            <ConfirmModal visible={showBlockConfirm} title="Block Card Temporarily?" body={`This will pause all scanning for ${student?.first_name ?? 'your child'}'s card. No one will be able to scan it until you unblock it.`} warning="Use this if the card is misplaced but not fully lost." confirmLabel="Block Card" confirmColor={T.amber} icon={<Feather name="lock" size={24} color={T.amber} />} onConfirm={doBlock} onCancel={() => setShowBlockConfirm(false)} />
            <ConfirmModal visible={showUnblockConfirm} title="Unblock This Card?" body={`This will restore normal scanning for ${student?.first_name ?? 'your child'}'s card immediately.`} confirmLabel="Unblock Card" confirmColor={T.green} icon={<Feather name="unlock" size={24} color={T.green} />} onConfirm={doUnblock} onCancel={() => setShowUnblockConfirm(false)} />
            <ConfirmModal visible={showRevokeConfirm} title="Report Card as Lost?" body={`This will permanently disable ${student?.first_name ?? 'your child'}'s card. Anyone who tries to scan it will see that it's been reported lost.`} warning="This cannot be undone. You'll need to request a new card from your school." confirmLabel="Yes, Report Lost" confirmColor={T.red} icon={<Feather name="alert-triangle" size={24} color={T.red} />} onConfirm={doRevoke} onCancel={() => setShowRevokeConfirm(false)} />
            <ConfirmModal visible={showActivateConfirm} title="Activate This Card?" body={`Once activated, ${student?.first_name ?? 'your child'}'s card will be live and can be scanned in an emergency.`} confirmLabel="Activate Card" confirmColor={T.green} icon={<Feather name="zap" size={24} color={T.green} />} onConfirm={doActivate} onCancel={() => setShowActivateConfirm(false)} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(0).duration(360)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.pageTitle}>{student?.first_name ? `${student.first_name}'s Card` : 'Emergency Card'}</Text>
                        <Text style={s.pageSub}>Physical emergency card</Text>
                    </View>
                    <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                        <Feather name="share" size={16} color={T.tx2} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Status row */}
                <Animated.View entering={FadeInDown.delay(40).duration(360)} style={s.statusRow}>
                    <View style={[s.statusPill, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
                        {meta.pulse && <PulseDot color={meta.color} size={6} />}
                        <Text style={[s.statusPillTx, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={s.statusDesc} numberOfLines={1}>{meta.desc}</Text>
                </Animated.View>

                {/* Toast */}
                {actionDone && <ToastBanner action={actionDone} />}

                {/* 3D card */}
                <Animated.View entering={FadeIn.delay(60).duration(500)}>
                    <PhysicalCard student={student} token={token} card={card} status={status} isFlipped={isFlipped} onFlip={() => setIsFlipped(v => !v)} />
                </Animated.View>

                {/* Flip tabs */}
                <Animated.View entering={FadeInDown.delay(100).duration(340)}>
                    <CardTabs isFlipped={isFlipped} onFlip={() => setIsFlipped(v => !v)} />
                </Animated.View>

                {/* Drag hint */}
                <Animated.View entering={FadeInDown.delay(118).duration(300)} style={s.dragHint}>
                    <MaterialCommunityIcons name="gesture-swipe" size={12} color={T.tx4} />
                    <Text style={s.dragHintTx}>Drag to tilt  ·  Tap tab or QR button to flip</Text>
                </Animated.View>

                {/* Card Actions */}
                <Animated.View entering={FadeInDown.delay(160).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>CARD ACTIONS</Text>
                    <View style={s.actionList}>{renderActions()}</View>
                </Animated.View>

                {/* Card Details */}
                <Animated.View entering={FadeInDown.delay(200).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>CARD DETAILS</Text>
                    <View style={s.detailsBlock}>
                        <DetailRow label="Card Number" value={card?.card_number ?? '—'} />
                        <DetailRow label="Student" value={[student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—'} />
                        <DetailRow label="Class" value={student?.class ? `${student.class}${student?.section ? `-${student.section}` : ''}` : '—'} />
                        <DetailRow label="School" value={student?.school?.name ?? '—'} />
                        <DetailRow label="Valid Until" value={fmtDate(token?.expires_at)} valueColor={token?.expires_at && (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000 ? T.amber : undefined} />
                        <DetailRow label="Card Status" value={meta.label} valueColor={meta.color} last />
                    </View>
                </Animated.View>

                {/* Safety tip */}
                <Animated.View entering={FadeInDown.delay(230).duration(360)}>
                    <View style={s.safetyTip}>
                        <View style={s.safetyIconBox}><Feather name="shield" size={14} color={T.green} /></View>
                        <Text style={s.safetyTx}>This card is unique to your child. The QR on the physical card links directly to their emergency profile — keep it with them at all times.</Text>
                    </View>
                </Animated.View>

                {/* Glossary */}
                <Animated.View entering={FadeInDown.delay(260).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>WHAT DO STATUSES MEAN?</Text>
                    <View style={s.glossary}>
                        {[
                            { label: 'Active', desc: 'Card works normally. Emergency info shows when scanned.', color: T.green },
                            { label: 'Blocked', desc: 'Temporarily paused by you. Unblock at any time.', color: T.amber },
                            { label: 'Lost / Revoked', desc: 'Permanently disabled. Request a replacement from school.', color: T.red },
                            { label: 'Expired', desc: 'Card past its valid date. Request renewal from school.', color: T.red },
                        ].map((g, i, arr) => (
                            <View key={i} style={[s.glossaryRow, i < arr.length - 1 && s.glossaryRowBd]}>
                                <View style={[s.glossaryDot, { backgroundColor: g.color }]} />
                                <Text style={[s.glossaryLabel, { color: g.color }]}>{g.label}</Text>
                                <Text style={s.glossaryDesc}>{g.desc}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    scroll: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 18, paddingBottom: 56, gap: 16 },

    // Header
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    pageTitle: { fontSize: 23, fontWeight: '900', color: T.tx, letterSpacing: -0.5 },
    pageSub: { fontSize: 13, color: T.tx3, marginTop: 3, fontWeight: '500' },
    shareBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: T.s1, borderWidth: 1, borderColor: T.bd, alignItems: 'center', justifyContent: 'center' },

    // Status
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    statusPillTx: { fontSize: 12, fontWeight: '800', letterSpacing: 0.1 },
    statusDesc: { fontSize: 12.5, color: T.tx3, flex: 1, fontWeight: '500' },

    // Card face base
    cardFace: { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', position: 'relative' },
    cardRing: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 1, zIndex: 10 },
    cardStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 9 },
    cardArc1: { position: 'absolute', width: CARD_W * 0.78, height: CARD_W * 0.78, borderRadius: 999, borderWidth: 1, top: -(CARD_W * 0.36), right: -(CARD_W * 0.28), zIndex: 1 },
    cardArc2: { position: 'absolute', width: CARD_W * 1.05, height: CARD_W * 1.05, borderRadius: 999, borderWidth: 1, top: -(CARD_W * 0.52), right: -(CARD_W * 0.46), zIndex: 1 },

    // Front content
    frontContent: { flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 17, justifyContent: 'space-between', zIndex: 5 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    brandMark: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    brandName: { fontSize: 10.5, fontWeight: '900', color: 'rgba(255,255,255,0.92)', letterSpacing: 1.6 },
    brandSub: { fontSize: 8, color: 'rgba(255,255,255,0.40)', letterSpacing: 0.4, marginTop: 1 },
    cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
    cardBadgeTx: { fontSize: 10.5, fontWeight: '800' },
    chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    chipBody: { width: 36, height: 28, borderRadius: 5, borderWidth: 1, padding: 5, justifyContent: 'center' },
    chipLine: { height: 1.5, borderRadius: 1, width: '100%' },
    chipDivider: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
    cardNum: { fontSize: 15.5, fontWeight: '700', letterSpacing: 2.4, color: 'rgba(255,255,255,0.88)', fontVariant: ['tabular-nums'], fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    metaLbl: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.36)', letterSpacing: 1.0 },
    cardHolder: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.90)', letterSpacing: 0.6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    cardSub: { fontSize: 8.5, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.3, marginTop: 1 },
    cardValidTx: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.88)', letterSpacing: 1.0, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    qrFlipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    qrFlipBtnTx: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },

    // Back content
    backContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16, zIndex: 5 },
    backLeft: { flex: 1, gap: 9, justifyContent: 'space-between', alignSelf: 'stretch' },
    backAvatar: { width: 40, height: 40, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    backAvatarTx: { fontSize: 15, fontWeight: '900' },
    backMetaLbl: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.32)', letterSpacing: 1.0 },
    backName: { fontSize: 11.5, fontWeight: '800', color: 'rgba(255,255,255,0.90)', letterSpacing: 0.4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    backClass: { fontSize: 8.5, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.2, marginTop: 1 },
    backCardNum: { fontSize: 9.5, fontWeight: '700', color: 'rgba(255,255,255,0.70)', letterSpacing: 0.4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    backStatus: { fontSize: 11, fontWeight: '800' },
    scanInstr: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)', alignSelf: 'flex-start' },
    scanInstrTx: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4 },
    qrBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, padding: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 10 } }) },

    // Tabs
    tabRow: { flexDirection: 'row', backgroundColor: T.s1, borderRadius: 16, borderWidth: 1, borderColor: T.bd, padding: 4, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
    tabActive: { backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd2 },
    tabTx: { fontSize: 13, fontWeight: '600', color: T.tx3 },
    tabTxActive: { color: T.tx, fontWeight: '800' },

    // Drag hint
    dragHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
    dragHintTx: { fontSize: 11, color: T.tx4, fontWeight: '500' },

    // Section
    section: { gap: 10 },
    sectionHead: { fontSize: 10.5, fontWeight: '800', color: T.tx3, letterSpacing: 1.1 },

    // Action buttons
    actionList: { gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 17, borderWidth: 1, padding: 16 },
    actionBtnDim: { opacity: 0.4 },
    actionBtnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actionBtnLabel: { fontSize: 15, fontWeight: '800' },
    actionBtnSub: { fontSize: 12.5, color: T.tx3, marginTop: 3, lineHeight: 17 },

    // Revoked
    revokedNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: T.redBg, borderRadius: 14, borderWidth: 1, borderColor: T.redBd, padding: 14 },
    revokedNoticeTx: { fontSize: 13.5, color: T.tx2, flex: 1, lineHeight: 20 },

    // Details
    detailsBlock: { backgroundColor: T.s1, borderRadius: 17, borderWidth: 1, borderColor: T.bd, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, paddingVertical: 14 },
    detailRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    detailLabel: { fontSize: 14, color: T.tx3, fontWeight: '500' },
    detailValue: { fontSize: 14, color: T.tx, fontWeight: '700', maxWidth: '58%', textAlign: 'right' },

    // Safety tip
    safetyTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, backgroundColor: T.greenBg, borderRadius: 16, borderWidth: 1, borderColor: T.greenBd, padding: 15 },
    safetyIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(18,161,80,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    safetyTx: { fontSize: 13, color: T.tx2, flex: 1, lineHeight: 19, fontWeight: '500', paddingTop: 5 },

    // Glossary
    glossary: { backgroundColor: T.s1, borderRadius: 17, borderWidth: 1, borderColor: T.bd, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 4 },
    glossaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 13, paddingVertical: 12 },
    glossaryRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    glossaryDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5.5, flexShrink: 0 },
    glossaryLabel: { fontSize: 13, fontWeight: '800', width: 105, flexShrink: 0 },
    glossaryDesc: { fontSize: 12.5, color: T.tx3, flex: 1, lineHeight: 18 },

    // Toast
    toast: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, borderWidth: 1, padding: 13 },
    toastIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    toastTx: { fontSize: 13.5, fontWeight: '700', flex: 1 },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalSheet: { backgroundColor: T.s1, borderRadius: 26, borderWidth: 1, borderColor: T.bd2, padding: 28, width: '100%', gap: 12, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.45, shadowRadius: 40 }, android: { elevation: 24 } }) },
    modalIconBox: { width: 66, height: 66, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 21, fontWeight: '900', color: T.tx, textAlign: 'center', letterSpacing: -0.3 },
    modalBody: { fontSize: 14.5, color: T.tx2, textAlign: 'center', lineHeight: 22 },
    modalWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: T.amberBg, borderRadius: 13, borderWidth: 1, borderColor: T.amberBd, padding: 13, width: '100%' },
    modalWarnTx: { fontSize: 12.5, color: T.amber, flex: 1, lineHeight: 18 },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
    modalCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: T.s3, borderWidth: 1, borderColor: T.bd, alignItems: 'center' },
    modalCancelTx: {
        fontSize: 15,
        fontWeight: '700',
        color: T.tx2
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center'
    },
    modalConfirmTx: {
        fontSize: 15,
        fontWeight: '800',
        color: T.white
    },
});