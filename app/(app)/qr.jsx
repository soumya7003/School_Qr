/**
 * app/(app)/qr.jsx
 * Emergency QR Card Screen
 *
 * DATA FIXES vs old version:
 *   OLD: token?.cards[0]?.card_number   ← doesn't exist — cards[] is not in store
 *   NEW: token?.card_number             ← matches parent.service.js flat shape
 *
 *   OLD: constructed scan URL from cardNum manually
 *   NEW: uses token.qr_url from backend (is_active QR asset URL), falls back to scan URL
 *
 *   OLD: blockCard/unblockCard/activateCard all called _notReady() — no real API
 *   NEW: doBlock  → POST /api/parents/me/lock-card { student_id, confirmation:"LOCK" }
 *        doRevoke → POST /api/parents/me/request-replace { student_id, reason }
 *        doUnblock → Alert directing to school (no parent unblock endpoint in API)
 *        doActivate → routes to support (school activates, not parent)
 *
 *   All colors from useTheme().colors — zero hardcoded hex in JSX
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useFetchOnMount } from '@/hooks/useFetchOnMount';
import { useTheme } from '@/providers/ThemeProvider';
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
import { useShallow } from 'zustand/react/shallow';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;
const CARD_H = Math.round(CARD_W * 0.631);

// ─── Card palette (absolute colors — card always looks "physical") ────────────
function cardPalette(status) {
    switch (status) {
        case 'ACTIVE': return { gradFront: ['#0B1A10', '#0D1F13', '#071209'], gradBack: ['#091509', '#0B1A0C', '#060E06'], glow: '#12A150', shimmer: 'rgba(18,161,80,0.22)', accent: '#12A150', chip: '#1A3A22' };
        case 'INACTIVE': return { gradFront: ['#1A1508', '#1D1709', '#110F05'], gradBack: ['#161206', '#1A1508', '#0E0B04'], glow: '#F97316', shimmer: 'rgba(249,115,22,0.22)', accent: '#F97316', chip: '#2E2310' };
        case 'REVOKED':
        case 'EXPIRED': return { gradFront: ['#1A0808', '#1C0A0A', '#130606'], gradBack: ['#150505', '#180707', '#0D0404'], glow: '#EF4444', shimmer: 'rgba(239,68,68,0.20)', accent: '#EF4444', chip: '#2E1010' };
        case 'ISSUED': return { gradFront: ['#0A0F1C', '#0D1322', '#060A12'], gradBack: ['#080D18', '#0B1020', '#050810'], glow: '#60A5FA', shimmer: 'rgba(96,165,250,0.20)', accent: '#60A5FA', chip: '#10182E' };
        default: return { gradFront: ['#10101A', '#131318', '#0A0A10'], gradBack: ['#0C0C14', '#0F0F18', '#08080E'], glow: '#444', shimmer: 'rgba(240,240,244,0.06)', accent: 'rgba(240,240,244,0.30)', chip: '#1A1A22' };
    }
}

// Card-local badge (always readable on dark card surface)
function cardBadge(status) {
    switch (status) {
        case 'ACTIVE': return { label: 'Active', color: '#12A150', bg: 'rgba(18,161,80,0.18)', bd: 'rgba(18,161,80,0.38)', pulse: true };
        case 'INACTIVE': return { label: 'Blocked', color: '#F97316', bg: 'rgba(249,115,22,0.18)', bd: 'rgba(249,115,22,0.38)', pulse: false };
        case 'ISSUED': return { label: 'Not Activated', color: '#60A5FA', bg: 'rgba(96,165,250,0.18)', bd: 'rgba(96,165,250,0.38)', pulse: false };
        case 'REVOKED': return { label: 'Lost', color: '#EF4444', bg: 'rgba(239,68,68,0.18)', bd: 'rgba(239,68,68,0.38)', pulse: false };
        case 'EXPIRED': return { label: 'Expired', color: '#EF4444', bg: 'rgba(239,68,68,0.18)', bd: 'rgba(239,68,68,0.38)', pulse: false };
        default: return { label: 'Not Set Up', color: 'rgba(240,240,244,0.45)', bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.12)', pulse: false };
    }
}

// Theme-aware token meta
function tokenMeta(status, C) {
    switch (status) {
        case 'ACTIVE': return { label: 'Active', color: C.ok, bg: C.okBg, bd: C.okBd, desc: 'Card is working normally', pulse: true };
        case 'INACTIVE': return { label: 'Blocked', color: C.primary, bg: C.primaryBg, bd: C.primaryBd, desc: 'Scanning is temporarily paused', pulse: false };
        case 'ISSUED': return { label: 'Not Activated', color: C.blue, bg: C.blueBg, bd: C.blueBd, desc: 'Tap to request activation from school', pulse: false };
        case 'REVOKED': return { label: 'Reported Lost', color: C.red, bg: C.redBg, bd: C.redBd, desc: 'Card is permanently disabled', pulse: false };
        case 'EXPIRED': return { label: 'Expired', color: C.red, bg: C.redBg, bd: C.redBd, desc: 'Request a replacement from school', pulse: false };
        case 'UNASSIGNED': return { label: 'Not Set Up', color: C.tx3, bg: C.s4, bd: C.bd, desc: 'Contact school to set up this card', pulse: false };
        default: return { label: status ?? '—', color: C.tx3, bg: C.s4, bd: C.bd, desc: '', pulse: false };
    }
}

// ─── Blood group enum → display label ────────────────────────────────────────
// Backend stores DB enum values (A_POS, O_NEG etc).
// This maps them back to human-readable labels (A+, O- etc).
const BLOOD_GROUP_FROM_ENUM = {
    A_POS: 'A+', A_NEG: 'A−', B_POS: 'B+', B_NEG: 'B−',
    O_POS: 'O+', O_NEG: 'O−', AB_POS: 'AB+', AB_NEG: 'AB−',
    UNKNOWN: 'Unknown',
};

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtValidThru(iso) {
    if (!iso) return '——/——';
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}
function fmtCardNum(n) {
    if (!n) return 'RQ-0000-XXXXXXXX';

    const parts = n.split('-');

    if (parts.length === 3) {
        return `${parts[0]}  ${parts[1]}  ${parts[2]}`;
    }

    return n;
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────
function PulseDot({ color, size = 7 }) {
    const opacity = useSharedValue(1);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(
            withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ), -1, false);
    }, []);
    return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, useAnimatedStyle(() => ({ opacity: opacity.value }))]} />;
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function ShimmerLayer({ tiltX, tiltY, shimmerColor }) {
    const style = useAnimatedStyle(() => ({
        opacity: interpolate(Math.abs(tiltX.value) + Math.abs(tiltY.value), [0, 24], [0.0, 0.55]),
        transform: [
            { translateX: interpolate(tiltY.value, [-14, 14], [-CARD_W * 0.4, CARD_W * 0.4]) },
            { translateY: interpolate(tiltX.value, [-10, 10], [-CARD_H * 0.5, CARD_H * 0.5]) },
        ],
    }));
    return (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: 'hidden' }, style]}>
            <LinearGradient colors={['transparent', shimmerColor, 'rgba(255,255,255,0.18)', shimmerColor, 'transparent']} start={[0, 0.3]} end={[1, 0.7]} style={{ width: '100%', height: '100%' }} />
        </Animated.View>
    );
}

// ─── Physical card ────────────────────────────────────────────────────────────
function PhysicalCard({ student, token, isFlipped, onFlip }) {
    // ── KEY FIX: backend shape is token = { id, status, expires_at, card_number, qr_url }
    const cardNumber = token?.card_number ?? null;
    // qr_url: backend sends it directly (after fix removing is_active gate).
    // Falls back to constructed URL if QR asset not yet generated.
    const qrValue = token?.qr_url
        ?? (cardNumber ? `https://resqid.in/s/${cardNumber}` : null)
        ?? 'https://resqid.in';

    const status = token?.status ?? 'UNASSIGNED';
    const pal = cardPalette(status);
    const badge = cardBadge(status);
    const isExpiring = token?.expires_at && (new Date(token.expires_at) - Date.now()) < 30 * 24 * 60 * 60 * 1000;
    const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ').toUpperCase() || '—';
    const classLine = student?.class ? `CLASS ${student.class}${student.section ? `-${student.section}` : ''}` : '';
    const schoolShort = student?.school?.name ? student.school.name.slice(0, 22) + (student.school.name.length > 22 ? '…' : '') : '';

    const tiltX = useSharedValue(0), tiltY = useSharedValue(0);
    const shiftX = useSharedValue(0), shiftY = useSharedValue(0);
    const flipProgress = useSharedValue(isFlipped ? 1 : 0);
    const [showBack, setShowBack] = useState(isFlipped);
    const prev = useRef(isFlipped);

    useEffect(() => {
        if (prev.current === isFlipped) return;
        prev.current = isFlipped;
        if (isFlipped) {
            flipProgress.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) }, () => runOnJS(setShowBack)(true));
        } else {
            runOnJS(setShowBack)(false);
            flipProgress.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.cubic) });
        }
    }, [isFlipped]);

    const glowOpacity = useSharedValue(0.18);
    useEffect(() => {
        if (status === 'ACTIVE') {
            glowOpacity.value = withRepeat(withSequence(
                withTiming(0.50, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.16, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
            ), -1, false);
        }
    }, [status]);

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tiltX.value = interpolate(e.translationY, [-90, 90], [12, -12]);
            tiltY.value = interpolate(e.translationX, [-90, 90], [-14, 14]);
            shiftX.value = interpolate(e.translationX, [-90, 90], [-8, 8]);
            shiftY.value = interpolate(e.translationY, [-90, 90], [-5, 5]);
        })
        .onEnd(() => {
            [tiltX, tiltY, shiftX, shiftY].forEach((v) => { v.value = withSpring(0, { damping: 12, stiffness: 200 }); });
        });

    const frontStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: 1000 }, { translateX: shiftX.value }, { translateY: shiftY.value }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` }],
    }));
    const backStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: 1000 }, { translateX: shiftX.value }, { translateY: shiftY.value }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` }],
    }));
    const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
    const shadow = Platform.select({ ios: { shadowColor: pal.glow, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.45, shadowRadius: 36 }, android: { elevation: 22 } });

    return (
        <GestureHandlerRootView style={{ alignItems: 'center' }}>
            <GestureDetector gesture={pan}>
                <View style={{ width: CARD_W, height: CARD_H + 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: CARD_W * 0.8, height: CARD_H * 0.55, borderRadius: 999, backgroundColor: pal.glow, top: CARD_H * 0.28, alignSelf: 'center' }, glowStyle]} />

                    {/* FRONT */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, frontStyle]}>
                        <LinearGradient colors={pal.gradFront} start={[0, 0]} end={[1, 1]} style={[cs.cardFace, shadow]}>
                            <View style={[cs.cardRing, { borderColor: pal.accent + '35' }]} />
                            <View style={[cs.cardStripe, { backgroundColor: pal.accent }]} />
                            <View style={[cs.cardArc1, { borderColor: pal.accent + '10' }]} />
                            <View style={[cs.cardArc2, { borderColor: pal.accent + '07' }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />
                            <View style={cs.frontContent}>
                                <View style={cs.row}>
                                    <View style={cs.brandGroup}>
                                        <View style={[cs.brandMark, { backgroundColor: pal.accent + '1C', borderColor: pal.accent + '42' }]}><MaterialCommunityIcons name="shield-check" size={13} color={pal.accent} /></View>
                                        <View><Text style={cs.brandName}>RESQID</Text><Text style={cs.brandSub}>Guardian Card</Text></View>
                                    </View>
                                    <View style={[cs.cardBadge, { backgroundColor: badge.bg, borderColor: badge.bd }]}>
                                        {badge.pulse && <PulseDot color={badge.color} size={5} />}
                                        <Text style={[cs.cardBadgeTx, { color: badge.color }]}>{badge.label}</Text>
                                    </View>
                                </View>
                                <View style={cs.chipRow}>
                                    <View style={[cs.chipBody, { backgroundColor: pal.chip, borderColor: pal.accent + '32' }]}>
                                        <View style={[cs.chipLine, { backgroundColor: pal.accent + '55' }]} />
                                        <View style={[cs.chipLine, { backgroundColor: pal.accent + '38', marginTop: 4 }]} />
                                        <View style={cs.chipDivider} />
                                    </View>
                                    <MaterialCommunityIcons name="contactless-payment" size={18} color={pal.accent + '65'} />
                                </View>
                                <Text style={cs.cardNum}>{fmtCardNum(cardNumber)}</Text>
                                <View style={[cs.row, { alignItems: 'flex-end' }]}>
                                    <View style={{ flex: 1, gap: 1 }}>
                                        <Text style={cs.metaLbl}>CARDHOLDER</Text>
                                        <Text style={cs.cardHolder} numberOfLines={1}>{fullName}</Text>
                                        {classLine ? <Text style={cs.cardSub} numberOfLines={1}>{classLine}{schoolShort ? `  ·  ${schoolShort}` : ''}</Text> : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 7 }}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={cs.metaLbl}>VALID THRU</Text>
                                            <Text style={[cs.cardValidTx, isExpiring && { color: '#F97316' }]}>{fmtValidThru(token?.expires_at)}</Text>
                                        </View>
                                        <TouchableOpacity style={[cs.qrFlipBtn, { borderColor: pal.accent + '45', backgroundColor: pal.accent + '14' }]} onPress={onFlip} activeOpacity={0.75}>
                                            <MaterialCommunityIcons name="qrcode" size={12} color={pal.accent} />
                                            <Text style={[cs.qrFlipBtnTx, { color: pal.accent }]}>QR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* BACK */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, backStyle]}>
                        <LinearGradient colors={pal.gradBack} start={[1, 0]} end={[0, 1]} style={[cs.cardFace, shadow]}>
                            <View style={[cs.cardRing, { borderColor: pal.accent + '30' }]} />
                            <View style={[cs.cardStripe, { backgroundColor: pal.accent, opacity: 0.4 }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />
                            <View style={cs.backContent}>
                                <View style={cs.backLeft}>
                                    <View style={cs.brandGroup}>
                                        <View style={[cs.brandMark, { width: 24, height: 24, backgroundColor: pal.accent + '1C', borderColor: pal.accent + '35' }]}><MaterialCommunityIcons name="shield-check" size={10} color={pal.accent} /></View>
                                        <Text style={[cs.brandName, { fontSize: 9, letterSpacing: 1.3 }]}>RESQID</Text>
                                    </View>
                                    <View style={[cs.backAvatar, { backgroundColor: pal.accent + '1A', borderColor: pal.accent + '38' }]}><Text style={[cs.backAvatarTx, { color: pal.accent }]}>{initials}</Text></View>
                                    <View><Text style={cs.backMetaLbl}>CARDHOLDER</Text><Text style={cs.backName} numberOfLines={1}>{fullName}</Text>{classLine ? <Text style={cs.backClass} numberOfLines={1}>{classLine}</Text> : null}</View>
                                    <View><Text style={cs.backMetaLbl}>CARD NO.</Text><Text style={cs.backCardNum} numberOfLines={1}>
                                        {fmtCardNum(cardNumber)}
                                    </Text></View>
                                    <View><Text style={cs.backMetaLbl}>STATUS</Text><Text style={[cs.backStatus, { color: badge.color }]}>{badge.label}</Text></View>
                                </View>
                                <View style={[cs.qrBox, { borderColor: pal.accent + '40' }]}>
                                    {showBack && <QRCode value={qrValue} size={CARD_H * 0.60} color="#1A1A1E" backgroundColor="#FFFFFF" quietZone={5} ecl="M" />}
                                    {showBack && !token?.is_qr_active && token?.qr_url == null && (
                                        <Text style={{ fontSize: 8, color: pal.accent, marginTop: 4, textAlign: 'center', opacity: 0.7 }}>QR not yet generated</Text>
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

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function CardTabs({ isFlipped, onFlip, C }) {
    return (
        <View style={[s.tabRow, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {[
                { label: 'Card Front', icon: 'credit-card-outline', active: !isFlipped, onPress: () => isFlipped && onFlip() },
                { label: 'QR Code', icon: 'qrcode-scan', active: isFlipped, onPress: () => !isFlipped && onFlip() },
            ].map((t) => (
                <TouchableOpacity key={t.label} style={[s.tab, t.active && { backgroundColor: C.s4, borderWidth: 1, borderColor: C.bd2 }]} onPress={t.onPress} activeOpacity={0.7}>
                    <MaterialCommunityIcons name={t.icon} size={13} color={t.active ? C.tx : C.tx3} />
                    <Text style={[s.tabTx, { color: t.active ? C.tx : C.tx3, fontWeight: t.active ? '800' : '600' }]}>{t.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, sublabel, onPress, color, bg, border, disabled }) {
    return (
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: bg, borderColor: border }, disabled && s.actionBtnDim]} onPress={onPress} activeOpacity={disabled ? 1 : 0.75} disabled={disabled}>
            <View style={[s.actionBtnIcon, { backgroundColor: color + '18' }]}>{icon}</View>
            <View style={{ flex: 1 }}>
                <Text style={[s.actionBtnLabel, { color }]}>{label}</Text>
                {sublabel ? <Text style={s.actionBtnSub}>{sublabel}</Text> : null}
            </View>
            <Feather name="chevron-right" size={14} color={color + '55'} />
        </TouchableOpacity>
    );
}

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor, last, C }) {
    return (
        <View style={[s.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
            <Text style={[s.detailLabel, { color: C.tx3 }]}>{label}</Text>
            <Text style={[s.detailValue, { color: valueColor ?? C.tx }]} numberOfLines={1}>{value}</Text>
        </View>
    );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ visible, title, body, confirmLabel, confirmColor, onConfirm, onCancel, icon, warning, C }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.overlay} onPress={onCancel}>
                <Animated.View entering={FadeInUp.duration(260)} style={[s.modalSheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
                    <View style={[s.modalIconBox, { backgroundColor: confirmColor + '18' }]}>{icon}</View>
                    <Text style={[s.modalTitle, { color: C.tx }]}>{title}</Text>
                    <Text style={[s.modalBody, { color: C.tx2 }]}>{body}</Text>
                    {warning && <View style={[s.modalWarn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}><Feather name="alert-triangle" size={13} color={C.amb} /><Text style={[s.modalWarnTx, { color: C.amb }]}>{warning}</Text></View>}
                    <View style={s.modalBtns}>
                        <TouchableOpacity style={[s.modalCancelBtn, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={onCancel} activeOpacity={0.7}><Text style={[s.modalCancelTx, { color: C.tx2 }]}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity style={[s.modalConfirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm} activeOpacity={0.85}><Text style={s.modalConfirmTx}>{confirmLabel}</Text></TouchableOpacity>
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastBanner({ action, C }) {
    const map = {
        blocked: { label: 'Card blocked — scanning paused', color: C.primary, bg: C.primaryBg, bd: C.primaryBd, icon: 'lock' },
        unblocked: { label: 'Card unblocked — scanning active', color: C.ok, bg: C.okBg, bd: C.okBd, icon: 'unlock' },
        revoked: { label: 'Card reported lost — replacement filed', color: C.red, bg: C.redBg, bd: C.redBd, icon: 'alert-triangle' },
        activated: { label: 'Activation request sent to school', color: C.ok, bg: C.okBg, bd: C.okBd, icon: 'zap' },
    };
    const t = map[action];
    if (!t) return null;
    return (
        <Animated.View entering={FadeInDown.duration(280)} style={[s.toast, { backgroundColor: t.bg, borderColor: t.bd }]}>
            <View style={[s.toastIcon, { backgroundColor: t.color + '20' }]}><Feather name={t.icon} size={13} color={t.color} /></View>
            <Text style={[s.toastTx, { color: t.color }]}>{t.label}</Text>
        </Animated.View>
    );
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ visible, C }) {
    if (!visible) return null;
    return (
        <Animated.View entering={FadeIn.duration(150)} style={[s.loadingOverlay, { backgroundColor: C.bg + 'CC' }]}>
            <View style={[s.loadingBox, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
                <Text style={[s.loadingTx, { color: C.tx2 }]}>Please wait…</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function QrScreen() {
    const { colors: C } = useTheme();
    const router = useRouter();

    // Fetch fresh data on mount if stale (> 30 min old). Zero cost if fresh.
    useFetchOnMount();

    const { student, token } = useProfileStore(
        useShallow((s) => {
            const st = s.students.find((x) => x.id === s.activeStudentId) ?? s.students[0] ?? null;
            return { student: st, token: st?.token ?? null };
        }),
    );
    const isHydrated = useProfileStore((s) => s.isHydrated);
    const isFetching = useProfileStore((s) => s.isFetching);
    const fetchAndPersist = useProfileStore((s) => s.fetchAndPersist);
    const lockCard = useProfileStore((s) => s.lockCard);
    const requestReplace = useProfileStore((s) => s.requestReplace);

    const status = token?.status ?? 'UNASSIGNED';
    const meta = tokenMeta(status, C);
    const studentId = student?.id ?? null;

    const [isFlipped, setIsFlipped] = useState(false);
    const [showBlock, setShowBlock] = useState(false);
    const [showUnblock, setShowUnblock] = useState(false);
    const [showRevoke, setShowRevoke] = useState(false);
    const [showActivate, setShowActivate] = useState(false);
    const [actionDone, setActionDone] = useState(null);
    const [loading, setLoading] = useState(false);
    const toastTimer = useRef(null);

    const showToast = (key) => {
        setActionDone(key);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setActionDone(null), 3500);
    };
    useEffect(() => () => clearTimeout(toastTimer.current), []);

    // ── store.lockCard → POST /api/parents/me/lock-card ──────────────────────
    // Optimistic update (ACTIVE → INACTIVE) + cache_invalidated re-fetch
    // handled inside the store. No direct api call needed here.
    const doBlock = async () => {
        setShowBlock(false);
        if (!studentId) return Alert.alert('Error', 'Student not found.');
        setLoading(true);
        try {
            await lockCard(studentId);
            showToast('blocked');
        } catch (err) {
            Alert.alert('Failed', err?.response?.data?.message ?? 'Could not block the card. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── No parent unblock endpoint in this API — route to support ─────────────
    const doUnblock = () => {
        setShowUnblock(false);
        Alert.alert(
            'Contact Your School',
            "To unblock a card, your school admin must re-activate it from their dashboard.",
            [{ text: 'OK' }, { text: 'Open Support', onPress: () => router.push('/(app)/support') }],
        );
    };

    // ── store.requestReplace → POST /api/parents/me/request-replace ──────────
    // Logs replacement request in ParentEditLog. Store handles re-fetch.
    const doRevoke = async () => {
        setShowRevoke(false);
        if (!studentId) return;
        setLoading(true);
        try {
            await requestReplace(
                studentId,
                'Card reported lost or stolen by parent via app',
            );
            await fetchAndPersist?.();
            showToast('revoked');
        } catch (err) {
            Alert.alert('Failed', err?.response?.data?.message ?? 'Could not submit the report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── ISSUED state — school activates, not parent; route to support ─────────
    const doActivate = () => {
        setShowActivate(false);
        router.push('/(app)/support');
    };

    const handleShare = async () => {
        await Share.share({
            message: `${student?.first_name ?? 'Child'}'s emergency card — Card No: ${token?.card_number ?? '—'}. Scan in case of emergency.`,
        });
    };

    const renderActions = () => {
        switch (status) {
            case 'ACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="lock" size={16} color={C.primary} />} label="Block Card Temporarily" sublabel="Scanning paused until your school re-activates it" color={C.primary} bg={C.primaryBg} border={C.primaryBd} onPress={() => setShowBlock(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={C.red} />} label="Report Card Lost" sublabel="Submits replacement request to your school" color={C.red} bg={C.redBg} border={C.redBd} onPress={() => setShowRevoke(true)} />
                </>);
            case 'INACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="phone" size={16} color={C.ok} />} label="Request Unblock via School" sublabel="Your school admin will re-activate the card" color={C.ok} bg={C.okBg} border={C.okBd} onPress={() => setShowUnblock(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={C.red} />} label="Report Card Lost Instead" sublabel="Permanently disables this card" color={C.red} bg={C.redBg} border={C.redBd} onPress={() => setShowRevoke(true)} />
                </>);
            case 'ISSUED':
                return <ActionBtn icon={<Feather name="zap" size={16} color={C.ok} />} label="Request Card Activation" sublabel="Your school admin will activate after verification" color={C.ok} bg={C.okBg} border={C.okBd} onPress={() => setShowActivate(true)} />;
            case 'REVOKED':
            case 'EXPIRED':
                return (<>
                    <View style={[s.revokedNotice, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Feather name="alert-circle" size={15} color={C.red} />
                        <Text style={[s.revokedNoticeTx, { color: C.tx2 }]}>{status === 'REVOKED' ? 'This card has been permanently disabled.' : 'This card has expired and can no longer be scanned.'}</Text>
                    </View>
                    <ActionBtn icon={<Feather name="refresh-cw" size={16} color={C.blue} />} label="Request a Replacement Card" sublabel="Contact your school to get a new physical card" color={C.blue} bg={C.blueBg} border={C.blueBd} onPress={() => router.push('/(app)/support')} />
                </>);
            default:
                return <View style={[s.revokedNotice, { backgroundColor: C.s3, borderColor: C.bd }]}><Feather name="info" size={14} color={C.tx3} /><Text style={[s.revokedNoticeTx, { color: C.tx3 }]}>Contact your school to set up this card.</Text></View>;
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <LoadingOverlay visible={loading} C={C} />

            <ConfirmModal visible={showBlock} title="Block Card Temporarily?" body={`Scanning for ${student?.first_name ?? 'your child'}'s card will be paused. Contact your school to unblock.`} warning="Use this if the card is misplaced but not fully lost." confirmLabel="Block Card" confirmColor={C.primary} icon={<Feather name="lock" size={24} color={C.primary} />} onConfirm={doBlock} onCancel={() => setShowBlock(false)} C={C} />
            <ConfirmModal visible={showUnblock} title="Unblock via School?" body="You'll be taken to support. Your school admin can unblock the card from their dashboard." warning={null} confirmLabel="Go to Support" confirmColor={C.ok} icon={<Feather name="phone" size={24} color={C.ok} />} onConfirm={doUnblock} onCancel={() => setShowUnblock(false)} C={C} />
            <ConfirmModal visible={showRevoke} title="Report Card as Lost?" body={`A replacement request will be submitted for ${student?.first_name ?? 'your child'}. Your school will disable this card and issue a new one.`} warning="This cannot be undone from the app." confirmLabel="Yes, Report Lost" confirmColor={C.red} icon={<Feather name="alert-triangle" size={24} color={C.red} />} onConfirm={doRevoke} onCancel={() => setShowRevoke(false)} C={C} />
            <ConfirmModal visible={showActivate} title="Request Card Activation?" body="You'll be taken to the support page. Your school admin will activate the card after verification." warning={null} confirmLabel="Contact School" confirmColor={C.ok} icon={<Feather name="zap" size={24} color={C.ok} />} onConfirm={doActivate} onCancel={() => setShowActivate(false)} C={C} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                <Animated.View entering={FadeInDown.delay(0).duration(360)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.pageTitle, { color: C.tx }]}>{student?.first_name ? `${student.first_name}'s Card` : 'Emergency Card'}</Text>
                        <Text style={[s.pageSub, { color: C.tx3 }]}>Physical emergency card</Text>
                    </View>
                    <TouchableOpacity style={[s.shareBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={handleShare} activeOpacity={0.7}>
                        <Feather name="share" size={16} color={C.tx2} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(40).duration(360)} style={s.statusRow}>
                    <View style={[s.statusPill, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
                        {meta.pulse && <PulseDot color={meta.color} size={6} />}
                        <Text style={[s.statusPillTx, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={[s.statusDesc, { color: C.tx3 }]} numberOfLines={1}>{meta.desc}</Text>
                </Animated.View>

                {actionDone && <ToastBanner action={actionDone} C={C} />}

                <Animated.View entering={FadeIn.delay(60).duration(500)}>
                    <PhysicalCard student={student} token={token} isFlipped={isFlipped} onFlip={() => setIsFlipped((v) => !v)} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(340)}>
                    <CardTabs isFlipped={isFlipped} onFlip={() => setIsFlipped((v) => !v)} C={C} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(118).duration(300)} style={s.dragHint}>
                    <MaterialCommunityIcons name="gesture-swipe" size={12} color={C.tx3} style={{ opacity: 0.5 }} />
                    <Text style={[s.dragHintTx, { color: C.tx3, opacity: 0.5 }]}>Drag to tilt  ·  Tap tab or QR button to flip</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(160).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>CARD ACTIONS</Text>
                    <View style={s.actionList}>{renderActions()}</View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>CARD DETAILS</Text>

                    {/* Loading state — shown while first fetch is in progress */}
                    {isFetching && !isHydrated && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd, padding: 20, alignItems: 'center' }]}>
                            <Text style={[s.detailLabel, { color: C.tx3 }]}>Loading card details…</Text>
                        </View>
                    )}

                    {/* No token at all — not set up yet */}
                    {isHydrated && !token && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd, padding: 16, gap: 6 }]}>
                            <Feather name="info" size={16} color={C.tx3} />
                            <Text style={[s.detailValue, { color: C.tx3 }]}>No card assigned yet.</Text>
                            <Text style={[s.detailLabel, { color: C.tx3 }]}>Contact your school to get a physical card issued.</Text>
                        </View>
                    )}

                    {/* Card details — shown when token exists */}
                    {token && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd }]}>
                            <DetailRow
                                label="Card Number"
                                value={token.card_number ?? '—'}
                                C={C}
                            />
                            <DetailRow
                                label="Student"
                                value={[student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—'}
                                C={C}
                            />
                            <DetailRow
                                label="Class"
                                value={student?.class
                                    ? `${student.class}${student?.section ? `-${student.section}` : ''}`
                                    : '—'}
                                C={C}
                            />
                            <DetailRow
                                label="School"
                                value={student?.school?.name ?? '—'}
                                C={C}
                            />
                            <DetailRow
                                label="Blood Group"
                                value={BLOOD_GROUP_FROM_ENUM[student?.emergency?.blood_group] ?? student?.emergency?.blood_group ?? '—'}
                                C={C}
                            />
                            <DetailRow
                                label="Valid Until"
                                value={fmtDate(token.expires_at)}
                                valueColor={
                                    token.expires_at &&
                                        (new Date(token.expires_at) - Date.now()) < 30 * 24 * 60 * 60 * 1000
                                        ? C.amb
                                        : undefined
                                }
                                C={C}
                            />
                            <DetailRow
                                label="Card Status"
                                value={meta.label}
                                valueColor={meta.color}
                                last
                                C={C}
                            />
                        </View>
                    )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(230).duration(360)}>
                    <View style={[s.safetyTip, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                        <View style={[s.safetyIconBox, { backgroundColor: C.okBg }]}><Feather name="shield" size={14} color={C.ok} /></View>
                        <Text style={[s.safetyTx, { color: C.tx2 }]}>This card is unique to your child. The QR on the physical card links directly to their emergency profile — keep it with them at all times.</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(260).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>WHAT DO STATUSES MEAN?</Text>
                    <View style={[s.glossary, { backgroundColor: C.s2, borderColor: C.bd }]}>
                        {[
                            { label: 'Active', desc: 'Card works normally. Emergency info shows when scanned.', color: C.ok },
                            { label: 'Blocked', desc: 'Temporarily paused by you. Contact school to unblock.', color: C.primary },
                            { label: 'Lost / Revoked', desc: 'Permanently disabled. Request a replacement from school.', color: C.red },
                            { label: 'Expired', desc: 'Card past its valid date. Request renewal from school.', color: C.red },
                        ].map((g, i, arr) => (
                            <View key={i} style={[s.glossaryRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
                                <View style={[s.glossaryDot, { backgroundColor: g.color }]} />
                                <Text style={[s.glossaryLabel, { color: g.color }]}>{g.label}</Text>
                                <Text style={[s.glossaryDesc, { color: C.tx3 }]}>{g.desc}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

// ─── Card face styles (not theme-aware — card is always "physical dark") ──────
const cs = StyleSheet.create({
    cardFace: { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', position: 'relative' },
    cardRing: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 1, zIndex: 10 },
    cardStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 9 },
    cardArc1: { position: 'absolute', width: CARD_W * 0.78, height: CARD_W * 0.78, borderRadius: 999, borderWidth: 1, top: -(CARD_W * 0.36), right: -(CARD_W * 0.28), zIndex: 1 },
    cardArc2: { position: 'absolute', width: CARD_W * 1.05, height: CARD_W * 1.05, borderRadius: 999, borderWidth: 1, top: -(CARD_W * 0.52), right: -(CARD_W * 0.46), zIndex: 1 },
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
    cardNum: { fontSize: 15.5, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.88)', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    metaLbl: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.36)', letterSpacing: 1.0 },
    cardHolder: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.90)', letterSpacing: 0.6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    cardSub: { fontSize: 8.5, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.3, marginTop: 1 },
    cardValidTx: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.88)', letterSpacing: 1.0, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
    qrFlipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
    qrFlipBtnTx: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
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
});

// ─── Theme-aware styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
    scroll: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 18, paddingBottom: 56, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    pageTitle: { fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
    pageSub: { fontSize: 13, marginTop: 3, fontWeight: '500' },
    shareBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    statusPillTx: { fontSize: 12, fontWeight: '800', letterSpacing: 0.1 },
    statusDesc: { fontSize: 12.5, flex: 1, fontWeight: '500' },
    tabRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
    tabTx: { fontSize: 13 },
    dragHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
    dragHintTx: { fontSize: 11, fontWeight: '500' },
    section: { gap: 10 },
    sectionHead: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1 },
    actionList: { gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 17, borderWidth: 1, padding: 16 },
    actionBtnDim: { opacity: 0.4 },
    actionBtnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actionBtnLabel: { fontSize: 15, fontWeight: '800' },
    actionBtnSub: { fontSize: 12.5, marginTop: 3, lineHeight: 17, opacity: 0.6 },
    revokedNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
    revokedNoticeTx: { fontSize: 13.5, flex: 1, lineHeight: 20 },
    detailsBlock: { borderRadius: 17, borderWidth: 1, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, paddingVertical: 14 },
    detailLabel: { fontSize: 14, fontWeight: '500' },
    detailValue: { fontSize: 14, fontWeight: '700', maxWidth: '58%', textAlign: 'right' },
    safetyTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, borderRadius: 16, borderWidth: 1, padding: 15 },
    safetyIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    safetyTx: { fontSize: 13, flex: 1, lineHeight: 19, fontWeight: '500', paddingTop: 5 },
    glossary: { borderRadius: 17, borderWidth: 1, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 4 },
    glossaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 13, paddingVertical: 12 },
    glossaryDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5.5, flexShrink: 0 },
    glossaryLabel: { fontSize: 13, fontWeight: '800', width: 105, flexShrink: 0 },
    glossaryDesc: { fontSize: 12.5, flex: 1, lineHeight: 18 },
    toast: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, borderWidth: 1, padding: 13 },
    toastIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    toastTx: { fontSize: 13.5, fontWeight: '700', flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalSheet: { borderRadius: 26, borderWidth: 1, padding: 28, width: '100%', gap: 12, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.45, shadowRadius: 40 }, android: { elevation: 24 } }) },
    modalIconBox: { width: 66, height: 66, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
    modalBody: { fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
    modalWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 13, borderWidth: 1, padding: 13, width: '100%' },
    modalWarnTx: { fontSize: 12.5, flex: 1, lineHeight: 18 },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
    modalCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
    modalCancelTx: { fontSize: 15, fontWeight: '700' },
    modalConfirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    modalConfirmTx: { fontSize: 15, fontWeight: '800', color: '#fff' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    loadingBox: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 16 },
    loadingTx: { fontSize: 14, fontWeight: '600' },
});