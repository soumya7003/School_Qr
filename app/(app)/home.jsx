/**
 * @file app/(app)/home.jsx
 * @description Home Screen — RESQID Parent Dashboard
 *
 * Refactored: All custom SVG icon components replaced with @expo/vector-icons
 *             (Feather + MaterialCommunityIcons).
 *             PulseDot kept (no icon equivalent for animated dot).
 *             Shared helpers extracted — see EXTRACT note below.
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { colors, radius, spacing, typography } from '@/theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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

// ─── Animated pulse dot ───────────────────────────────────────────────────────
// Kept as custom — no icon library equivalent for a looping opacity dot

function PulseDot({ color = colors.success }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: anim }]} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/*
 * EXTRACT CANDIDATES — these are duplicated or reusable across screens:
 *
 *   tokenMeta()           → used in CardStatusCard here + likely in QR screen
 *   fmtRelTime()          → used in LastScanCard here + scan-history screen
 *   fmtDate()             → used here + scan-history, profile screens
 *   profileCompleteness() → used here + emergency-profile/edit screen
 *   missingFields()       → used here + emergency-profile/edit screen
 *
 * Recommended: move all five to `@/utils/profile.utils.js` and import from there.
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StudentHeader({ student, school, delay }) {
  const initials = [student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={styles.studentHeader}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarInitials}>{initials}</Text>
        <View style={styles.verifiedDot} />
      </View>
      <View style={styles.studentMeta}>
        <Text style={styles.studentName}>{student?.first_name ?? '—'} {student?.last_name ?? ''}</Text>
        <View style={styles.studentChips}>
          {(student?.class || student?.section) && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Class {student.class}{student.section ? `-${student.section}` : ''}</Text>
            </View>
          )}
          {school?.name && (
            <View style={[styles.chip, styles.chipBlue]}>
              <Text style={[styles.chipText, { color: colors.info }]}>{school.name}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated2.View>
  );
}

function CardStatusCard({ token, card, onPress, delay }) {
  const meta = tokenMeta(token?.status);
  const isExpiringSoon = token?.expires_at && (new Date(token.expires_at) - new Date()) < 30 * 24 * 60 * 60 * 1000;
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={styles.cardBlock} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.cardAccent, { backgroundColor: meta.color }]} />
        <View style={styles.cardBlockInner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>Emergency Card</Text>
            <Text style={styles.cardNumber}>{card?.card_number ?? '—'}</Text>
            <View style={styles.statusRow}>
              {meta.pulse && <PulseDot color={meta.color} />}
              <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {isExpiringSoon && (
                <View style={[styles.statusBadge, { backgroundColor: colors.warningBg }]}>
                  <Text style={[styles.statusBadgeText, { color: colors.warning }]}>Expires {fmtDate(token.expires_at)}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.qrBtn} onPress={onPress} activeOpacity={0.8}>
            {/* qrcode from MaterialCommunityIcons replaces custom IconQr SVG */}
            <MaterialCommunityIcons name="qrcode" size={18} color={colors.white} />
            <Text style={styles.qrBtnText}>Show QR</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated2.View>
  );
}

function AnomalyAlert({ anomaly, onPress, delay }) {
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity style={styles.anomalyAlert} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.anomalyLeft}>
          <View style={styles.anomalyIconWrap}>
            {/* alert-triangle from Feather replaces custom IconAlert SVG */}
            <Feather name="alert-triangle" size={16} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.anomalyTitle}>Suspicious scan detected</Text>
            <Text style={styles.anomalyReason} numberOfLines={1}>{anomaly.reason}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={14} color={colors.warning} />
      </TouchableOpacity>
    </Animated2.View>
  );
}

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
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {!scan ? (
          <View style={styles.noScanRow}>
            {/* maximize-2 from Feather (scan frame) replaces custom IconScan SVG */}
            <Feather name="maximize-2" size={15} color={colors.textTertiary} />
            <Text style={styles.noScanText}>Card hasn't been scanned yet</Text>
          </View>
        ) : (
          <View style={styles.lastScanRow}>
            <View style={[styles.scanPurposeDot, { backgroundColor: isEmergency ? colors.primary : colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scanPurposeLabel}>{isEmergency ? '🆘 Emergency Scan' : '👁 General Scan'}</Text>
              <View style={styles.scanMetaRow}>
                {location ? (
                  <>
                    <Feather name="map-pin" size={11} color={colors.textTertiary} />
                    <Text style={styles.scanMetaText}>{location}</Text>
                    <Text style={styles.scanMetaDot}>·</Text>
                  </>
                ) : null}
                <Text style={styles.scanMetaText}>{fmtRelTime(scan.created_at)}</Text>
              </View>
            </View>
            <View style={[styles.scanResultBadge, { backgroundColor: scan.result === 'SUCCESS' ? colors.successBg : colors.primaryBg }]}>
              <Text style={[styles.scanResultText, { color: scan.result === 'SUCCESS' ? colors.success : colors.primary }]}>
                {scan.result}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated2.View>
  );
}

function EmergencyCard({ emergencyProfile: ep, contacts, onEdit, delay }) {
  const completeness = profileCompleteness(ep, contacts);
  const missing = missingFields(ep, contacts);
  const isComplete = completeness === 100;
  const topContacts = [...(contacts ?? [])].sort((a, b) => a.priority - b.priority).slice(0, 2);
  const avatarColors = [colors.primary, colors.info];

  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Emergency Profile</Text>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
            {/* edit-2 from Feather replaces custom IconEdit SVG */}
            <Feather name="edit-2" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.completenessWrap}>
          <View style={styles.completenessBarBg}>
            <View style={[styles.completenessBarFill, { width: `${completeness}%`, backgroundColor: isComplete ? colors.success : colors.warning }]} />
          </View>
          <Text style={[styles.completenessText, { color: isComplete ? colors.success : colors.warning }]}>{completeness}% complete</Text>
        </View>

        {missing.length > 0 && (
          <TouchableOpacity style={styles.missingNudge} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="alert-triangle" size={14} color={colors.warning} />
            <Text style={styles.missingText}>
              Missing: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
            </Text>
            <Feather name="chevron-right" size={13} color={colors.warning} />
          </TouchableOpacity>
        )}

        {ep?.blood_group && (
          <View style={styles.bloodRow}>
            <View style={styles.bloodIconWrap}>
              <Text style={styles.bloodEmoji}>🩸</Text>
            </View>
            <View>
              <Text style={styles.bloodLabel}>Blood Group</Text>
              <Text style={styles.bloodValue}>{ep.blood_group}</Text>
            </View>
            {ep?.allergies && (
              <View style={styles.allergyTag}>
                <Text style={styles.allergyTagText}>⚠ {ep.allergies.split(',')[0]}</Text>
              </View>
            )}
          </View>
        )}

        {topContacts.length > 0 && <View style={styles.divider} />}

        {topContacts.map((c, i) => (
          <View key={c.id ?? i} style={[styles.contactRow, i < topContacts.length - 1 && styles.contactRowBorder]}>
            <View style={[styles.contactAvatar, { backgroundColor: `${avatarColors[i] ?? colors.textTertiary}18`, borderColor: `${avatarColors[i] ?? colors.textTertiary}30` }]}>
              <Text style={[styles.contactAvatarText, { color: avatarColors[i] ?? colors.textTertiary }]}>
                {c.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactRel}>{c.relationship ?? 'Guardian'}{c.priority === 1 ? '  ·  Primary' : ''}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${c.phone}`)} activeOpacity={0.7}>
              {/* phone-call from Feather replaces custom IconPhone SVG */}
              <Feather name="phone-call" size={14} color={colors.success} />
            </TouchableOpacity>
          </View>
        ))}

        {topContacts.length === 0 && (
          <TouchableOpacity style={styles.addContactNudge} onPress={onEdit} activeOpacity={0.8}>
            <Text style={styles.addContactNudgeText}>+ Add an emergency contact — required for the card to work</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated2.View>
  );
}

// Quick actions — data-driven to avoid per-action component duplication
function QuickActions({ onShowQR, onEditProfile, onScanHistory, delay }) {
  const actions = [
    { label: 'Show QR', icon: <MaterialCommunityIcons name="qrcode" size={18} color={colors.primary} />, bg: colors.primaryBg, onPress: onShowQR },
    { label: 'Edit Profile', icon: <Feather name="edit-2" size={16} color={colors.info} />, bg: colors.infoBg, onPress: onEditProfile },
    { label: 'Scan Logs', icon: <Feather name="maximize-2" size={15} color={colors.textSecondary} />, bg: colors.surface3, onPress: onScanHistory },
  ];
  return (
    <Animated2.View entering={FadeInDown.delay(delay).duration(400)} style={styles.quickActions}>
      {actions.map((a) => (
        <TouchableOpacity key={a.label} style={styles.quickAction} onPress={a.onPress} activeOpacity={0.75}>
          <View style={[styles.quickActionIcon, { backgroundColor: a.bg }]}>{a.icon}</View>
          <Text style={styles.quickActionLabel}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </Animated2.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  console.log('[HomeScreen] rendered');

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
  const recentScans = [];
  const anomalies = [];

  const lastScan = recentScans?.[0] ?? null;
  const totalScans = recentScans?.length ?? 0;
  const unresolvedAnomaly = anomalies.find((a) => !a.resolved);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated2.View entering={FadeInDown.delay(0).duration(400)} style={styles.greeting}>
          <Text style={styles.greetingText}>{greeting()}{parentUser?.phone ? ' 👋' : ''}</Text>
          <Text style={styles.greetingSubtitle}>
            Here's {activeStudent?.first_name ? `${activeStudent.first_name}'s` : "your child's"} card status
          </Text>
        </Animated2.View>

        <StudentHeader student={activeStudent} school={school} delay={60} />

        {unresolvedAnomaly && (
          <AnomalyAlert anomaly={unresolvedAnomaly} onPress={() => router.push('/(app)/scan-history')} delay={90} />
        )}

        <CardStatusCard token={token} card={card} onPress={() => router.push('/(app)/qr')} delay={120} />

        <QuickActions
          onShowQR={() => router.push('/(app)/qr')}
          onEditProfile={() => router.push('/(app)/updates')}
          onScanHistory={() => router.push('/(app)/scan-history')}
          delay={160}
        />

        <EmergencyCard emergencyProfile={emergencyProfile} contacts={contacts} onEdit={() => router.push('/(app)/updates')} delay={200} />

        <LastScanCard scan={lastScan} totalScans={totalScans} onPress={() => router.push('/(app)/scan-history')} delay={240} />

        <Animated2.View entering={FadeInDown.delay(280).duration(400)} style={styles.safetytip}>
          {/* shield from Feather replaces custom IconShield SVG */}
          <Feather name="shield" size={15} color={colors.success} />
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
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: spacing[6], paddingBottom: spacing[10], gap: spacing[4] },

  greeting: { gap: spacing[0.5] },
  greetingText: { ...typography.h2, color: colors.textPrimary },
  greetingSubtitle: { ...typography.bodySm, color: colors.textTertiary },

  studentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border, padding: spacing[4] },
  avatarWrap: { width: 56, height: 56, borderRadius: radius.avatarLg, backgroundColor: colors.primaryBg, borderWidth: 1.5, borderColor: 'rgba(232,52,42,0.25)', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  avatarInitials: { ...typography.h4, color: colors.primary, fontWeight: '800' },
  verifiedDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.surface },
  studentMeta: { flex: 1, gap: spacing[2] },
  studentName: { ...typography.h4, color: colors.textPrimary, fontWeight: '700' },
  studentChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] },
  chip: { backgroundColor: colors.warningBg, borderRadius: radius.chipFull, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', paddingHorizontal: spacing[2], paddingVertical: 3 },
  chipBlue: { backgroundColor: colors.infoBg, borderColor: 'rgba(59,130,246,0.2)' },
  chipText: { ...typography.labelXs, color: colors.warning, fontWeight: '600' },

  anomalyAlert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.warningBg, borderRadius: radius.cardSm, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', padding: spacing[3.5] },
  anomalyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  anomalyIconWrap: { width: 34, height: 34, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  anomalyTitle: { ...typography.labelMd, color: colors.warning, fontWeight: '700' },
  anomalyReason: { ...typography.labelXs, color: colors.warning, opacity: 0.8, marginTop: 2 },

  cardBlock: { backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardAccent: { height: 3, width: '100%' },
  cardBlockInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4], gap: spacing[3] },
  cardEyebrow: { ...typography.overline, color: colors.textTertiary, marginBottom: spacing[1] },
  cardNumber: { ...typography.h4, color: colors.textPrimary, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing[2] },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusBadge: { borderRadius: radius.chipFull, paddingHorizontal: spacing[2], paddingVertical: 3 },
  statusBadgeText: { ...typography.labelXs, fontWeight: '700', fontSize: 10 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], backgroundColor: colors.primary, borderRadius: radius.btnSm, paddingHorizontal: spacing[3], paddingVertical: spacing[2.5], flexShrink: 0 },
  qrBtnText: { ...typography.btnSm, color: colors.white, fontWeight: '700' },

  quickActions: { flexDirection: 'row', gap: spacing[2] },
  quickAction: { flex: 1, alignItems: 'center', gap: spacing[2], backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing[3.5] },
  quickActionIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { ...typography.labelXs, color: colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionCardTitle: { ...typography.overline, color: colors.textTertiary },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  viewAllText: { ...typography.labelXs, color: colors.primary, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  editBtnText: { ...typography.labelSm, color: colors.primary, fontWeight: '600' },

  completenessWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  completenessBarBg: { flex: 1, height: 5, backgroundColor: colors.surface3, borderRadius: 3, overflow: 'hidden' },
  completenessBarFill: { height: '100%', borderRadius: 3 },
  completenessText: { ...typography.labelXs, fontWeight: '700', minWidth: 72, textAlign: 'right' },

  missingNudge: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.warningBg, paddingHorizontal: spacing[4], paddingVertical: spacing[2.5], borderBottomWidth: 1, borderBottomColor: colors.border },
  missingText: { ...typography.labelXs, color: colors.warning, flex: 1, fontWeight: '500' },

  bloodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  bloodIconWrap: { width: 38, height: 38, backgroundColor: colors.primaryBg, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(232,52,42,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bloodEmoji: { fontSize: 18 },
  bloodLabel: { ...typography.labelXs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  bloodValue: { ...typography.h4, color: colors.primary, fontWeight: '800', lineHeight: 28 },
  allergyTag: { marginLeft: 'auto', backgroundColor: colors.warningBg, borderRadius: radius.chipFull, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', paddingHorizontal: spacing[2], paddingVertical: 3 },
  allergyTagText: { ...typography.labelXs, color: colors.warning, fontWeight: '600' },

  divider: { height: 1, backgroundColor: colors.border },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  contactRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  contactAvatar: { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactAvatarText: { ...typography.labelMd, fontWeight: '800' },
  contactName: { ...typography.labelMd, color: colors.textPrimary, fontWeight: '600' },
  contactRel: { ...typography.labelXs, color: colors.textTertiary, marginTop: 2 },
  callBtn: { width: 34, height: 34, backgroundColor: colors.successBg, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)', alignItems: 'center', justifyContent: 'center' },
  addContactNudge: { padding: spacing[4] },
  addContactNudgeText: { ...typography.labelSm, color: colors.primary, fontWeight: '600', textAlign: 'center' },

  noScanRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  noScanText: { ...typography.bodySm, color: colors.textTertiary },
  lastScanRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  scanPurposeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  scanPurposeLabel: { ...typography.labelMd, color: colors.textPrimary, fontWeight: '600' },
  scanMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: 3 },
  scanMetaText: { ...typography.labelXs, color: colors.textTertiary },
  scanMetaDot: { color: colors.textTertiary, fontSize: 10 },
  scanResultBadge: { borderRadius: radius.chipFull, paddingHorizontal: spacing[2], paddingVertical: 3 },
  scanResultText: { ...typography.labelXs, fontWeight: '700', fontSize: 9, textTransform: 'uppercase' },

  safetytip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5], backgroundColor: colors.successBg, borderRadius: radius.cardSm, borderWidth: 1, borderColor: 'rgba(22,163,74,0.2)', padding: spacing[3.5] },
  safetytipText: { ...typography.labelXs, color: colors.textSecondary, flex: 1, lineHeight: 16 },
});