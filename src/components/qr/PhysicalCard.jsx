// src/components/qr/PhysicalCard.jsx
import {
    CARD_H,
    CARD_W,
    cardBadge,
    cardPalette,
    fmtCardNum,
    fmtValidThru
} from '@/constants/qr';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { PulseDot } from './PulseDot';
import { ShimmerLayer } from './ShimmerLayer';

export function PhysicalCard({ student, token, isFlipped, onFlip }) {
    const { t } = useTranslation();

    const cardNumber = token?.card_number ?? null;
    const qrValue = token?.qr_url
        ?? (cardNumber ? `https://resqid.in/s/${cardNumber}` : null)
        ?? 'https://resqid.in';

    const status = token?.status ?? 'UNASSIGNED';
    const pal = cardPalette(status);
    const badge = cardBadge(status, t);
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
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} cardW={CARD_W} cardH={CARD_H} />
                            <View style={cs.frontContent}>
                                <View style={cs.row}>
                                    <View style={cs.brandGroup}>
                                        <View style={[cs.brandMark, { backgroundColor: pal.accent + '1C', borderColor: pal.accent + '42' }]}>
                                            <MaterialCommunityIcons name="shield-check" size={13} color={pal.accent} />
                                        </View>
                                        <View>
                                            <Text style={cs.brandName}>RESQID</Text>
                                            <Text style={cs.brandSub}>{t('qr.guardianCard')}</Text>
                                        </View>
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
                                        <Text style={cs.metaLbl}>{t('qr.cardholderLabel')}</Text>
                                        <Text style={cs.cardHolder} numberOfLines={1}>{fullName}</Text>
                                        {classLine ? <Text style={cs.cardSub} numberOfLines={1}>{classLine}{schoolShort ? `  ·  ${schoolShort}` : ''}</Text> : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 7 }}>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={cs.metaLbl}>{t('qr.validThruLabel')}</Text>
                                            <Text style={[cs.cardValidTx, isExpiring && { color: '#F97316' }]}>{fmtValidThru(token?.expires_at)}</Text>
                                        </View>
                                        <TouchableOpacity style={[cs.qrFlipBtn, { borderColor: pal.accent + '45', backgroundColor: pal.accent + '14' }]} onPress={onFlip} activeOpacity={0.75}>
                                            <MaterialCommunityIcons name="qrcode" size={12} color={pal.accent} />
                                            <Text style={[cs.qrFlipBtnTx, { color: pal.accent }]}>{t('qr.qrCode')}</Text>
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
                            <ShimmerLayer tiltX={tiltX} tiltY={tiltY} shimmerColor={pal.shimmer} cardW={CARD_W} cardH={CARD_H} />
                            <View style={cs.backContent}>
                                <View style={cs.backLeft}>
                                    <View style={cs.brandGroup}>
                                        <View style={[cs.brandMark, { width: 24, height: 24, backgroundColor: pal.accent + '1C', borderColor: pal.accent + '35' }]}>
                                            <MaterialCommunityIcons name="shield-check" size={10} color={pal.accent} />
                                        </View>
                                        <Text style={[cs.brandName, { fontSize: 9, letterSpacing: 1.3 }]}>RESQID</Text>
                                    </View>
                                    <View style={[cs.backAvatar, { backgroundColor: pal.accent + '1A', borderColor: pal.accent + '38' }]}>
                                        <Text style={[cs.backAvatarTx, { color: pal.accent }]}>{initials}</Text>
                                    </View>
                                    <View>
                                        <Text style={cs.backMetaLbl}>{t('qr.cardholderLabel')}</Text>
                                        <Text style={cs.backName} numberOfLines={1}>{fullName}</Text>
                                        {classLine ? <Text style={cs.backClass} numberOfLines={1}>{classLine}</Text> : null}
                                    </View>
                                    <View>
                                        <Text style={cs.backMetaLbl}>{t('qr.cardNoLabel')}</Text>
                                        <Text style={cs.backCardNum} numberOfLines={1}>{fmtCardNum(cardNumber)}</Text>
                                    </View>
                                    <View>
                                        <Text style={cs.backMetaLbl}>{t('qr.statusLabel')}</Text>
                                        <Text style={[cs.backStatus, { color: badge.color }]}>{badge.label}</Text>
                                    </View>
                                </View>
                                <View style={[cs.qrBox, { borderColor: pal.accent + '40' }]}>
                                    {showBack && <QRCode value={qrValue} size={CARD_H * 0.60} color="#1A1A1E" backgroundColor="#FFFFFF" quietZone={5} ecl="M" />}
                                    {showBack && !token?.is_qr_active && token?.qr_url == null && (
                                        <Text style={{ fontSize: 8, color: pal.accent, marginTop: 4, textAlign: 'center', opacity: 0.7 }}>{t('qr.qrNotGenerated')}</Text>
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
    qrBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 2, padding: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 10 } }) },
});