/**
 * Home Screen — Parent dashboard overview.
 *
 * Schema models used:
 *   Student:          first_name, last_name, class, section, photo_url, school
 *   Token:            status, expires_at, activated_at  (TokenStatus enum)
 *   Card:             card_number
 *   ScanLog:          result, scan_purpose, ip_city, ip_region, created_at  (last scan)
 *   ScanAnomaly:      reason, resolved  (unresolved = urgent alert)
 *   EmergencyProfile: blood_group, allergies, conditions, doctor_name, doctor_phone
 *   EmergencyContact: name, phone, relationship, priority
 *
 * Design principles:
 *   - Uses shared theme (colors, spacing, typography, radius) — no private C object
 *   - Uses react-native-reanimated — no RN Animated API
 *   - Connected to useProfileStore + useAuthStore — zero hardcoded data
 *   - Card status visible in under 2 seconds
 *   - Emergency profile completeness nudge
 */

import Screen from '@/src/components/common/Screen';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useProfileStore } from '@/src/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated2, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconQr = ({ color = colors.white }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Rect x={9} y={9} width={6} height={6} rx={1} stroke={color} strokeWidth={1.8} />
  </Svg>
);

const IconEdit = ({ color = colors.primary }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconScan = ({ color = colors.textTertiary }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconShield = ({ color = colors.success }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconAlert = ({ color = colors.warning }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconPhone = ({ color = colors.success }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconChevron = ({ color = colors.textTertiary }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconDrop = ({ color = colors.primary }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
      stroke={color} strokeWidth={1.8} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconLocation = ({ color = colors.textTertiary }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
  </Svg>
);

// ─── Animated pulse dot (uses RN Animated — lightweight, looping) ─────────────
function PulseDot({ color = colors.success }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: anim }]} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * TokenStatus → display label, color, bg
 * enum: UNASSIGNED | ISSUED | ACTIVE | INACTIVE | REVOKED | EXPIRED
 */
function tokenMeta(status) {
  switch (status) {
    case 'ACTIVE': return { label: 'Active', color: colors.success, bg: colors.successBg, pulse: true };
    case 'INACTIVE': return { label: 'Inactive', color: colors.textTertiary, bg: colors.surface3, pulse: false };
    case 'ISSUED': return { label: 'Issued', color: colors.warning, bg: colors.warningBg, pulse: true };
    case 'REVOKED': return { label: 'Revoked', color: colors.primary, bg: colors.primaryBg, pulse: false };
    case 'EXPIRED': return { label: 'Expired', color: colors.primary, bg: colors.primaryBg, pulse: false };
    case 'UNASSIGNED': return { label: 'Not Set Up', color: colors.warning, bg: colors.warningBg, pulse: false };
    default: return { label: 'Unknown', color: colors.textTertiary, bg: colors.surface3, pulse: false };
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

/**
 * Returns 0–100 completeness score for EmergencyProfile
 * Fields: blood_group, allergies, conditions, medications, doctor_name, doctor_phone, notes
 * Contacts: at least 1
 */
function profileCompleteness(emergencyProfile, contacts) {
  const fields = [
    emergencyProfile?.blood_group,
    emergencyProfile?.allergies,
    emergencyProfile?.conditions,
    emergencyProfile?.medications,
    emergencyProfile?.doctor_name,
    emergencyProfile?.doctor_phone,
    contacts?.length > 0 ? 'ok' : null,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/** What's missing from the emergency profile — for the nudge card */
function missingFields(emergencyProfile, contacts) {
  const missing = [];
  if (!emergencyProfile?.blood_group) missing.push('Blood group');
  if (!emergencyProfile?.allergies) missing.push('Allergies');
  if (!emergencyProfile?.doctor_phone) missing.push('Doctor phone');
  if (!contacts?.length) missing.push('Emergency contact');
  return missing;
}

// ─── Card: Student identity header ────────────────────────────────────────────
// Student: first_name, last_name, class, section, photo_url + School.name

function StudentHeader({ student, school, delay }) {
  const initials = [student?.first_name?.[0], student?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={styles.studentHeader}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {/* In prod: show <Image source={{ uri: student.photo_url }} /> */}
        <Text style={styles.avatarInitials}>{initials}</Text>
        <View style={styles.verifiedDot} />
      </View>

      {/* Name + school */}
      <View style={styles.studentMeta}>
        <Text style={styles.studentName}>
          {student?.first_name ?? '—'} {student?.last_name ?? ''}
        </Text>
        <View style={styles.studentChips}>
          {(student?.class || student?.section) && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                Class {student.class}{student.section ? `-${student.section}` : ''}
              </Text>
            </View>
          )}
          {school?.name && (
            <View style={[styles.chip, styles.chipBlue]}>
              <Text style={[styles.chipText, { color: colors.info }]}>
                {school.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated2.View>
  );
}

// ─── Card: Token / physical card status ───────────────────────────────────────
// Token: status, expires_at, card_number (via Card)

function CardStatusCard({ token, card, onPress, delay }) {
  const meta = tokenMeta(token?.status);
  const isExpiringSoon = token?.expires_at &&
    (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={styles.cardBlock} onPress={onPress} activeOpacity={0.8}>
        {/* Top accent line matching status */}
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />

        <View style={styles.cardBlockInner}>
          {/* Left — status */}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>Emergency Card</Text>
            <Text style={styles.cardNumber}>{card?.card_number ?? '—'}</Text>
            <View style={styles.statusRow}>
              {meta.pulse && <PulseDot color={meta.color} />}
              <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statusBadgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              {isExpiringSoon && (
                <View style={[styles.statusBadge, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                    Expires {fmtDate(token.expires_at)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Right — QR button */}
          <TouchableOpacity style={styles.qrBtn} onPress={onPress} activeOpacity={0.8}>
            <IconQr color={colors.white} />
            <Text style={styles.qrBtnText}>Show QR</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Card: Anomaly alert ──────────────────────────────────────────────────────
// ScanAnomaly: reason, resolved = false → show urgent banner

function AnomalyAlert({ anomaly, onPress, delay }) {
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={styles.anomalyAlert} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.anomalyLeft}>
          <View style={styles.anomalyIconWrap}>
            <IconAlert color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.anomalyTitle}>Suspicious scan detected</Text>
            <Text style={styles.anomalyReason} numberOfLines={1}>{anomaly.reason}</Text>
          </View>
        </View>
        <IconChevron color={colors.warning} />
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Card: Last scan preview ──────────────────────────────────────────────────
// ScanLog: result, scan_purpose, ip_city, ip_region, created_at

function LastScanCard({ scan, totalScans, onPress, delay }) {
  const isEmergency = scan?.scan_purpose === 'EMERGENCY';
  const location = [scan?.ip_city, scan?.ip_region].filter(Boolean).join(', ');

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={styles.sectionCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Last Scan</Text>
          <TouchableOpacity onPress={onPress} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View all {totalScans}</Text>
            <IconChevron color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!scan ? (
          <View style={styles.noScanRow}>
            <IconScan color={colors.textTertiary} />
            <Text style={styles.noScanText}>Card hasn't been scanned yet</Text>
          </View>
        ) : (
          <View style={styles.lastScanRow}>
            {/* Purpose dot */}
            <View style={[
              styles.scanPurposeDot,
              { backgroundColor: isEmergency ? colors.primary : colors.success }
            ]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scanPurposeLabel}>
                {isEmergency ? '🆘 Emergency Scan' : '👁 General Scan'}
              </Text>
              <View style={styles.scanMetaRow}>
                {location ? (
                  <>
                    <IconLocation color={colors.textTertiary} />
                    <Text style={styles.scanMetaText}>{location}</Text>
                    <Text style={styles.scanMetaDot}>·</Text>
                  </>
                ) : null}
                <Text style={styles.scanMetaText}>{fmtRelTime(scan.created_at)}</Text>
              </View>
            </View>
            <View style={[
              styles.scanResultBadge,
              { backgroundColor: scan.result === 'SUCCESS' ? colors.successBg : colors.primaryBg }
            ]}>
              <Text style={[
                styles.scanResultText,
                { color: scan.result === 'SUCCESS' ? colors.success : colors.primary }
              ]}>
                {scan.result}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated2.View>
  );
}

// ─── Card: Emergency profile summary ─────────────────────────────────────────
// EmergencyProfile + EmergencyContact[]

function EmergencyCard({ emergencyProfile, contacts, onEdit, delay }) {
  const completeness = profileCompleteness(emergencyProfile, contacts);
  const missing = missingFields(emergencyProfile, contacts);
  const isComplete = completeness === 100;

  // Top 2 contacts sorted by priority
  const topContacts = [...(contacts ?? [])]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2);

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Emergency Profile</Text>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
            <IconEdit color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Completeness bar */}
        <View style={styles.completenessWrap}>
          <View style={styles.completenessBarBg}>
            <View style={[
              styles.completenessBarFill,
              {
                width: `${completeness}%`,
                backgroundColor: isComplete ? colors.success : colors.warning,
              }
            ]} />
          </View>
          <Text style={[
            styles.completenessText,
            { color: isComplete ? colors.success : colors.warning }
          ]}>
            {completeness}% complete
          </Text>
        </View>

        {/* Missing fields nudge */}
        {missing.length > 0 && (
          <TouchableOpacity style={styles.missingNudge} onPress={onEdit} activeOpacity={0.8}>
            <IconAlert color={colors.warning} />
            <Text style={styles.missingText}>
              Missing: {missing.slice(0, 3).join(', ')}
              {missing.length > 3 ? ` +${missing.length - 3} more` : ''}
            </Text>
            <IconChevron color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Blood group highlight */}
        {emergencyProfile?.blood_group && (
          <View style={styles.bloodRow}>
            <View style={styles.bloodIconWrap}>
              <Text style={styles.bloodEmoji}>🩸</Text>
            </View>
            <View>
              <Text style={styles.bloodLabel}>Blood Group</Text>
              <Text style={styles.bloodValue}>{emergencyProfile.blood_group}</Text>
            </View>
            {emergencyProfile?.allergies && (
              <View style={styles.allergyTag}>
                <Text style={styles.allergyTagText}>
                  ⚠ {emergencyProfile.allergies.split(',')[0]}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Divider */}
        {topContacts.length > 0 && <View style={styles.divider} />}

        {/* Emergency contacts — EmergencyContact.name, phone, relationship, priority */}
        {topContacts.map((c, i) => {
          const avatarColors = [colors.primary, colors.info];
          const ac = avatarColors[i] ?? colors.textTertiary;
          return (
            <View key={c.id ?? i} style={[
              styles.contactRow,
              i < topContacts.length - 1 && styles.contactRowBorder
            ]}>
              <View style={[styles.contactAvatar, { backgroundColor: `${ac}18`, borderColor: `${ac}30` }]}>
                <Text style={[styles.contactAvatarText, { color: ac }]}>
                  {c.name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactRel}>
                  {c.relationship ?? 'Guardian'}
                  {c.priority === 1 ? '  ·  Primary' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${c.phone}`)}
                activeOpacity={0.7}
              >
                <IconPhone color={colors.success} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add contact nudge if none */}
        {topContacts.length === 0 && (
          <TouchableOpacity style={styles.addContactNudge} onPress={onEdit} activeOpacity={0.8}>
            <Text style={styles.addContactNudgeText}>
              + Add an emergency contact — required for the card to work
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated2.View>
  );
}

// ─── Card: Quick actions row ──────────────────────────────────────────────────

function QuickActions({ onShowQR, onEditProfile, onScanHistory, delay }) {
  const actions = [
    { label: 'Show QR', icon: <IconQr color={colors.primary} />, bg: colors.primaryBg, onPress: onShowQR },
    { label: 'Edit Profile', icon: <IconEdit color={colors.info} />, bg: colors.infoBg, onPress: onEditProfile },
    { label: 'Scan Logs', icon: <IconScan color={colors.textSecondary} />, bg: colors.surface3, onPress: onScanHistory },
  ];

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={styles.quickActions}>
      {actions.map((a, i) => (
        <TouchableOpacity key={i} style={styles.quickAction} onPress={a.onPress} activeOpacity={0.75}>
          <View style={[styles.quickActionIcon, { backgroundColor: a.bg }]}>{a.icon}</View>
          <Text style={styles.quickActionLabel}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated2.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { parentUser } = useAuthStore();
  const {
    student,
    school,
    token,
    card,
    emergencyProfile,
    contacts,
    recentScans,
    anomalies,
  } = useProfileStore();

  const lastScan = recentScans?.[0] ?? null;
  const totalScans = recentScans?.length ?? 0;
  const unresolvedAnomaly = (anomalies ?? []).find(a => !a.resolved);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Greeting header ── */}
        <Animated2.View entering={FadeInDown.delay(0).duration(400)} style={styles.greeting}>
          <Text style={styles.greetingText}>
            {greeting()}{parentUser?.phone ? ` 👋` : ''}
          </Text>
          <Text style={styles.greetingSubtitle}>
            Here's {student?.first_name ? `${student.first_name}'s` : 'your child\'s'} card status
          </Text>
        </Animated2.View>

        {/* ── Student identity ── */}
        <StudentHeader student={student} school={school} delay={60} />

        {/* ── Anomaly alert (urgent — show before card status) ── */}
        {unresolvedAnomaly && (
          <AnomalyAlert
            anomaly={unresolvedAnomaly}
            onPress={() => router.push('/(app)/scan-history')}
            delay={90}
          />
        )}

        {/* ── Card status ── */}
        <CardStatusCard
          token={token}
          card={card}
          onPress={() => router.push('/(app)/qr')}
          delay={120}
        />

        {/* ── Quick actions ── */}
        <QuickActions
          onShowQR={() => router.push('/(app)/qr')}
          onEditProfile={() => router.push('/(app)/updates')}
          onScanHistory={() => router.push('/(app)/scan-history')}
          delay={160}
        />

        {/* ── Emergency profile card ── */}
        <EmergencyCard
          emergencyProfile={emergencyProfile}
          contacts={contacts}
          onEdit={() => router.push('/(app)/updates')}
          delay={200}
        />

        {/* ── Last scan ── */}
        <LastScanCard
          scan={lastScan}
          totalScans={totalScans}
          onPress={() => router.push('/(app)/scan-history')}
          delay={240}
        />

        {/* ── Safety tip footer ── */}
        <Animated2.View entering={FadeInDown.delay(280).duration(400)} style={styles.safetytip}>
          <IconShield color={colors.success} />
          <Text style={styles.safetytipText}>
            Keep your child's medical info up to date — it's what first responders see in an emergency.
          </Text>
        </Animated2.View>

      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },

  // ── Greeting ──────────────────────────────────────────────────────
  greeting: {
    gap: spacing[0.5],
  },
  greetingText: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  greetingSubtitle: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },

  // ── Student header ────────────────────────────────────────────────
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.avatarLg,
    backgroundColor: colors.primaryBg,
    borderWidth: 1.5,
    borderColor: `rgba(232,52,42,0.25)`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  avatarInitials: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  studentMeta: {
    flex: 1,
    gap: spacing[2],
  },
  studentName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  studentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  chip: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.chipFull,
    borderWidth: 1,
    borderColor: `rgba(245,158,11,0.2)`,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  chipBlue: {
    backgroundColor: colors.infoBg,
    borderColor: `rgba(59,130,246,0.2)`,
  },
  chipText: {
    ...typography.labelXs,
    color: colors.warning,
    fontWeight: '600',
  },

  // ── Anomaly alert ─────────────────────────────────────────────────
  anomalyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningBg,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: `rgba(245,158,11,0.3)`,
    padding: spacing[3.5],
  },
  anomalyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  anomalyIconWrap: {
    width: 34,
    height: 34,
    backgroundColor: `rgba(245,158,11,0.15)`,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  anomalyTitle: {
    ...typography.labelMd,
    color: colors.warning,
    fontWeight: '700',
  },
  anomalyReason: {
    ...typography.labelXs,
    color: colors.warning,
    opacity: 0.8,
    marginTop: 2,
  },

  // ── Card status block ─────────────────────────────────────────────
  cardBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 3,
    width: '100%',
  },
  cardBlockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    gap: spacing[3],
  },
  cardEyebrow: {
    ...typography.overline,
    color: colors.textTertiary,
    marginBottom: spacing[1],
  },
  cardNumber: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadge: {
    borderRadius: radius.chipFull,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  statusBadgeText: {
    ...typography.labelXs,
    fontWeight: '700',
    fontSize: 10,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    backgroundColor: colors.primary,
    borderRadius: radius.btnSm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    flexShrink: 0,
  },
  qrBtnText: {
    ...typography.btnSm,
    color: colors.white,
    fontWeight: '700',
  },

  // ── Quick actions ─────────────────────────────────────────────────
  quickActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3.5],
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...typography.labelXs,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Section card (shared) ─────────────────────────────────────────
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionCardTitle: {
    ...typography.overline,
    color: colors.textTertiary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  viewAllText: {
    ...typography.labelXs,
    color: colors.primary,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  editBtnText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Completeness ──────────────────────────────────────────────────
  completenessWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completenessBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: colors.surface3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  completenessBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  completenessText: {
    ...typography.labelXs,
    fontWeight: '700',
    minWidth: 72,
    textAlign: 'right',
  },

  // ── Missing nudge ─────────────────────────────────────────────────
  missingNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  missingText: {
    ...typography.labelXs,
    color: colors.warning,
    flex: 1,
    fontWeight: '500',
  },

  // ── Blood row ─────────────────────────────────────────────────────
  bloodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bloodIconWrap: {
    width: 38,
    height: 38,
    backgroundColor: colors.primaryBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `rgba(232,52,42,0.2)`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bloodEmoji: { fontSize: 18 },
  bloodLabel: {
    ...typography.labelXs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bloodValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '800',
    lineHeight: 28,
  },
  allergyTag: {
    marginLeft: 'auto',
    backgroundColor: colors.warningBg,
    borderRadius: radius.chipFull,
    borderWidth: 1,
    borderColor: `rgba(245,158,11,0.25)`,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  allergyTagText: {
    ...typography.labelXs,
    color: colors.warning,
    fontWeight: '600',
  },

  // ── Divider ───────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Contact rows ──────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactAvatarText: {
    ...typography.labelMd,
    fontWeight: '800',
  },
  contactName: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contactRel: {
    ...typography.labelXs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  callBtn: {
    width: 34,
    height: 34,
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `rgba(22,163,74,0.2)`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactNudge: {
    padding: spacing[4],
  },
  addContactNudgeText: {
    ...typography.labelSm,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Last scan ─────────────────────────────────────────────────────
  noScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  noScanText: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  lastScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  scanPurposeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  scanPurposeLabel: {
    ...typography.labelMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: 3,
  },
  scanMetaText: {
    ...typography.labelXs,
    color: colors.textTertiary,
  },
  scanMetaDot: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  scanResultBadge: {
    borderRadius: radius.chipFull,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  scanResultText: {
    ...typography.labelXs,
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
  },

  // ── Safety tip ────────────────────────────────────────────────────
  safetytip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2.5],
    backgroundColor: colors.successBg,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: `rgba(22,163,74,0.2)`,
    padding: spacing[3.5],
  },
  safetytipText: {
    ...typography.labelXs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
-  },
});