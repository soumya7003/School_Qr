// app/(app)/qr.jsx
import Screen from '@/components/common/Screen';
import {
    ActionButton,
    CardTabs,
    ConfirmModal,
    DetailRow,
    LoadingOverlay,
    PhysicalCard,
    PulseDot,
    ToastBanner,
} from '@/components/qr/qr.index';
import { BLOOD_GROUP_FROM_ENUM, fmtDate } from '@/constants/qr';
import { useProfileStore } from '@/features/profile/profile.store';
import { useQrActions, useQrModals } from '@/features/qr/hooks/qr.hooks.index';
import { useFetchOnMount } from '@/hooks/useFetchOnMount';
import { useTheme } from '@/providers/ThemeProvider';
import { qrStyles as s } from '@/styles/qr.style';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

function tokenMeta(status, C, t) {
    switch (status) {
        case 'ACTIVE': return { label: t('qr.statusActive'), color: C.ok, bg: C.okBg, bd: C.okBd, desc: t('qr.descActive'), pulse: true };
        case 'INACTIVE': return { label: t('qr.statusInactive'), color: C.primary, bg: C.primaryBg, bd: C.primaryBd, desc: t('qr.descInactive'), pulse: false };
        case 'ISSUED': return { label: t('qr.statusIssued'), color: C.blue, bg: C.blueBg, bd: C.blueBd, desc: t('qr.descIssued'), pulse: false };
        case 'REVOKED': return { label: t('qr.statusRevoked'), color: C.red, bg: C.redBg, bd: C.redBd, desc: t('qr.descRevoked'), pulse: false };
        case 'EXPIRED': return { label: t('qr.statusExpired'), color: C.red, bg: C.redBg, bd: C.redBd, desc: t('qr.descExpired'), pulse: false };
        case 'UNASSIGNED': return { label: t('qr.statusNotSetUp'), color: C.tx3, bg: C.s4, bd: C.bd, desc: t('qr.descUnassigned'), pulse: false };
        default: return { label: status ?? '—', color: C.tx3, bg: C.s4, bd: C.bd, desc: '', pulse: false };
    }
}

export default function QrScreen() {
    const { colors: C } = useTheme();
    const router = useRouter();
    const { t } = useTranslation();

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

    const status = token?.status ?? 'UNASSIGNED';
    const meta = tokenMeta(status, C, t);
    const studentId = student?.id ?? null;

    const [isFlipped, setIsFlipped] = useState(false);
    const modals = useQrModals();
    const { loading, actionDone, doBlock, doUnblock, doRevoke, doActivate } = useQrActions(studentId, fetchAndPersist);

    const handleShare = async () => {
        await Share.share({
            message: t('qr.shareMessage', {
                name: student?.first_name ?? t('home.guardian'),
                cardNumber: token?.card_number ?? '—',
            }),
        });
    };

    const renderActions = () => {
        switch (status) {
            case 'ACTIVE':
                return (<>
                    <ActionButton
                        icon={<Feather name="lock" size={16} color={C.primary} />}
                        label={t('qr.blockCard')}
                        sublabel={t('qr.blockCardSub')}
                        color={C.primary} bg={C.primaryBg} border={C.primaryBd}
                        onPress={() => modals.setShowBlock(true)}
                    />
                    <ActionButton
                        icon={<Feather name="alert-triangle" size={16} color={C.red} />}
                        label={t('qr.reportLost')}
                        sublabel={t('qr.reportLostSub')}
                        color={C.red} bg={C.redBg} border={C.redBd}
                        onPress={() => modals.setShowRevoke(true)}
                    />
                </>);
            case 'INACTIVE':
                return (<>
                    <ActionButton
                        icon={<Feather name="phone" size={16} color={C.ok} />}
                        label={t('qr.unblockCard')}
                        sublabel={t('qr.unblockCardSub')}
                        color={C.ok} bg={C.okBg} border={C.okBd}
                        onPress={() => modals.setShowUnblock(true)}
                    />
                    <ActionButton
                        icon={<Feather name="alert-triangle" size={16} color={C.red} />}
                        label={t('qr.reportLostInstead')}
                        sublabel={t('qr.reportLostSub')}
                        color={C.red} bg={C.redBg} border={C.redBd}
                        onPress={() => modals.setShowRevoke(true)}
                    />
                </>);
            case 'ISSUED':
                return (
                    <ActionButton
                        icon={<Feather name="zap" size={16} color={C.ok} />}
                        label={t('qr.activateCard')}
                        sublabel={t('qr.activateCardSub')}
                        color={C.ok} bg={C.okBg} border={C.okBd}
                        onPress={() => modals.setShowActivate(true)}
                    />
                );
            case 'REVOKED':
            case 'EXPIRED':
                return (<>
                    <View style={[s.revokedNotice, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
                        <Feather name="alert-circle" size={15} color={C.red} />
                        <Text style={[s.revokedNoticeTx, { color: C.tx2 }]}>
                            {status === 'REVOKED' ? t('qr.revokedNotice') : t('qr.expiredNotice')}
                        </Text>
                    </View>
                    <ActionButton
                        icon={<Feather name="refresh-cw" size={16} color={C.blue} />}
                        label={t('qr.requestReplacement')}
                        sublabel={t('qr.requestReplacementSub')}
                        color={C.blue} bg={C.blueBg} border={C.blueBd}
                        onPress={() => router.push('/(app)/support')}
                    />
                </>);
            default:
                return (
                    <View style={[s.revokedNotice, { backgroundColor: C.s3, borderColor: C.bd }]}>
                        <Feather name="info" size={14} color={C.tx3} />
                        <Text style={[s.revokedNoticeTx, { color: C.tx3 }]}>{t('qr.unassignedNotice')}</Text>
                    </View>
                );
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <LoadingOverlay visible={loading} C={C} />

            <ConfirmModal visible={modals.showBlock} title={t('qr.confirmBlockTitle')} body={t('qr.confirmBlockBody', { name: student?.first_name ?? '' })} warning={t('qr.confirmBlockWarning')} confirmLabel={t('qr.confirmBlockBtn')} confirmColor={C.primary} icon={<Feather name="lock" size={24} color={C.primary} />} onConfirm={async () => { const ok = await doBlock(); if (ok) modals.setShowBlock(false); }} onCancel={() => modals.setShowBlock(false)} C={C} />
            <ConfirmModal visible={modals.showUnblock} title={t('qr.confirmUnblockTitle')} body={t('qr.confirmUnblockBody')} warning={null} confirmLabel={t('qr.confirmUnblockBtn')} confirmColor={C.ok} icon={<Feather name="phone" size={24} color={C.ok} />} onConfirm={() => { doUnblock(); modals.setShowUnblock(false); }} onCancel={() => modals.setShowUnblock(false)} C={C} />
            <ConfirmModal visible={modals.showRevoke} title={t('qr.confirmRevokeTitle')} body={t('qr.confirmRevokeBody', { name: student?.first_name ?? '' })} warning={t('qr.confirmRevokeWarning')} confirmLabel={t('qr.confirmRevokeBtn')} confirmColor={C.red} icon={<Feather name="alert-triangle" size={24} color={C.red} />} onConfirm={async () => { const ok = await doRevoke(); if (ok) modals.setShowRevoke(false); }} onCancel={() => modals.setShowRevoke(false)} C={C} />
            <ConfirmModal visible={modals.showActivate} title={t('qr.confirmActivateTitle')} body={t('qr.confirmActivateBody')} warning={null} confirmLabel={t('qr.confirmActivateBtn')} confirmColor={C.ok} icon={<Feather name="zap" size={24} color={C.ok} />} onConfirm={() => { doActivate(); modals.setShowActivate(false); }} onCancel={() => modals.setShowActivate(false)} C={C} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <Animated.View entering={FadeInDown.delay(0).duration(360)} style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.pageTitle, { color: C.tx }]}>
                            {student?.first_name ? t('qr.pageTitle', { name: student.first_name }) : t('qr.pageTitleFallback')}
                        </Text>
                        <Text style={[s.pageSub, { color: C.tx3 }]}>{t('qr.subtitle')}</Text>
                    </View>
                    <TouchableOpacity style={[s.shareBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={handleShare} activeOpacity={0.7}>
                        <Feather name="share" size={16} color={C.tx2} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Status */}
                <Animated.View entering={FadeInDown.delay(40).duration(360)} style={s.statusRow}>
                    <View style={[s.statusPill, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
                        {meta.pulse && <PulseDot color={meta.color} size={6} />}
                        <Text style={[s.statusPillTx, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    <Text style={[s.statusDesc, { color: C.tx3 }]} numberOfLines={1}>{meta.desc}</Text>
                </Animated.View>

                {actionDone && <ToastBanner action={actionDone} C={C} />}

                {/* Card */}
                <Animated.View entering={FadeIn.delay(60).duration(500)}>
                    <PhysicalCard student={student} token={token} isFlipped={isFlipped} onFlip={() => setIsFlipped((v) => !v)} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(340)}>
                    <CardTabs isFlipped={isFlipped} onFlip={() => setIsFlipped((v) => !v)} C={C} />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(118).duration(300)} style={s.dragHint}>
                    <MaterialCommunityIcons name="gesture-swipe" size={12} color={C.tx3} style={{ opacity: 0.5 }} />
                    <Text style={[s.dragHintTx, { color: C.tx3, opacity: 0.5 }]}>{t('qr.dragHint')}</Text>
                </Animated.View>

                {/* Actions */}
                <Animated.View entering={FadeInDown.delay(160).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>{t('qr.cardActions').toUpperCase()}</Text>
                    <View style={s.actionList}>{renderActions()}</View>
                </Animated.View>

                {/* Details */}
                <Animated.View entering={FadeInDown.delay(200).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>{t('qr.cardDetails').toUpperCase()}</Text>
                    {isFetching && !isHydrated && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd, padding: 20, alignItems: 'center' }]}>
                            <Text style={[s.detailLabel, { color: C.tx3 }]}>{t('common.loading')}</Text>
                        </View>
                    )}
                    {isHydrated && !token && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd, padding: 16, gap: 6 }]}>
                            <Feather name="info" size={16} color={C.tx3} />
                            <Text style={[s.detailValue, { color: C.tx3 }]}>{t('qr.notAssigned')}</Text>
                        </View>
                    )}
                    {token && (
                        <View style={[s.detailsBlock, { backgroundColor: C.s2, borderColor: C.bd }]}>
                            <DetailRow label={t('qr.detailCardNumber')} value={token.card_number ?? '—'} C={C} />
                            <DetailRow label={t('qr.detailStudent')} value={[student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—'} C={C} />
                            <DetailRow label={t('qr.detailClass')} value={student?.class ? `${student.class}${student?.section ? `-${student.section}` : ''}` : '—'} C={C} />
                            <DetailRow label={t('qr.detailSchool')} value={student?.school?.name ?? '—'} C={C} />
                            <DetailRow label={t('qr.detailBloodGroup')} value={BLOOD_GROUP_FROM_ENUM[student?.emergency?.blood_group] ?? student?.emergency?.blood_group ?? '—'} C={C} />
                            <DetailRow label={t('qr.detailValidUntil')} value={fmtDate(token.expires_at)} valueColor={token.expires_at && (new Date(token.expires_at) - Date.now()) < 30 * 24 * 60 * 60 * 1000 ? C.amb : undefined} C={C} />
                            <DetailRow label={t('qr.detailCardStatus')} value={meta.label} valueColor={meta.color} last C={C} />
                        </View>
                    )}
                </Animated.View>

                {/* Safety Tip */}
                <Animated.View entering={FadeInDown.delay(230).duration(360)}>
                    <View style={[s.safetyTip, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
                        <View style={[s.safetyIconBox, { backgroundColor: C.okBg }]}>
                            <Feather name="shield" size={14} color={C.ok} />
                        </View>
                        <Text style={[s.safetyTx, { color: C.tx2 }]}>{t('qr.safetyTip')}</Text>
                    </View>
                </Animated.View>

                {/* Glossary */}
                <Animated.View entering={FadeInDown.delay(260).duration(360)} style={s.section}>
                    <Text style={[s.sectionHead, { color: C.tx3 }]}>{t('qr.glossaryTitle').toUpperCase()}</Text>
                    <View style={[s.glossary, { backgroundColor: C.s2, borderColor: C.bd }]}>
                        {[
                            { label: t('qr.glossaryActiveLabel'), desc: t('qr.glossaryActiveDesc'), color: C.ok },
                            { label: t('qr.glossaryBlockedLabel'), desc: t('qr.glossaryBlockedDesc'), color: C.primary },
                            { label: t('qr.glossaryRevokedLabel'), desc: t('qr.glossaryRevokedDesc'), color: C.red },
                            { label: t('qr.glossaryExpiredLabel'), desc: t('qr.glossaryExpiredDesc'), color: C.red },
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