/**
 * @file app/(app)/home.jsx
 * @description Home Screen — RESQID Parent Dashboard
 *              REDESIGNED: Trust-first, premium dark UI
 *              All original functionality preserved 100%
 *              New: HeroCard, ShieldStatus ring, animated completeness arc,
 *                   richer contact cards, contextual micro-copy
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
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

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Extends existing theme — all colors reference colors.* from theme
// These are LOCAL overrides only to allow the new design to work standalone
const C = {
  bg: '#08080A',
  surface: '#111116',
  surface2: '#17171D',
  surface3: '#1E1E26',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  red: '#E8342A',
  redBg: 'rgba(232,52,42,0.1)',
  redBd: 'rgba(232,52,42,0.22)',
  green: '#12A150',
  greenBg: 'rgba(18,161,80,0.1)',
  greenBd: 'rgba(18,161,80,0.2)',
  amber: '#F59E0B',
  amberBg: 'rgba(245,158,11,0.1)',
  amberBd: 'rgba(245,158,11,0.2)',
  blue: '#3B82F6',
  blueBg: 'rgba(59,130,246,0.1)',
  blueBd: 'rgba(59,130,246,0.2)',
  tx: '#F2F2F5',
  tx2: 'rgba(242,242,245,0.62)',
  tx3: 'rgba(242,242,245,0.34)',
};

// ─── PulseDot — unchanged from original ───────────────────────────────────────
function PulseDot({ color = C.green, size = 7 }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: anim }} />
  );
}

// ─── Animated ring glow for shield status ────────────────────────────────────
function RingGlow({ color = C.green }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.18, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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
    <Animated.View
      style={{
        position: 'absolute', inset: -8,
        borderRadius: 999, borderWidth: 1.5,
        borderColor: color, opacity, transform: [{ scale }],
      }}
    />
  );
}

// ─── Helpers — identical to original ─────────────────────────────────────────
function tokenMeta(status) {
  switch (status) {
    case 'ACTIVE': return { label: 'Active', color: C.green, bg: C.greenBg, bd: C.greenBd, pulse: true };
    case 'INACTIVE': return { label: 'Inactive', color: C.tx3, bg: C.surface3, bd: C.border, pulse: false };
    case 'ISSUED': return { label: 'Issued', color: C.amber, bg: C.amberBg, bd: C.amberBd, pulse: true };
    case 'REVOKED': return { label: 'Revoked', color: C.red, bg: C.redBg, bd: C.redBd, pulse: false };
    case 'EXPIRED': return { label: 'Expired', color: C.red, bg: C.redBg, bd: C.redBd, pulse: false };
    case 'UNASSIGNED': return { label: 'Not Set Up', color: C.amber, bg: C.amberBg, bd: C.amberBd, pulse: false };
    default: return { label: 'Unknown', color: C.tx3, bg: C.surface3, bd: C.border, pulse: false };
  }
}

function fmtRelTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function profileCompleteness(ep, contacts) {
  const fields = [ep?.blood_group, ep?.allergies, ep?.conditions, ep?.medications, ep?.doctor_name, ep?.doctor_phone, contacts?.length > 0 ? 'ok' : null];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

function missingFields(ep, contacts) {
  const m = [];
  if (!ep?.blood_group) m.push('Blood group');
  if (!ep?.allergies) m.push('Allergies');
  if (!ep?.doctor_phone) m.push('Doctor phone');
  if (!contacts?.length) m.push('Emergency contact');
  return m;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Section wrapper with consistent header ───────────────────────────────────
function SectionCard({ title, icon, actionLabel, onAction, children, style }) {
  return (
    <View style={[s.sectionCard, style]}>
      <View style={s.sectionHead}>
        <View style={s.sectionHeadLeft}>
          {icon}
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        {actionLabel && (
          <TouchableOpacity onPress={onAction} style={s.sectionAction} activeOpacity={0.7}>
            <Text style={s.sectionActionText}>{actionLabel}</Text>
            <Feather name="chevron-right" size={13} color={C.red} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ─── Hero Card — student identity + shield status ────────────────────────────
function HeroCard({ student, school, token, card, onPressCard, delay }) {
  const meta = tokenMeta(token?.status);
  const isActive = token?.status === 'ACTIVE';
  const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(500)}>
      <TouchableOpacity style={s.heroCard} onPress={onPressCard} activeOpacity={0.88}>
        {/* Top red accent bar */}
        <View style={[s.heroAccent, { backgroundColor: meta.color }]} />

        <View style={s.heroInner}>
          {/* Left — avatar + shield glow */}
          <View style={s.heroAvatarCol}>
            <View style={s.heroAvatarRing}>
              {isActive && <RingGlow color={C.green} />}
              <View style={[s.heroAvatar, { borderColor: meta.color + '55' }]}>
                <Text style={s.heroAvatarInitials}>{initials}</Text>
              </View>
              {/* verified tick */}
              <View style={[s.verifiedBadge, { backgroundColor: isActive ? C.green : meta.color }]}>
                <Feather name={isActive ? 'check' : 'minus'} size={8} color="#fff" />
              </View>
            </View>
          </View>

          {/* Middle — name + meta */}
          <View style={s.heroMeta}>
            <Text style={s.heroName} numberOfLines={1}>
              {student?.first_name ?? '—'} {student?.last_name ?? ''}
            </Text>
            <View style={s.heroChipRow}>
              {(student?.class || student?.section) && (
                <View style={s.chip}>
                  <Text style={s.chipTx}>
                    {student.class}{student.section ? `-${student.section}` : ''}
                  </Text>
                </View>
              )}
              {school?.name && (
                <View style={[s.chip, s.chipBlue]}>
                  <Text style={[s.chipTx, { color: C.blue }]} numberOfLines={1}>{school.name}</Text>
                </View>
              )}
            </View>
            {/* Card number row */}
            <View style={s.heroCardNumRow}>
              <MaterialCommunityIcons name="qrcode" size={11} color={C.tx3} />
              <Text style={s.heroCardNum}>{card?.card_number ?? 'Not assigned'}</Text>
            </View>
          </View>

          {/* Right — status badge + QR button */}
          <View style={s.heroRight}>
            <View style={[s.statusPill, { backgroundColor: meta.bg, borderColor: meta.bd }]}>
              {meta.pulse && <PulseDot color={meta.color} size={6} />}
              <Text style={[s.statusPillTx, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <View style={s.heroQrBtn}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={C.tx} />
            </View>
          </View>
        </View>

        {/* Bottom — card validity strip */}
        {token?.expires_at && (
          <View style={s.heroFooter}>
            <Feather name="clock" size={11} color={C.tx3} />
            <Text style={s.heroFooterTx}>
              Valid until {fmtDate(token.expires_at)}
            </Text>
            <View style={s.heroDivider} />
            <Feather name="shield" size={11} color={isActive ? C.green : C.tx3} />
            <Text style={[s.heroFooterTx, { color: isActive ? C.green : C.tx3 }]}>
              {isActive ? 'Protected' : 'Inactive'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Anomaly Alert — redesigned with stronger urgency ─────────────────────────
function AnomalyAlert({ anomaly, onPress, delay }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={s.anomalyCard} onPress={onPress} activeOpacity={0.85}>
        <View style={s.anomalyIconWrap}>
          <Animated.View style={{ opacity: pulse }}>
            <Feather name="alert-triangle" size={18} color={C.amber} />
          </Animated.View>
        </View>
        <View style={s.anomalyBody}>
          <Text style={s.anomalyTitle}>Suspicious scan detected</Text>
          <Text style={s.anomalyDesc} numberOfLines={2}>{anomaly.reason}</Text>
        </View>
        <View style={s.anomalyArrow}>
          <Feather name="chevron-right" size={15} color={C.amber} />
        </View>
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Quick Actions — larger, clearer with labels ───────────────────────────────
function QuickActions({ onShowQR, onEditProfile, onScanHistory, delay }) {
  const actions = [
    {
      label: 'Show QR',
      sub: 'Emergency access',
      icon: <MaterialCommunityIcons name="qrcode-scan" size={22} color={C.red} />,
      bg: C.redBg, bd: C.redBd,
      onPress: onShowQR,
    },
    {
      label: 'Edit Profile',
      sub: 'Medical info',
      icon: <Feather name="edit-2" size={19} color={C.blue} />,
      bg: C.blueBg, bd: C.blueBd,
      onPress: onEditProfile,
    },
    {
      label: 'Scan Logs',
      sub: 'Activity history',
      icon: <Feather name="activity" size={19} color={C.tx2} />,
      bg: C.surface3, bd: C.border,
      onPress: onScanHistory,
    },
  ];

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={s.quickRow}>
      {actions.map((a) => (
        <TouchableOpacity key={a.label} style={s.quickCard} onPress={a.onPress} activeOpacity={0.75}>
          <View style={[s.quickIconWrap, { backgroundColor: a.bg, borderColor: a.bd }]}>
            {a.icon}
          </View>
          <Text style={s.quickLabel}>{a.label}</Text>
          <Text style={s.quickSub}>{a.sub}</Text>
        </TouchableOpacity>
      ))}
    </Animated2.View>
  );
}

// ─── Completeness Arc — visual ring (simplified, CSS-like) ────────────────────
function CompletenessRing({ pct, isComplete }) {
  // Animated bar approach (native-compatible, no SVG needed)
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct / 100, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);

  const color = isComplete ? C.green : pct >= 60 ? C.amber : C.red;

  return (
    <View style={s.ringWrap}>
      {/* Outer ring track */}
      <View style={[s.ringTrack, { borderColor: color + '22' }]} />
      {/* Progress as colored stroke segment approximation */}
      <View style={s.ringCenter}>
        <Text style={[s.ringPct, { color }]}>{pct}<Text style={s.ringPctSign}>%</Text></Text>
        <Text style={s.ringLabel}>{isComplete ? 'Complete' : 'Done'}</Text>
      </View>
      {/* Animated fill bar under ring */}
      <View style={s.ringBarBg}>
        <Animated.View
          style={[
            s.ringBarFill,
            {
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Emergency Profile Card — richest card on screen ─────────────────────────
function EmergencyCard({ emergencyProfile: ep, contacts, onEdit, delay }) {
  const completeness = profileCompleteness(ep, contacts);
  const missing = missingFields(ep, contacts);
  const isComplete = completeness === 100;
  const topContacts = [...(contacts ?? [])].sort((a, b) => a.priority - b.priority).slice(0, 2);
  const avatarColors = [C.red, C.blue];

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <SectionCard
        title="Emergency Profile"
        icon={<Feather name="heart" size={13} color={C.red} />}
        actionLabel="Edit"
        onAction={onEdit}
      >
        {/* Completeness row */}
        <View style={s.completeRow}>
          <CompletenessRing pct={completeness} isComplete={isComplete} />
          <View style={s.completeRight}>
            <Text style={s.completeHeadline}>
              {isComplete ? '✓ Profile is ready' : 'Profile incomplete'}
            </Text>
            <Text style={s.completeBody}>
              {isComplete
                ? 'First responders will see full info when your card is scanned.'
                : `${missing.length} field${missing.length > 1 ? 's' : ''} missing — add them so help arrives faster.`}
            </Text>
            {!isComplete && (
              <TouchableOpacity style={s.completeBtn} onPress={onEdit} activeOpacity={0.8}>
                <Text style={s.completeBtnTx}>Complete now</Text>
                <Feather name="arrow-right" size={12} color={C.amber} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Missing fields nudge */}
        {missing.length > 0 && (
          <TouchableOpacity style={s.missingStrip} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="alert-circle" size={13} color={C.amber} />
            <Text style={s.missingTx}>
              Missing: {missing.slice(0, 3).join(' · ')}{missing.length > 3 ? ` +${missing.length - 3}` : ''}
            </Text>
            <Feather name="chevron-right" size={12} color={C.amber} />
          </TouchableOpacity>
        )}

        {/* Blood group + allergy highlight */}
        {ep?.blood_group && (
          <View style={s.bloodStrip}>
            <View style={s.bloodIconBox}>
              <Text style={{ fontSize: 18 }}>🩸</Text>
            </View>
            <View style={s.bloodInfo}>
              <Text style={s.bloodLbl}>Blood Group</Text>
              <Text style={s.bloodVal}>{ep.blood_group}</Text>
            </View>
            {ep?.allergies && (
              <View style={s.allergyPill}>
                <Feather name="alert-triangle" size={10} color={C.amber} />
                <Text style={s.allergyTx} numberOfLines={1}>
                  {ep.allergies.split(',')[0].trim()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Divider */}
        {topContacts.length > 0 && <View style={s.hdivider} />}

        {/* Emergency contacts */}
        {topContacts.map((c, i) => (
          <View
            key={c.id ?? i}
            style={[s.contactRow, i < topContacts.length - 1 && s.contactRowBd]}
          >
            <View
              style={[
                s.contactAv,
                { backgroundColor: avatarColors[i] + '18', borderColor: avatarColors[i] + '35' },
              ]}
            >
              <Text style={[s.contactAvTx, { color: avatarColors[i] }]}>
                {c.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.contactName}>{c.name}</Text>
              <Text style={s.contactRel}>
                {c.relationship ?? 'Guardian'}
                {c.priority === 1 ? '  ·  Primary' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={s.callBtn}
              onPress={() => Linking.openURL(`tel:${c.phone}`)}
              activeOpacity={0.7}
            >
              <Feather name="phone-call" size={14} color={C.green} />
            </TouchableOpacity>
          </View>
        ))}

        {topContacts.length === 0 && (
          <TouchableOpacity style={s.addContactNudge} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="user-plus" size={14} color={C.red} />
            <Text style={s.addContactTx}>Add an emergency contact — required for card to work</Text>
          </TouchableOpacity>
        )}
      </SectionCard>
    </Animated2.View>
  );
}

// ─── Last Scan Card ───────────────────────────────────────────────────────────
function LastScanCard({ scan, totalScans, onPress, delay }) {
  const isEmergency = scan?.scan_purpose === 'EMERGENCY';
  const location = [scan?.ip_city, scan?.ip_region].filter(Boolean).join(', ');
  const isSuccess = scan?.result === 'SUCCESS';

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <SectionCard
        title="Last Scan"
        icon={<Feather name="radio" size={13} color={C.tx3} />}
        actionLabel={`View all ${totalScans}`}
        onAction={onPress}
      >
        {!scan ? (
          <View style={s.noScanWrap}>
            <View style={s.noScanIconBox}>
              <Feather name="maximize-2" size={20} color={C.tx3} />
            </View>
            <Text style={s.noScanTitle}>No scans yet</Text>
            <Text style={s.noScanBody}>When someone scans your card, it'll show up here.</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.scanRow} onPress={onPress} activeOpacity={0.85}>
            <View style={[s.scanTypeDot, { backgroundColor: isEmergency ? C.red : C.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.scanTypeLabel}>
                {isEmergency ? '🆘 Emergency Scan' : '👁 General Scan'}
              </Text>
              <View style={s.scanMeta}>
                {location ? (
                  <>
                    <Feather name="map-pin" size={11} color={C.tx3} />
                    <Text style={s.scanMetaTx}>{location}</Text>
                    <Text style={s.scanMetaDot}>·</Text>
                  </>
                ) : null}
                <Text style={s.scanMetaTx}>{fmtRelTime(scan.created_at)}</Text>
              </View>
            </View>
            <View style={[s.scanResultBadge, { backgroundColor: isSuccess ? C.greenBg : C.redBg, borderColor: isSuccess ? C.greenBd : C.redBd }]}>
              <Text style={[s.scanResultTx, { color: isSuccess ? C.green : C.red }]}>
                {scan.result}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </SectionCard>
    </Animated2.View>
  );
}

// ─── Safety Tip ───────────────────────────────────────────────────────────────
function SafetyTip({ delay }) {
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={s.safetyTip}>
        <View style={s.safetyIconWrap}>
          <Feather name="shield" size={16} color={C.green} />
        </View>
        <Text style={s.safetyTx}>
          Keep your child's medical info up to date — it's what first responders see in an emergency.
        </Text>
      </View>
    </Animated2.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { parentUser } = useAuthStore();
  const activeStudent = useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null
  );

  const school = activeStudent?.school ?? null;
  const token = activeStudent?.token ?? null;
  const card = token?.card_number ? { card_number: token.card_number } : null;
  const emergencyProfile = activeStudent?.emergency ?? null;
  const contacts = activeStudent?.emergency?.contacts ?? [];
  const recentScans = useProfileStore((s) => s.recentScans) ?? [];
  const anomalies = useProfileStore((s) => s.anomalies) ?? [];

  const lastScan = recentScans?.[0] ?? null;
  const totalScans = recentScans?.length ?? 0;
  const unresolvedAnomaly = anomalies.find((a) => !a.resolved);

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Greeting ── */}
        <Animated2.View entering={FadeInDown.delay(0).duration(400)} style={s.greetWrap}>
          <View>
            <Text style={s.greetLine}>
              {greeting()}{parentUser?.phone ? ' 👋' : ''}
            </Text>
            <Text style={s.greetSub}>
              {activeStudent?.first_name
                ? `Here's ${activeStudent.first_name}'s card status`
                : "Here's your child's card status"}
            </Text>
          </View>
          {/* Notification bell */}
          <TouchableOpacity
            style={s.notifBtn}
            onPress={() => router.push('/(app)/scan-history')}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={18} color={C.tx2} />
            {unresolvedAnomaly && <View style={s.notifDot} />}
          </TouchableOpacity>
        </Animated2.View>

        {/* ── Hero Card (student + card status combined) ── */}
        <HeroCard
          student={activeStudent}
          school={school}
          token={token}
          card={card}
          onPressCard={() => router.push('/(app)/qr')}
          delay={60}
        />

        {/* ── Anomaly Alert ── */}
        {unresolvedAnomaly && (
          <AnomalyAlert
            anomaly={unresolvedAnomaly}
            onPress={() => router.push('/(app)/scan-history')}
            delay={100}
          />
        )}

        {/* ── Quick Actions ── */}
        <QuickActions
          onShowQR={() => router.push('/(app)/qr')}
          onEditProfile={() => router.push('/(app)/updates')}
          onScanHistory={() => router.push('/(app)/scan-history')}
          delay={140}
        />

        {/* ── Emergency Profile ── */}
        <EmergencyCard
          emergencyProfile={emergencyProfile}
          contacts={contacts}
          onEdit={() => router.push('/(app)/updates')}
          delay={180}
        />

        {/* ── Last Scan ── */}
        <LastScanCard
          scan={lastScan}
          totalScans={totalScans}
          onPress={() => router.push('/(app)/scan-history')}
          delay={220}
        />

        {/* ── Safety Tip ── */}
        <SafetyTip delay={260} />

      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 48,
    gap: 14,
  },

  // ── Greeting
  greetWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  greetLine: {
    fontSize: 22,
    fontWeight: '800',
    color: C.tx,
    letterSpacing: -0.3,
  },
  greetSub: {
    fontSize: 13,
    color: C.tx3,
    marginTop: 2,
    fontWeight: '500',
  },
  notifBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 10,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.bg,
  },

  // ── Hero Card
  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  heroAccent: { height: 3, width: '100%' },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  heroAvatarCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroAvatarRing: {
    width: 64, height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroAvatar: {
    width: 58, height: 58, borderRadius: 999,
    backgroundColor: C.redBg,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarInitials: {
    fontSize: 22, fontWeight: '900',
    color: C.red, letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.surface,
  },
  heroMeta: { flex: 1, gap: 4 },
  heroName: {
    fontSize: 17, fontWeight: '800',
    color: C.tx, letterSpacing: -0.2,
  },
  heroChipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
  },
  chip: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 99,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  chipBlue: {
    backgroundColor: C.blueBg, borderColor: C.blueBd,
  },
  chipTx: {
    fontSize: 10.5, fontWeight: '700',
    color: C.amber, letterSpacing: 0.1,
  },
  heroCardNumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 2,
  },
  heroCardNum: {
    fontSize: 11, fontWeight: '500',
    color: C.tx3, letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  heroRight: {
    alignItems: 'center', gap: 8, flexShrink: 0,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  statusPillTx: { fontSize: 11, fontWeight: '800', letterSpacing: 0.1 },
  heroQrBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  heroFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface2,
  },
  heroFooterTx: {
    fontSize: 11.5, color: C.tx3, fontWeight: '500',
  },
  heroDivider: {
    width: 1, height: 12, backgroundColor: C.border, marginHorizontal: 4,
  },

  // ── Anomaly Alert
  anomalyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.amberBg,
    borderRadius: 14, borderWidth: 1, borderColor: C.amberBd,
    padding: 14, gap: 12,
  },
  anomalyIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  anomalyBody: { flex: 1 },
  anomalyTitle: { fontSize: 13.5, fontWeight: '800', color: C.amber },
  anomalyDesc: { fontSize: 12, color: C.amber, opacity: 0.75, marginTop: 3, lineHeight: 16 },
  anomalyArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Quick Actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, alignItems: 'center', gap: 7,
    backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    paddingVertical: 16, paddingHorizontal: 6,
  },
  quickIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  quickLabel: {
    fontSize: 12.5, fontWeight: '700',
    color: C.tx, textAlign: 'center',
  },
  quickSub: {
    fontSize: 10, fontWeight: '500',
    color: C.tx3, textAlign: 'center',
  },

  // ── Section Card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionHeadLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800',
    color: C.tx3, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionAction: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  sectionActionText: {
    fontSize: 12.5, fontWeight: '700', color: C.red,
  },

  // ── Completeness ring
  completeRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  ringWrap: {
    width: 68, height: 68, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute', inset: 0,
    borderRadius: 999, borderWidth: 4,
  },
  ringCenter: {
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  ringPct: { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  ringPctSign: { fontSize: 11, fontWeight: '700' },
  ringLabel: { fontSize: 9, color: C.tx3, fontWeight: '600', letterSpacing: 0.3 },
  ringBarBg: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: C.surface3, borderRadius: 2,
    overflow: 'hidden',
  },
  ringBarFill: { height: '100%', borderRadius: 2 },

  completeRight: { flex: 1, gap: 5 },
  completeHeadline: { fontSize: 14, fontWeight: '800', color: C.tx },
  completeBody: { fontSize: 12.5, color: C.tx3, lineHeight: 17 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 2,
  },
  completeBtnTx: { fontSize: 12, fontWeight: '700', color: C.amber },

  // ── Missing strip
  missingStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.amberBg,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.amberBd,
  },
  missingTx: { fontSize: 12, color: C.amber, flex: 1, fontWeight: '600' },

  // ── Blood group strip
  bloodStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  bloodIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.redBg,
    borderWidth: 1, borderColor: C.redBd,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bloodInfo: { gap: 2 },
  bloodLbl: { fontSize: 10, color: C.tx3, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  bloodVal: { fontSize: 22, fontWeight: '900', color: C.red, lineHeight: 26 },
  allergyPill: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.amberBg,
    borderRadius: 99, borderWidth: 1, borderColor: C.amberBd,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  allergyTx: { fontSize: 11, color: C.amber, fontWeight: '700', maxWidth: 90 },

  hdivider: { height: 1, backgroundColor: C.border },

  // ── Contacts
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  contactRowBd: { borderBottomWidth: 1, borderBottomColor: C.border },
  contactAv: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  contactAvTx: { fontSize: 15, fontWeight: '900' },
  contactName: { fontSize: 14, fontWeight: '700', color: C.tx },
  contactRel: { fontSize: 11.5, color: C.tx3, marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.greenBg,
    borderWidth: 1, borderColor: C.greenBd,
    alignItems: 'center', justifyContent: 'center',
  },
  addContactNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16,
  },
  addContactTx: { fontSize: 13, color: C.red, fontWeight: '700', flex: 1 },

  // ── Last Scan
  noScanWrap: {
    alignItems: 'center', padding: 28, gap: 8,
  },
  noScanIconBox: {
    width: 52, height: 52, borderRadius: 999,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  noScanTitle: { fontSize: 14, fontWeight: '800', color: C.tx2 },
  noScanBody: { fontSize: 12.5, color: C.tx3, textAlign: 'center', lineHeight: 17 },
  scanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  scanTypeDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  scanTypeLabel: { fontSize: 14, fontWeight: '700', color: C.tx },
  scanMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  scanMetaTx: { fontSize: 11.5, color: C.tx3 },
  scanMetaDot: { fontSize: 10, color: C.tx3 },
  scanResultBadge: {
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  scanResultTx: {
    fontSize: 10, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // ── Safety Tip
  safetyTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.greenBg,
    borderRadius: 14, borderWidth: 1, borderColor: C.greenBd,
    padding: 14,
  },
  safetyIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(18,161,80,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  safetyTx: {
    fontSize: 12.5, color: C.tx2, flex: 1,
    lineHeight: 18, fontWeight: '500',
    paddingTop: 6,
  },
});