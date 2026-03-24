/**
 * @file app/(app)/qr.jsx
 * @description QR Screen — fully i18n-wired
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
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;
const CARD_H = Math.round(CARD_W * 0.631);

const T = {
    bg: '#070709', s1: '#0E0E12', s2: '#141418', s3: '#1A1A20', s4: '#222228',
    bd: 'rgba(255,255,255,0.07)', bd2: 'rgba(255,255,255,0.13)', bd3: 'rgba(255,255,255,0.20)',
    tx: '#F0F0F4', tx2: 'rgba(240,240,244,0.60)', tx3: 'rgba(240,240,244,0.34)', tx4: 'rgba(240,240,244,0.18)',
    red: '#E8342A', redBg: 'rgba(232,52,42,0.10)', redBd: 'rgba(232,52,42,0.22)',
    green: '#12A150', greenBg: 'rgba(18,161,80,0.10)', greenBd: 'rgba(18,161,80,0.22)',
    amber: '#F09000', amberBg: 'rgba(240,144,0,0.10)', amberBd: 'rgba(240,144,0,0.22)',
    blue: '#3D82F6', blueBg: 'rgba(61,130,246,0.10)', blueBd: 'rgba(61,130,246,0.22)',
    white: '#FFFFFF',
};

function cardPalette(status) {
    switch (status) {
        case 'ACTIVE':     return { gradFront: ['#0B1A10','#0D1F13','#071209'], gradBack: ['#091509','#0B1A0C','#060E06'], glow: T.green, shimmer: 'rgba(18,161,80,0.22)',  accent: T.green, chip: '#1A3A22' };
        case 'INACTIVE':   return { gradFront: ['#1A1508','#1D1709','#110F05'], gradBack: ['#161206','#1A1508','#0E0B04'], glow: T.amber, shimmer: 'rgba(240,144,0,0.18)',  accent: T.amber, chip: '#2E2310' };
        case 'REVOKED':
        case 'EXPIRED':    return { gradFront: ['#1A0808','#1C0A0A','#130606'], gradBack: ['#150505','#180707','#0D0404'], glow: T.red,   shimmer: 'rgba(232,52,42,0.18)',   accent: T.red,   chip: '#2E1010' };
        case 'ISSUED':     return { gradFront: ['#0A0F1C','#0D1322','#060A12'], gradBack: ['#080D18','#0B1020','#050810'], glow: T.blue,  shimmer: 'rgba(61,130,246,0.18)',  accent: T.blue,  chip: '#10182E' };
        default:           return { gradFront: ['#10101A','#131318','#0A0A10'], gradBack: ['#0C0C14','#0F0F18','#08080E'], glow: T.tx3,   shimmer: 'rgba(240,240,244,0.06)', accent: T.tx3,   chip: '#1A1A22' };
    }
}

function tokenMeta(status, t) {
    switch (status) {
        case 'ACTIVE':     return { label: t('home.statusActive'),    color: T.green, bg: T.greenBg, bd: T.greenBd, desc: t('qr.statusDesc_ACTIVE'),    pulse: true  };
        case 'INACTIVE':   return { label: t('home.statusInactive'),  color: T.amber, bg: T.amberBg, bd: T.amberBd, desc: t('qr.statusDesc_INACTIVE'),  pulse: false };
        case 'ISSUED':     return { label: t('home.statusIssued'),    color: T.blue,  bg: T.blueBg,  bd: T.blueBd,  desc: t('qr.statusDesc_ISSUED'),    pulse: false };
        case 'REVOKED':    return { label: t('home.statusRevoked'),   color: T.red,   bg: T.redBg,   bd: T.redBd,   desc: t('qr.statusDesc_REVOKED'),   pulse: false };
        case 'EXPIRED':    return { label: t('home.statusExpired'),   color: T.red,   bg: T.redBg,   bd: T.redBd,   desc: t('qr.statusDesc_EXPIRED'),   pulse: false };
        case 'UNASSIGNED': return { label: t('home.statusNotSetUp'),  color: T.tx3,   bg: T.s3,      bd: T.bd,      desc: t('qr.statusDesc_UNASSIGNED'),pulse: false };
        default:           return { label: status ?? '—',             color: T.tx3,   bg: T.s3,      bd: T.bd,      desc: '',                           pulse: false };
    }
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtValidThru(iso) {
    if (!iso) return '——/——';
    const d = new Date(iso);
    return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`;
}

// ─── Pulse Dot ────────────────────────────────────────────────────────────────
function PulseDot({ color = T.green, size = 7 }) {
    const opacity = useSharedValue(1);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(
            withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ), -1, false);
    }, []);
    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={[{ width: size, height: size, borderRadius: size/2, backgroundColor: color }, style]} />;
}

// ─── Shimmer Layer ────────────────────────────────────────────────────────────
function ShimmerLayer({ tiltX, tiltY, shimmerColor }) {
    const style = useAnimatedStyle(() => {
        const tx = interpolate(tiltY.value, [-14, 14], [-CARD_W*0.4, CARD_W*0.4]);
        const ty = interpolate(tiltX.value, [-10, 10], [-CARD_H*0.5, CARD_H*0.5]);
        const opacity = interpolate(Math.abs(tiltX.value)+Math.abs(tiltY.value), [0, 24], [0.0, 0.55]);
        return { opacity, transform: [{ translateX: tx }, { translateY: ty }] };
    });
    return (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 22, overflow: 'hidden' }, style]}>
            <LinearGradient colors={['transparent', shimmerColor, 'rgba(255,255,255,0.18)', shimmerColor, 'transparent']} start={[0,0.3]} end={[1,0.7]} style={{ width: '100%', height: '100%' }} />
        </Animated.View>
    );
}

// ─── Physical Card ────────────────────────────────────────────────────────────
function PhysicalCard({ student, token, card, status, isFlipped, onFlip }) {
    const { t } = useTranslation();
    const meta = tokenMeta(status, t);
    const pal  = cardPalette(status);

    const initials  = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    const fullName  = [student?.first_name, student?.last_name].filter(Boolean).join(' ').toUpperCase() || '—';
    const classLine = student?.class ? `CLASS ${student.class}${student.section ? `-${student.section}` : ''}` : '';
    const schoolShort = student?.school?.name ? (student.school.name.length > 22 ? student.school.name.slice(0,22)+'…' : student.school.name) : '';
    const cardNum   = card?.card_number ?? null;
    const fmtNum    = (n) => { if (!n) return '•••• •••• •••• ••••'; const g = n.replace(/[-\s]/g,'').match(/.{1,4}/g) ?? [n]; return g.join('  '); };
    const scanUrl   = cardNum ? `https://guardian.schoolqr.app/s/${cardNum}` : 'https://guardian.schoolqr.app';
    const isExpiring = token?.expires_at && (new Date(token.expires_at) - new Date()) < 30*24*60*60*1000;

    const tiltX = useSharedValue(0); const tiltY = useSharedValue(0);
    const shiftX = useSharedValue(0); const shiftY = useSharedValue(0);
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

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            tiltX.value  = interpolate(e.translationY, [-90,90], [12,-12]);
            tiltY.value  = interpolate(e.translationX, [-90,90], [-14,14]);
            shiftX.value = interpolate(e.translationX, [-90,90], [-8,8]);
            shiftY.value = interpolate(e.translationY, [-90,90], [-5,5]);
        })
        .onEnd(() => {
            tiltX.value  = withSpring(0, { damping: 12, stiffness: 200 });
            tiltY.value  = withSpring(0, { damping: 12, stiffness: 200 });
            shiftX.value = withSpring(0, { damping: 12, stiffness: 200 });
            shiftY.value = withSpring(0, { damping: 12, stiffness: 200 });
        });

    const frontStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 }, { translateX: shiftX.value }, { translateY: shiftY.value },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${interpolate(flipProgress.value, [0,1], [0,180])}deg` },
        ],
    }));
    const backStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 }, { translateX: shiftX.value }, { translateY: shiftY.value },
            { rotateX: `${tiltX.value}deg` },
            { rotateY: `${interpolate(flipProgress.value, [0,1], [180,360])}deg` },
        ],
    }));

    const cardShadow = Platform.select({
        ios:     { shadowColor: pal.glow, shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.45, shadowRadius: 36 },
        android: { elevation: 22 },
    });

    return (
        <GestureHandlerRootView style={{ alignItems: 'center' }}>
            <GestureDetector gesture={pan}>
                <View style={{ width: CARD_W, height: CARD_H+32, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: CARD_W*0.80, height: CARD_H*0.55, borderRadius: 999, backgroundColor: pal.glow, top: CARD_H*0.28, alignSelf: 'center' }, glowStyle]} />

                    {/* FRONT */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, frontStyle]}>
                        <LinearGradient colors={pal.gradFront} start={[0,0]} end={[1,1]} style={[s.cardFace, cardShadow]}>
                            <View style={[s.cardRing, { borderColor: pal.accent+'35' }]} />
                            <View style={[s.cardStripe, { backgroundColor: pal.accent }]} />
                            <View style={[s.cardArc1, { borderColor: pal.accent+'10' }]} />
                            <View style={[s.cardArc2, { borderColor: pal.accent+'07' }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />
                            <View style={s.frontContent}>
                                <View style={s.row}>
                                    <View style={s.brandGroup}>
                                        <View style={[s.brandMark, { backgroundColor: pal.accent+'1C', borderColor: pal.accent+'42' }]}>
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
                                <View style={s.chipRow}>
                                    <View style={[s.chipBody, { backgroundColor: pal.chip, borderColor: pal.accent+'32' }]}>
                                        <View style={[s.chipLine, { backgroundColor: pal.accent+'55' }]} />
                                        <View style={[s.chipLine, { backgroundColor: pal.accent+'38', marginTop: 4 }]} />
                                        <View style={s.chipDivider} />
                                    </View>
                                    <MaterialCommunityIcons name="contactless-payment" size={18} color={pal.accent+'65'} />
                                </View>
                                <Text style={s.cardNum}>{fmtNum(cardNum)}</Text>
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
                                        <TouchableOpacity style={[s.qrFlipBtn, { borderColor: pal.accent+'45', backgroundColor: pal.accent+'14' }]} onPress={onFlip} activeOpacity={0.75}>
                                            <MaterialCommunityIcons name="qrcode" size={12} color={pal.accent} />
                                            <Text style={[s.qrFlipBtnTx, { color: pal.accent }]}>QR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* BACK */}
                    <Animated.View style={[{ width: CARD_W, height: CARD_H, position: 'absolute', backfaceVisibility: 'hidden' }, backStyle]}>
                        <LinearGradient colors={pal.gradBack} start={[1,0]} end={[0,1]} style={[s.cardFace, cardShadow]}>
                            <View style={[s.cardRing, { borderColor: pal.accent+'30' }]} />
                            <View style={[s.cardStripe, { backgroundColor: pal.accent, opacity: 0.4 }]} />
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} />
                            <View style={s.backContent}>
                                <View style={s.backLeft}>
                                    <View style={s.brandGroup}>
                                        <View style={[s.brandMark, { width: 24, height: 24, backgroundColor: pal.accent+'1C', borderColor: pal.accent+'35' }]}>
                                            <MaterialCommunityIcons name="shield-check" size={10} color={pal.accent} />
                                        </View>
                                        <Text style={[s.brandName, { fontSize: 9, letterSpacing: 1.3 }]}>RESQID</Text>
                                    </View>
                                    <View style={[s.backAvatar, { backgroundColor: pal.accent+'1A', borderColor: pal.accent+'38' }]}>
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
                                    <View style={[s.scanInstr, { borderColor: pal.accent+'28' }]}>
                                        <MaterialCommunityIcons name="qrcode-scan" size={9} color={pal.accent} />
                                        <Text style={[s.scanInstrTx, { color: pal.accent }]}>Scan in emergency</Text>
                                    </View>
                                </View>
                                <View style={[s.qrBox, { borderColor: pal.accent+'40' }]}>
                                    {showBack && (
                                        <QRCode value={scanUrl} size={CARD_H*0.60} color="#1A1A1E" backgroundColor="#FFFFFF" quietZone={5} ecl="M" />
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

// ─── Card Tabs ────────────────────────────────────────────────────────────────
function CardTabs({ isFlipped, onFlip }) {
    const { t } = useTranslation();
    return (
        <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, !isFlipped && s.tabActive]} onPress={() => isFlipped && onFlip()} activeOpacity={0.7}>
                <MaterialCommunityIcons name="credit-card-outline" size={13} color={!isFlipped ? T.tx : T.tx3} />
                <Text style={[s.tabTx, !isFlipped && s.tabTxActive]}>{t('qr.cardFront')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, isFlipped && s.tabActive]} onPress={() => !isFlipped && onFlip()} activeOpacity={0.7}>
                <MaterialCommunityIcons name="qrcode-scan" size={13} color={isFlipped ? T.tx : T.tx3} />
                <Text style={[s.tabTx, isFlipped && s.tabTxActive]}>{t('qr.qrCode')}</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, sublabel, onPress, color, bg, border, disabled }) {
    return (
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: bg, borderColor: border ?? T.bd }, disabled && s.actionBtnDim]} onPress={onPress} activeOpacity={disabled ? 1 : 0.75} disabled={disabled}>
            <View style={[s.actionBtnIcon, { backgroundColor: color+'18' }]}>{icon}</View>
            <View style={{ flex: 1 }}>
                <Text style={[s.actionBtnLabel, { color }]}>{label}</Text>
                {sublabel ? <Text style={s.actionBtnSub}>{sublabel}</Text> : null}
            </View>
            <Feather name="chevron-right" size={14} color={color+'55'} />
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
    const { t } = useTranslation();
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.overlay} onPress={onCancel}>
                <Animated.View entering={FadeInUp.duration(260)} style={s.modalSheet}>
                    <View style={[s.modalIconBox, { backgroundColor: confirmColor+'18' }]}>{icon}</View>
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
                            <Text style={s.modalCancelTx}>{t('common.cancel')}</Text>
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
    const { t } = useTranslation();
    const map = {
        blocked:   { key: 'qr.toastBlocked',   color: T.amber, bg: T.amberBg, bd: T.amberBd, icon: 'lock'           },
        unblocked: { key: 'qr.toastUnblocked',  color: T.green, bg: T.greenBg, bd: T.greenBd, icon: 'unlock'         },
        revoked:   { key: 'qr.toastRevoked',    color: T.red,   bg: T.redBg,   bd: T.redBd,   icon: 'alert-triangle' },
        activated: { key: 'qr.toastActivated',  color: T.green, bg: T.greenBg, bd: T.greenBd, icon: 'zap'            },
    };
    const item = map[action];
    if (!item) return null;
    return (
        <Animated.View entering={FadeInDown.duration(280)} style={[s.toast, { backgroundColor: item.bg, borderColor: item.bd }]}>
            <View style={[s.toastIcon, { backgroundColor: item.color+'20' }]}>
                <Feather name={item.icon} size={13} color={item.color} />
            </View>
            <Text style={[s.toastTx, { color: item.color }]}>{t(item.key)}</Text>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function QrScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    const activeStudent = useProfileStore(
        (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null,
    );
    const student = activeStudent;
    const token   = activeStudent?.token ?? null;
    const card    = token?.card_number ? { card_number: token.card_number } : null;

    const _notReady = (action) => Alert.alert(t('qr.notAvailableTitle'), t('qr.notAvailableBody', { action }));
    const blockCard   = () => _notReady('block');
    const unblockCard = () => _notReady('unblock');
    const revokeCard  = () => _notReady('revoke');
    const activateCard = () => _notReady('activate');

    const status = token?.status ?? 'UNASSIGNED';
    const meta   = tokenMeta(status, t);
    const firstName = student?.first_name ?? t('qr.notAssigned');

    const [isFlipped, setIsFlipped] = useState(false);
    const [showBlockConfirm,    setShowBlockConfirm]    = useState(false);
    const [showUnblockConfirm,  setShowUnblockConfirm]  = useState(false);
    const [showRevokeConfirm,   setShowRevokeConfirm]   = useState(false);
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [actionDone, setActionDone] = useState(null);

    const doBlock    = async () => { setShowBlockConfirm(false);    await blockCard?.();    setActionDone('blocked');   setTimeout(() => setActionDone(null), 3000); };
    const doUnblock  = async () => { setShowUnblockConfirm(false);  await unblockCard?.();  setActionDone('unblocked'); setTimeout(() => setActionDone(null), 3000); };
    const doRevoke   = async () => { setShowRevokeConfirm(false);   await revokeCard?.();   setActionDone('revoked'); };
    const doActivate = async () => { setShowActivateConfirm(false); await activateCard?.(); setActionDone('activated'); setTimeout(() => setActionDone(null), 3000); };

    const handleShare = async () => {
        await Share.share({ message: `${student?.first_name ?? 'Child'}'s emergency card — Card No: ${card?.card_number ?? '—'}. Scan in case of emergency.` });
    };

    const renderActions = () => {
        switch (status) {
            case 'ACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="lock" size={16} color={T.amber} />} label={t('qr.blockCard')} sublabel={t('qr.blockCardSub')} color={T.amber} bg={T.amberBg} border={T.amberBd} onPress={() => setShowBlockConfirm(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={T.red} />} label={t('qr.reportLost')} sublabel={t('qr.reportLostSub')} color={T.red} bg={T.redBg} border={T.redBd} onPress={() => setShowRevokeConfirm(true)} />
                </>);
            case 'INACTIVE':
                return (<>
                    <ActionBtn icon={<Feather name="unlock" size={16} color={T.green} />} label={t('qr.unblockCard')} sublabel={t('qr.unblockCardSub')} color={T.green} bg={T.greenBg} border={T.greenBd} onPress={() => setShowUnblockConfirm(true)} />
                    <ActionBtn icon={<Feather name="alert-triangle" size={16} color={T.red} />} label={t('qr.reportLostInstead')} sublabel={t('qr.reportLostSub')} color={T.red} bg={T.redBg} border={T.redBd} onPress={() => setShowRevokeConfirm(true)} />
                </>);
            case 'ISSUED':
                return <ActionBtn icon={<Feather name="zap" size={16} color={T.green} />} label={t('qr.activateCard')} sublabel={t('qr.activateCardSub')} color={T.green} bg={T.greenBg} border={T.greenBd} onPress={() => setShowActivateConfirm(true)} />;
            case 'REVOKED':
            case 'EXPIRED':
                return (<>
                    <View style={s.revokedNotice}>
                        <Feather name="alert-circle" size={15} color={T.red} />
                        <Text style={s.revokedNoticeTx}>{status === 'REVOKED' ? t('qr.revokedNotice') : t('qr.expiredNotice')}</Text>
                    </View>
                    <ActionBtn icon={<Feather name="refresh-cw" size={16} color={T.blue} />} label={t('qr.requestReplacement')} sublabel={t('qr.requestReplacementSub')} color={T.blue} bg={T.blueBg} border={T.blueBd} onPress={() => router.push('/(app)/support')} />
                    <ActionBtn icon={<Feather name="phone" size={16} color={T.tx2} />} label={t('qr.contactSupport')} sublabel={t('qr.contactSupportSub')} color={T.tx2} bg={T.s2} border={T.bd} onPress={() => router.push('/(app)/support')} />
                </>);
            default:
                return <View style={s.revokedNotice}><Feather name="info" size={14} color={T.tx3} /><Text style={s.revokedNoticeTx}>{t('qr.unassignedNotice')}</Text></View>;
        }
    };

    const glossaryItems = [
        { label: t('qr.glossaryActiveLabel'),  desc: t('qr.glossaryActiveDesc'),  color: T.green },
        { label: t('qr.glossaryBlockedLabel'), desc: t('qr.glossaryBlockedDesc'), color: T.amber },
        { label: t('qr.glossaryRevokedLabel'), desc: t('qr.glossaryRevokedDesc'), color: T.red   },
        { label: t('qr.glossaryExpiredLabel'), desc: t('qr.glossaryExpiredDesc'), color: T.red   },
    ];

    return (
        <Screen bg={T.bg} edges={['top', 'left', 'right']}>
            <ConfirmModal visible={showBlockConfirm}    title={t('qr.confirmBlockTitle')}    body={t('qr.confirmBlockBody', { name: firstName })}    warning={t('qr.confirmBlockWarning')}   confirmLabel={t('qr.confirmBlockBtn')}    confirmColor={T.amber} icon={<Feather name="lock"           size={24} color={T.amber} />} onConfirm={doBlock}    onCancel={() => setShowBlockConfirm(false)} />
            <ConfirmModal visible={showUnblockConfirm}  title={t('qr.confirmUnblockTitle')}  body={t('qr.confirmUnblockBody', { name: firstName })}                                           confirmLabel={t('qr.confirmUnblockBtn')}  confirmColor={T.green} icon={<Feather name="unlock"         size={24} color={T.green} />} onConfirm={doUnblock}  onCancel={() => setShowUnblockConfirm(false)} />
            <ConfirmModal visible={showRevokeConfirm}   title={t('qr.confirmRevokeTitle')}   body={t('qr.confirmRevokeBody', { name: firstName })}   warning={t('qr.confirmRevokeWarning')}  confirmLabel={t('qr.confirmRevokeBtn')}   confirmColor={T.red}   icon={<Feather name="alert-triangle" size={24} color={T.red} />}   onConfirm={doRevoke}   onCancel={() => setShowRevokeConfirm(false)} />
            <ConfirmModal visible={showActivateConfirm} title={t('qr.confirmActivateTitle')} body={t('qr.confirmActivateBody', { name: firstName })}                                          confirmLabel={t('qr.confirmActivateBtn')} confirmColor={T.green} icon={<Feather name="zap"            size={24} color={T.green} />} onConfirm={doActivate} onCancel={() => setShowActivateConfirm(false)} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(0).duration(360)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.pageTitle}>{student?.first_name ? `${student.first_name}'s Card` : t('settings.emergencyProfile')}</Text>
                        <Text style={s.pageSub}>{t('qr.subtitle')}</Text>
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
                    <Text style={s.dragHintTx}>{t('qr.dragHint')}</Text>
                </Animated.View>

                {/* Card Actions */}
                <Animated.View entering={FadeInDown.delay(160).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>{t('qr.cardActions').toUpperCase()}</Text>
                    <View style={s.actionList}>{renderActions()}</View>
                </Animated.View>

                {/* Card Details */}
                <Animated.View entering={FadeInDown.delay(200).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>{t('qr.cardDetails').toUpperCase()}</Text>
                    <View style={s.detailsBlock}>
                        <DetailRow label={t('qr.detailCardNumber')} value={card?.card_number ?? '—'} />
                        <DetailRow label={t('qr.detailStudent')}    value={[student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—'} />
                        <DetailRow label={t('qr.detailClass')}      value={student?.class ? `${student.class}${student?.section ? `-${student.section}` : ''}` : '—'} />
                        <DetailRow label={t('qr.detailSchool')}     value={student?.school?.name ?? '—'} />
                        <DetailRow label={t('qr.detailValidUntil')} value={fmtDate(token?.expires_at)} valueColor={token?.expires_at && (new Date(token.expires_at) - new Date()) < 30*24*60*60*1000 ? T.amber : undefined} />
                        <DetailRow label={t('qr.detailCardStatus')} value={meta.label} valueColor={meta.color} last />
                    </View>
                </Animated.View>

                {/* Safety tip */}
                <Animated.View entering={FadeInDown.delay(230).duration(360)}>
                    <View style={s.safetyTip}>
                        <View style={s.safetyIconBox}><Feather name="shield" size={14} color={T.green} /></View>
                        <Text style={s.safetyTx}>{t('qr.safetyTip')}</Text>
                    </View>
                </Animated.View>

                {/* Glossary */}
                <Animated.View entering={FadeInDown.delay(260).duration(360)} style={s.section}>
                    <Text style={s.sectionHead}>{t('qr.glossaryTitle').toUpperCase()}</Text>
                    <View style={s.glossary}>
                        {glossaryItems.map((g, i, arr) => (
                            <View key={i} style={[s.glossaryRow, i < arr.length-1 && s.glossaryRowBd]}>
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

// ─── Styles (unchanged) ───────────────────────────────────────────────────────
const s = StyleSheet.create({
    scroll: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 18, paddingBottom: 56, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    pageTitle: { fontSize: 23, fontWeight: '900', color: T.tx, letterSpacing: -0.5 },
    pageSub: { fontSize: 13, color: T.tx3, marginTop: 3, fontWeight: '500' },
    shareBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: T.s1, borderWidth: 1, borderColor: T.bd, alignItems: 'center', justifyContent: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
    statusPillTx: { fontSize: 12, fontWeight: '800', letterSpacing: 0.1 },
    statusDesc: { fontSize: 12.5, color: T.tx3, flex: 1, fontWeight: '500' },
    cardFace: { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', position: 'relative' },
    cardRing: { ...StyleSheet.absoluteFillObject, borderRadius: 22, borderWidth: 1, zIndex: 10 },
    cardStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 9 },
    cardArc1: { position: 'absolute', width: CARD_W*0.78, height: CARD_W*0.78, borderRadius: 999, borderWidth: 1, top: -(CARD_W*0.36), right: -(CARD_W*0.28), zIndex: 1 },
    cardArc2: { position: 'absolute', width: CARD_W*1.05, height: CARD_W*1.05, borderRadius: 999, borderWidth: 1, top: -(CARD_W*0.52), right: -(CARD_W*0.46), zIndex: 1 },
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
    tabRow: { flexDirection: 'row', backgroundColor: T.s1, borderRadius: 16, borderWidth: 1, borderColor: T.bd, padding: 4, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
    tabActive: { backgroundColor: T.s4, borderWidth: 1, borderColor: T.bd2 },
    tabTx: { fontSize: 13, fontWeight: '600', color: T.tx3 },
    tabTxActive: { color: T.tx, fontWeight: '800' },
    dragHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
    dragHintTx: { fontSize: 11, color: T.tx4, fontWeight: '500' },
    section: { gap: 10 },
    sectionHead: { fontSize: 10.5, fontWeight: '800', color: T.tx3, letterSpacing: 1.1 },
    actionList: { gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 17, borderWidth: 1, padding: 16 },
    actionBtnDim: { opacity: 0.4 },
    actionBtnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actionBtnLabel: { fontSize: 15, fontWeight: '800' },
    actionBtnSub: { fontSize: 12.5, color: T.tx3, marginTop: 3, lineHeight: 17 },
    revokedNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: T.redBg, borderRadius: 14, borderWidth: 1, borderColor: T.redBd, padding: 14 },
    revokedNoticeTx: { fontSize: 13.5, color: T.tx2, flex: 1, lineHeight: 20 },
    detailsBlock: { backgroundColor: T.s1, borderRadius: 17, borderWidth: 1, borderColor: T.bd, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, paddingVertical: 14 },
    detailRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    detailLabel: { fontSize: 14, color: T.tx3, fontWeight: '500' },
    detailValue: { fontSize: 14, color: T.tx, fontWeight: '700', maxWidth: '58%', textAlign: 'right' },
    safetyTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, backgroundColor: T.greenBg, borderRadius: 16, borderWidth: 1, borderColor: T.greenBd, padding: 15 },
    safetyIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(18,161,80,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    safetyTx: { fontSize: 13, color: T.tx2, flex: 1, lineHeight: 19, fontWeight: '500', paddingTop: 5 },
    glossary: { backgroundColor: T.s1, borderRadius: 17, borderWidth: 1, borderColor: T.bd, overflow: 'hidden', paddingVertical: 4, paddingHorizontal: 4 },
    glossaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 13, paddingVertical: 12 },
    glossaryRowBd: { borderBottomWidth: 1, borderBottomColor: T.bd },
    glossaryDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 5.5, flexShrink: 0 },
    glossaryLabel: { fontSize: 13, fontWeight: '800', width: 105, flexShrink: 0 },
    glossaryDesc: { fontSize: 12.5, color: T.tx3, flex: 1, lineHeight: 18 },
    toast: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, borderWidth: 1, padding: 13 },
    toastIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    toastTx: { fontSize: 13.5, fontWeight: '700', flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalSheet: { backgroundColor: T.s1, borderRadius: 26, borderWidth: 1, borderColor: T.bd2, padding: 28, width: '100%', gap: 12, alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.45, shadowRadius: 40 }, android: { elevation: 24 } }) },
    modalIconBox: { width: 66, height: 66, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    modalTitle: { fontSize: 21, fontWeight: '900', color: T.tx, textAlign: 'center', letterSpacing: -0.3 },
    modalBody: { fontSize: 14.5, color: T.tx2, textAlign: 'center', lineHeight: 22 },
    modalWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: T.amberBg, borderRadius: 13, borderWidth: 1, borderColor: T.amberBd, padding: 13, width: '100%' },
    modalWarnTx: { fontSize: 12.5, color: T.amber, flex: 1, lineHeight: 18 },
    modalBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
    modalCancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, backgroundColor: T.s3, borderWidth: 1, borderColor: T.bd, alignItems: 'center' },
    modalCancelTx: { fontSize: 15, fontWeight: '700', color: T.tx2 },
    modalConfirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    modalConfirmTx: { fontSize: 15, fontWeight: '800', color: T.white },
});