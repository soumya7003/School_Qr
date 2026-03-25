/**
 * app/(app)/home.jsx
 * Home Screen — RESQID Parent Dashboard
 * Theme: 100% from useTheme().colors — zero hardcoded colors
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated2, { FadeInDown } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

// ─── Pulse dot ────────────────────────────────────────────────────────────────
function PulseDot({ color, size = 7 }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: anim }} />;
}

// ─── Ring glow ────────────────────────────────────────────────────────────────
function RingGlow({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.2, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', inset: -8, borderRadius: 999,
      borderWidth: 1.5, borderColor: color,
      opacity, transform: [{ scale }],
    }} />
  );
}

// ─── Token status meta ────────────────────────────────────────────────────────
function tokenMeta(status, t, C) {
  switch (status) {
    case 'ACTIVE': return { label: t('home.statusActive'), color: C.ok, bg: C.okBg, bd: C.okBd, pulse: true };
    case 'INACTIVE': return { label: t('home.statusInactive'), color: C.tx3, bg: C.s4, bd: C.bd, pulse: false };
    case 'ISSUED': return { label: t('home.statusIssued'), color: C.amb, bg: C.ambBg, bd: C.ambBd, pulse: true };
    case 'REVOKED': return { label: t('home.statusRevoked'), color: C.red, bg: C.redBg, bd: C.redBd, pulse: false };
    case 'EXPIRED': return { label: t('home.statusExpired'), color: C.red, bg: C.redBg, bd: C.redBd, pulse: false };
    case 'UNASSIGNED': return { label: t('home.statusNotSetUp'), color: C.amb, bg: C.ambBg, bd: C.ambBd, pulse: false };
    default: return { label: t('home.statusUnknown'), color: C.tx3, bg: C.s4, bd: C.bd, pulse: false };
  }
}

function fmtRelTime(iso, t) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return t('home.daysAgo', { count: days });
  if (hours > 0) return t('home.hoursAgo', { count: hours });
  if (mins > 0) return t('home.minsAgo', { count: mins });
  return t('home.justNow');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function profileCompleteness(ep, contacts) {
  const fields = [ep?.blood_group, ep?.allergies, ep?.conditions, ep?.medications, ep?.doctor_name, ep?.doctor_phone, contacts?.length > 0 ? 'ok' : null];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

function missingFields(ep, contacts, t) {
  const m = [];
  if (!ep?.blood_group) m.push(t('updates.bloodGroup'));
  if (!ep?.allergies) m.push(t('updates.allergies'));
  if (!ep?.doctor_phone) m.push(t('home.missingDoctorPhone'));
  if (!contacts?.length) m.push(t('home.missingContact'));
  return m;
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, actionLabel, onAction, children, C }) {
  return (
    <View style={[s.sectionCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
      <View style={[s.sectionHead, { borderBottomColor: C.bd }]}>
        <View style={s.sectionHeadLeft}>
          {icon}
          <Text style={[s.sectionTitle, { color: C.tx3 }]}>{title}</Text>
        </View>
        {actionLabel && (
          <TouchableOpacity onPress={onAction} style={s.sectionAction} activeOpacity={0.7}>
            <Text style={[s.sectionActionText, { color: C.primary }]}>{actionLabel}</Text>
            <Feather name="chevron-right" size={13} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────
function HeroCard({ student, school, token, card, onPressCard, delay, C }) {
  const { t } = useTranslation();
  const meta = tokenMeta(token?.status, t, C);
  const isActive = token?.status === 'ACTIVE';
  const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(500)}>
      <TouchableOpacity
        style={[s.heroCard, { backgroundColor: C.s2, borderColor: C.bd }]}
        onPress={onPressCard}
        activeOpacity={0.88}
      >
        <View style={[s.heroAccent, { backgroundColor: C.primary }]} />
        <View style={s.heroInner}>
          {/* Avatar */}
          <View style={s.heroAvatarCol}>
            <View style={s.heroAvatarRing}>
              {isActive && <RingGlow color={C.ok} />}
              <View style={[s.heroAvatar, { backgroundColor: C.primaryBg, borderColor: meta.color + '55' }]}>
                <Text style={[s.heroAvatarInitials, { color: C.primary }]}>{initials}</Text>
              </View>
              <View style={[s.verifiedBadge, { backgroundColor: isActive ? C.ok : meta.color, borderColor: C.s2 }]}>
                <Feather name={isActive ? 'check' : 'minus'} size={8} color="#fff" />
              </View>
            </View>
          </View>

          {/* Meta */}
          <View style={s.heroMeta}>
            <Text style={[s.heroName, { color: C.tx }]} numberOfLines={1}>
              {student?.first_name ?? '—'} {student?.last_name ?? ''}
            </Text>
            <View style={s.heroChipRow}>
              {(student?.class || student?.section) && (
                <View style={[s.chip, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
                  <Text style={[s.chipTx, { color: C.primary }]}>
                    {student.class}{student.section ? `-${student.section}` : ''}
                  </Text>
                </View>
              )}
              {school?.name && (
                <View style={[s.chip, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                  <Text style={[s.chipTx, { color: C.blue }]} numberOfLines={1}>{school.name}</Text>
                </View>
              )}
            </View>
            <View style={s.heroCardNumRow}>
              <MaterialCommunityIcons name="qrcode" size={11} color={C.tx3} />
              <Text style={[s.heroCardNum, { color: C.tx3 }]}>{card?.card_number ?? t('home.notAssigned')}</Text>
            </View>
          </View>

          {/* Right */}
          <View style={s.heroRight}>
            <View style={[s.statusPill, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
              {meta.pulse && <PulseDot color={meta.color} size={6} />}
              <Text style={[s.statusPillTx, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <View style={[s.heroQrBtn, { backgroundColor: C.s3, borderColor: C.bd2 }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={C.tx} />
            </View>
          </View>
        </View>

        {token?.expires_at && (
          <View style={[s.heroFooter, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
            <Feather name="clock" size={11} color={C.tx3} />
            <Text style={[s.heroFooterTx, { color: C.tx3 }]}>{t('home.validUntil', { date: fmtDate(token.expires_at) })}</Text>
            <View style={[s.heroDivider, { backgroundColor: C.bd }]} />
            <Feather name="shield" size={11} color={isActive ? C.ok : C.tx3} />
            <Text style={[s.heroFooterTx, { color: isActive ? C.ok : C.tx3 }]}>
              {isActive ? t('home.protected') : t('home.statusInactive')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Anomaly alert ────────────────────────────────────────────────────────────
function AnomalyAlert({ anomaly, onPress, delay, C }) {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity
        style={[s.anomalyCard, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[s.anomalyIconWrap, { backgroundColor: C.ambBg }]}>
          <Animated.View style={{ opacity: pulse }}>
            <Feather name="alert-triangle" size={18} color={C.amb} />
          </Animated.View>
        </View>
        <View style={s.anomalyBody}>
          <Text style={[s.anomalyTitle, { color: C.amb }]}>{t('home.suspiciousScan')}</Text>
          <Text style={[s.anomalyDesc, { color: C.amb }]} numberOfLines={2}>{anomaly.reason}</Text>
        </View>
        <Feather name="chevron-right" size={15} color={C.amb} />
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────
function QuickActions({ onShowQR, onEditProfile, onScanHistory, delay, C }) {
  const { t } = useTranslation();
  const actions = [
    { label: t('home.showQR'), sub: t('home.emergencyAccess'), icon: <MaterialCommunityIcons name="qrcode-scan" size={22} color={C.primary} />, bg: C.primaryBg, bd: C.primaryBd, onPress: onShowQR },
    { label: t('home.editProfile'), sub: t('home.medicalInfo'), icon: <Feather name="edit-2" size={19} color={C.blue} />, bg: C.blueBg, bd: C.blueBd, onPress: onEditProfile },
    { label: t('home.scanLogs'), sub: t('home.activityHistory'), icon: <Feather name="activity" size={19} color={C.tx2} />, bg: C.s4, bd: C.bd, onPress: onScanHistory },
  ];
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={s.quickRow}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={[s.quickCard, { backgroundColor: C.s2, borderColor: C.bd }]}
          onPress={a.onPress}
          activeOpacity={0.75}
        >
          <View style={[s.quickIconWrap, { backgroundColor: a.bg, borderColor: a.bd }]}>{a.icon}</View>
          <Text style={[s.quickLabel, { color: C.tx }]}>{a.label}</Text>
          <Text style={[s.quickSub, { color: C.tx3 }]}>{a.sub}</Text>
        </TouchableOpacity>
      ))}
    </Animated2.View>
  );
}

// ─── Completeness ring ────────────────────────────────────────────────────────
function CompletenessRing({ pct, isComplete, C }) {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);
  const color = isComplete ? C.ok : pct >= 60 ? C.amb : C.primary;
  return (
    <View style={s.ringWrap}>
      <View style={[s.ringTrack, { borderColor: color + '22' }]} />
      <View style={s.ringCenter}>
        <Text style={[s.ringPct, { color }]}>{pct}<Text style={s.ringPctSign}>%</Text></Text>
        <Text style={[s.ringLabel, { color: C.tx3 }]}>{isComplete ? t('home.complete') : t('home.done')}</Text>
      </View>
      <View style={[s.ringBarBg, { backgroundColor: C.s4 }]}>
        <Animated.View style={[s.ringBarFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Emergency card ───────────────────────────────────────────────────────────
function EmergencyCard({ emergencyProfile: ep, contacts, onEdit, delay, C }) {
  const { t } = useTranslation();
  const completeness = profileCompleteness(ep, contacts);
  const missing = missingFields(ep, contacts, t);
  const isComplete = completeness === 100;
  const topContacts = [...(contacts ?? [])].sort((a, b) => a.priority - b.priority).slice(0, 2);
  const avatarColors = [C.primary, C.blue];

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <SectionCard
        title={t('home.emergencyProfile')}
        icon={<Feather name="heart" size={13} color={C.primary} />}
        actionLabel={t('common.edit')}
        onAction={onEdit}
        C={C}
      >
        <View style={[s.completeRow, { borderBottomColor: C.bd }]}>
          <CompletenessRing pct={completeness} isComplete={isComplete} C={C} />
          <View style={s.completeRight}>
            <Text style={[s.completeHeadline, { color: C.tx }]}>{isComplete ? t('home.profileReady') : t('home.profileIncomplete')}</Text>
            <Text style={[s.completeBody, { color: C.tx3 }]}>{isComplete ? t('home.profileReadyDesc') : t('home.profileIncompleteDesc', { count: missing.length })}</Text>
            {!isComplete && (
              <TouchableOpacity style={s.completeBtn} onPress={onEdit} activeOpacity={0.8}>
                <Text style={[s.completeBtnTx, { color: C.amb }]}>{t('home.completeNow')}</Text>
                <Feather name="arrow-right" size={12} color={C.amb} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {missing.length > 0 && (
          <TouchableOpacity
            style={[s.missingStrip, { backgroundColor: C.ambBg, borderBottomColor: C.ambBd }]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Feather name="alert-circle" size={13} color={C.amb} />
            <Text style={[s.missingTx, { color: C.amb }]}>
              {t('home.missing')}: {missing.slice(0, 3).join(' · ')}{missing.length > 3 ? ` +${missing.length - 3}` : ''}
            </Text>
            <Feather name="chevron-right" size={12} color={C.amb} />
          </TouchableOpacity>
        )}

        {ep?.blood_group && (
          <View style={[s.bloodStrip, { borderBottomColor: C.bd }]}>
            <View style={[s.bloodIconBox, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
              <Text style={{ fontSize: 18 }}>🩸</Text>
            </View>
            <View style={s.bloodInfo}>
              <Text style={[s.bloodLbl, { color: C.tx3 }]}>{t('updates.bloodGroup')}</Text>
              <Text style={[s.bloodVal, { color: C.primary }]}>{ep.blood_group}</Text>
            </View>
            {ep?.allergies && (
              <View style={[s.allergyPill, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                <Feather name="alert-triangle" size={10} color={C.amb} />
                <Text style={[s.allergyTx, { color: C.amb }]} numberOfLines={1}>{ep.allergies.split(',')[0].trim()}</Text>
              </View>
            )}
          </View>
        )}

        {topContacts.length > 0 && <View style={[s.hdivider, { backgroundColor: C.bd }]} />}
        {topContacts.map((c, i) => (
          <View key={c.id ?? i} style={[s.contactRow, i < topContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
            <View style={[s.contactAv, { backgroundColor: avatarColors[i] + '18', borderColor: avatarColors[i] + '35' }]}>
              <Text style={[s.contactAvTx, { color: avatarColors[i] }]}>{c.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.contactName, { color: C.tx }]}>{c.name}</Text>
              <Text style={[s.contactRel, { color: C.tx3 }]}>{c.relationship ?? t('home.guardian')}{c.priority === 1 ? `  ·  ${t('home.primary')}` : ''}</Text>
            </View>
            <TouchableOpacity
              style={[s.callBtn, { backgroundColor: C.okBg, borderColor: C.okBd }]}
              onPress={() => Linking.openURL(`tel:${c.phone}`)}
              activeOpacity={0.7}
            >
              <Feather name="phone-call" size={14} color={C.ok} />
            </TouchableOpacity>
          </View>
        ))}

        {topContacts.length === 0 && (
          <TouchableOpacity style={s.addContactNudge} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="user-plus" size={14} color={C.primary} />
            <Text style={[s.addContactTx, { color: C.primary }]}>{t('home.addContactNudge')}</Text>
          </TouchableOpacity>
        )}
      </SectionCard>
    </Animated2.View>
  );
}

// ─── Last scan card ───────────────────────────────────────────────────────────
function LastScanCard({ scan, totalScans, onPress, delay, C }) {
  const { t } = useTranslation();
  const isEmergency = scan?.scan_purpose === 'EMERGENCY';
  const location = [scan?.ip_city, scan?.ip_region].filter(Boolean).join(', ');
  const isSuccess = scan?.result === 'SUCCESS';
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <SectionCard
        title={t('home.lastScan')}
        icon={<Feather name="radio" size={13} color={C.tx3} />}
        actionLabel={t('home.viewAll', { count: totalScans })}
        onAction={onPress}
        C={C}
      >
        {!scan ? (
          <View style={s.noScanWrap}>
            <View style={[s.noScanIconBox, { backgroundColor: C.s3, borderColor: C.bd }]}>
              <Feather name="maximize-2" size={20} color={C.tx3} />
            </View>
            <Text style={[s.noScanTitle, { color: C.tx2 }]}>{t('home.noScansYet')}</Text>
            <Text style={[s.noScanBody, { color: C.tx3 }]}>{t('home.noScansBody')}</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.scanRow} onPress={onPress} activeOpacity={0.85}>
            <View style={[s.scanTypeDot, { backgroundColor: isEmergency ? C.red : C.ok }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.scanTypeLabel, { color: C.tx }]}>{isEmergency ? `🆘 ${t('home.emergencyScan')}` : `👁 ${t('home.generalScan')}`}</Text>
              <View style={s.scanMeta}>
                {location ? (<><Feather name="map-pin" size={11} color={C.tx3} /><Text style={[s.scanMetaTx, { color: C.tx3 }]}>{location}</Text><Text style={[s.scanMetaDot, { color: C.tx3 }]}>·</Text></>) : null}
                <Text style={[s.scanMetaTx, { color: C.tx3 }]}>{fmtRelTime(scan.created_at, t)}</Text>
              </View>
            </View>
            <View style={[s.scanResultBadge, { backgroundColor: isSuccess ? C.okBg : C.redBg, borderColor: isSuccess ? C.okBd : C.redBd }]}>
              <Text style={[s.scanResultTx, { color: isSuccess ? C.ok : C.red }]}>{scan.result}</Text>
            </View>
          </TouchableOpacity>
        )}
      </SectionCard>
    </Animated2.View>
  );
}

// ─── Safety tip ───────────────────────────────────────────────────────────────
function SafetyTip({ delay, C }) {
  const { t } = useTranslation();
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={[s.safetyTip, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
        <View style={[s.safetyIconWrap, { backgroundColor: C.okBg }]}>
          <Feather name="shield" size={16} color={C.ok} />
        </View>
        <Text style={[s.safetyTx, { color: C.tx2 }]}>{t('home.safetyTip')}</Text>
      </View>
    </Animated2.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const { parentUser } = useAuthStore();

  const activeStudent = useProfileStore(
    useShallow((s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null)
  );
  const lastScanRaw = useProfileStore((s) => s.lastScan);
  const anomalyRaw = useProfileStore((s) => s.anomaly);

  const hour = new Date().getHours();
  const greetingText = hour < 12 ? t('home.goodMorning') : hour < 17 ? t('home.goodAfternoon') : t('home.goodEvening');

  const school = activeStudent?.school ?? null;
  const token = activeStudent?.token ?? null;
  const card = token?.card_number ? { card_number: token.card_number } : null;
  const emergencyProfile = activeStudent?.emergency ?? null;
  const contacts = activeStudent?.emergency?.contacts ?? [];
  const lastScan = lastScanRaw ?? null;
  const totalScans = lastScan ? 1 : 0;
  const unresolvedAnomaly = anomalyRaw && !anomalyRaw.resolved ? anomalyRaw : null;

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Greeting */}
        <Animated2.View entering={FadeInDown.delay(0).duration(400)} style={s.greetWrap}>
          <View>
            <Text style={[s.greetLine, { color: C.tx }]}>
              {greetingText}{parentUser?.phone ? ' 👋' : ''}
            </Text>
            <Text style={[s.greetSub, { color: C.tx3 }]}>
              {activeStudent?.first_name ? t('home.subtitleNamed', { name: activeStudent.first_name }) : t('home.subtitle')}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.notifBtn, { backgroundColor: C.s2, borderColor: C.bd }]}
            onPress={() => router.push('/(app)/scan-history')}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={18} color={C.tx2} />
            {unresolvedAnomaly && <View style={[s.notifDot, { backgroundColor: C.amb, borderColor: C.bg }]} />}
          </TouchableOpacity>
        </Animated2.View>

        <HeroCard student={activeStudent} school={school} token={token} card={card} onPressCard={() => router.push('/(app)/qr')} delay={60} C={C} />
        {unresolvedAnomaly && <AnomalyAlert anomaly={unresolvedAnomaly} onPress={() => router.push('/(app)/scan-history')} delay={100} C={C} />}
        <QuickActions onShowQR={() => router.push('/(app)/qr')} onEditProfile={() => router.push('/(app)/updates')} onScanHistory={() => router.push('/(app)/scan-history')} delay={140} C={C} />
        <EmergencyCard emergencyProfile={emergencyProfile} contacts={contacts} onEdit={() => router.push('/(app)/updates')} delay={180} C={C} />
        <LastScanCard scan={lastScan} totalScans={totalScans} onPress={() => router.push('/(app)/scan-history')} delay={220} C={C} />
        <SafetyTip delay={260} C={C} />

      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 16, paddingBottom: 48, gap: 14 },
  greetWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  greetLine: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  greetSub: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  notifBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5 },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20 }, android: { elevation: 8 } }) },
  heroAccent: { height: 3, width: '100%' },
  heroInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  heroAvatarCol: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroAvatarRing: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroAvatar: { width: 58, height: 58, borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  heroAvatarInitials: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  heroMeta: { flex: 1, gap: 4 },
  heroName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  heroChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  chipTx: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.1 },
  heroCardNumRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroCardNum: { fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  heroRight: { alignItems: 'center', gap: 8, flexShrink: 0 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  statusPillTx: { fontSize: 11, fontWeight: '800', letterSpacing: 0.1 },
  heroQrBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  heroFooterTx: { fontSize: 11.5, fontWeight: '500' },
  heroDivider: { width: 1, height: 12, marginHorizontal: 4 },
  anomalyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  anomalyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  anomalyBody: { flex: 1 },
  anomalyTitle: { fontSize: 13.5, fontWeight: '800' },
  anomalyDesc: { fontSize: 12, opacity: 0.75, marginTop: 3, lineHeight: 16 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: { flex: 1, alignItems: 'center', gap: 7, borderRadius: 16, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 6 },
  quickIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quickLabel: { fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  quickSub: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionActionText: { fontSize: 12.5, fontWeight: '700' },
  completeRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderBottomWidth: 1 },
  ringWrap: { width: 68, height: 68, flexShrink: 0, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringTrack: { position: 'absolute', inset: 0, borderRadius: 999, borderWidth: 4 },
  ringCenter: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  ringPct: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  ringPctSign: { fontSize: 11, fontWeight: '700' },
  ringLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },
  ringBarBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2, overflow: 'hidden' },
  ringBarFill: { height: '100%', borderRadius: 2 },
  completeRight: { flex: 1, gap: 5 },
  completeHeadline: { fontSize: 14, fontWeight: '800' },
  completeBody: { fontSize: 12.5, lineHeight: 17 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  completeBtnTx: { fontSize: 12, fontWeight: '700' },
  missingStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  missingTx: { fontSize: 12, flex: 1, fontWeight: '600' },
  bloodStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  bloodIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bloodInfo: { gap: 2 },
  bloodLbl: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  bloodVal: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  allergyPill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  allergyTx: { fontSize: 11, fontWeight: '700', maxWidth: 90 },
  hdivider: { height: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  contactAv: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactAvTx: { fontSize: 15, fontWeight: '900' },
  contactName: { fontSize: 14, fontWeight: '700' },
  contactRel: { fontSize: 11.5, marginTop: 2 },
  callBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addContactNudge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  addContactTx: { fontSize: 13, fontWeight: '700', flex: 1 },
  noScanWrap: { alignItems: 'center', padding: 28, gap: 8 },
  noScanIconBox: { width: 52, height: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noScanTitle: { fontSize: 14, fontWeight: '800' },
  noScanBody: { fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  scanTypeDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  scanTypeLabel: { fontSize: 14, fontWeight: '700' },
  scanMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  scanMetaTx: { fontSize: 11.5 },
  scanMetaDot: { fontSize: 10 },
  scanResultBadge: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  scanResultTx: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  safetyTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  safetyIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  safetyTx: { fontSize: 12.5, flex: 1, lineHeight: 18, fontWeight: '500', paddingTop: 6 },
});