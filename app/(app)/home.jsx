/**
 * app/(app)/home.jsx
 * Home Screen — RESQID Parent Dashboard
 * Features: Pull-to-refresh, Skeleton loaders, Direct API calls
 */

import Screen from '@/components/common/Screen';
import { useAuthStore } from '@/features/auth/auth.store';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated2, { FadeInDown } from 'react-native-reanimated';

// ─── Skeleton Components ──────────────────────────────────────────────────────
const Skeleton = ({ width, height, radius = 12, style }) => {
  const { colors: C } = useTheme();
  return (
    <View style={[{
      width, height, borderRadius: radius,
      backgroundColor: C.s3, overflow: 'hidden',
    }, style]}>
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: C.s4,
        opacity: useRef(new Animated.Value(0.3)).current,
      }} />
    </View>
  );
};

// ─── Helper Functions ─────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
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

function getTokenMeta(status, t, C) {
  switch (status) {
    case 'ACTIVE': return { label: t('home.statusActive'), color: C.ok, bg: C.okBg, pulse: true };
    case 'INACTIVE': return { label: t('home.statusInactive'), color: C.tx3, bg: C.s4, pulse: false };
    case 'ISSUED': return { label: t('home.statusIssued'), color: C.amb, bg: C.ambBg, pulse: true };
    case 'REVOKED': return { label: t('home.statusRevoked'), color: C.red, bg: C.redBg, pulse: false };
    case 'EXPIRED': return { label: t('home.statusExpired'), color: C.red, bg: C.redBg, pulse: false };
    default: return { label: t('home.statusUnknown'), color: C.tx3, bg: C.s4, pulse: false };
  }
}

// ─── Hero Card ────────────────────────────────────────────────────────────────
function HeroCard({ student, token, onPress, C }) {
  const { t } = useTranslation();
  const meta = getTokenMeta(token?.status, t, C);
  const isActive = token?.status === 'ACTIVE';
  const name = student?.first_name ? `${student.first_name} ${student.last_name || ''}`.trim() : 'Child';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <TouchableOpacity
      style={[styles.heroCard, { backgroundColor: C.s2, borderColor: C.bd }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.heroAccent, { backgroundColor: C.primary }]} />
      <View style={styles.heroInner}>
        <View style={styles.heroAvatar}>
          <Text style={[styles.heroAvatarText, { color: C.primary }]}>{initials || '?'}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={[styles.heroName, { color: C.tx }]} numberOfLines={1}>{name}</Text>
          <View style={styles.heroMetaRow}>
            {student?.class && (
              <View style={[styles.classChip, { backgroundColor: C.primaryBg }]}>
                <Text style={[styles.classChipText, { color: C.primary }]}>
                  {student.class}{student.section ? `-${student.section}` : ''}
                </Text>
              </View>
            )}
            <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
              {meta.pulse && <View style={[styles.pulseDot, { backgroundColor: meta.color }]} />}
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={[styles.cardNumber, { color: C.tx3 }]}>
            <MaterialCommunityIcons name="qrcode" size={11} color={C.tx3} />{' '}
            {token?.card_number || t('home.noCard')}
          </Text>
        </View>
        <MaterialCommunityIcons name="qrcode-scan" size={28} color={C.primary} />
      </View>
      {token?.expires_at && (
        <View style={[styles.heroFooter, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
          <Feather name="clock" size={12} color={C.tx3} />
          <Text style={[styles.footerText, { color: C.tx3 }]}>
            {t('home.validUntil')} {fmtDate(token.expires_at)}
          </Text>
          <View style={[styles.footerDivider, { backgroundColor: C.bd }]} />
          <Feather name="shield" size={12} color={isActive ? C.ok : C.tx3} />
          <Text style={[styles.footerText, { color: isActive ? C.ok : C.tx3 }]}>
            {isActive ? t('home.active') : t('home.inactive')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onShowQR, onEditProfile, onScanHistory, C }) {
  const { t } = useTranslation();
  const actions = [
    { icon: 'qrcode-scan', label: t('home.showQR'), onPress: onShowQR, color: C.primary, bg: C.primaryBg },
    { icon: 'edit-2', label: t('home.editProfile'), onPress: onEditProfile, color: C.blue, bg: C.blueBg },
    { icon: 'activity', label: t('home.scanLogs'), onPress: onScanHistory, color: C.tx2, bg: C.s4 },
  ];
  return (
    <View style={styles.quickRow}>
      {actions.map((a, i) => (
        <TouchableOpacity key={i} style={[styles.quickCard, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={a.onPress}>
          <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
            <Feather name={a.icon} size={22} color={a.color} />
          </View>
          <Text style={[styles.quickLabel, { color: C.tx }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Emergency Profile Card ───────────────────────────────────────────────────
function EmergencyCard({ emergency, contacts, onEdit, C }) {
  const { t } = useTranslation();
  const hasBloodGroup = emergency?.blood_group;
  const hasAllergy = emergency?.allergies;
  const topContacts = (contacts || []).slice(0, 2);

  return (
    <View style={[styles.sectionCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: C.bd }]}>
        <Feather name="heart" size={14} color={C.primary} />
        <Text style={[styles.sectionTitle, { color: C.tx3 }]}>{t('home.emergencyProfile')}</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Text style={[styles.editText, { color: C.primary }]}>{t('common.edit')}</Text>
          <Feather name="chevron-right" size={12} color={C.primary} />
        </TouchableOpacity>
      </View>

      {hasBloodGroup && (
        <View style={[styles.bloodRow, { borderBottomColor: C.bd }]}>
          <Text style={styles.bloodIcon}>🩸</Text>
          <View>
            <Text style={[styles.bloodLabel, { color: C.tx3 }]}>{t('updates.bloodGroup')}</Text>
            <Text style={[styles.bloodValue, { color: C.primary }]}>{emergency.blood_group}</Text>
          </View>
          {hasAllergy && (
            <View style={[styles.allergyBadge, { backgroundColor: C.ambBg }]}>
              <Feather name="alert-triangle" size={10} color={C.amb} />
              <Text style={[styles.allergyText, { color: C.amb }]} numberOfLines={1}>{emergency.allergies}</Text>
            </View>
          )}
        </View>
      )}

      {topContacts.map((c, i) => (
        <View key={c.id || i} style={[styles.contactRow, i === 0 && hasBloodGroup && { borderTopColor: C.bd }]}>
          <View style={[styles.contactAvatar, { backgroundColor: C.primaryBg }]}>
            <Text style={[styles.contactInitial, { color: C.primary }]}>{c.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactName, { color: C.tx }]}>{c.name}</Text>
            <Text style={[styles.contactRelation, { color: C.tx3 }]}>{c.relationship || t('home.guardian')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: C.okBg }]}
            onPress={() => Linking.openURL(`tel:${c.phone}`)}>
            <Feather name="phone-call" size={14} color={C.ok} />
          </TouchableOpacity>
        </View>
      ))}

      {!hasBloodGroup && contacts?.length === 0 && (
        <TouchableOpacity style={styles.emptyState} onPress={onEdit}>
          <Feather name="alert-circle" size={20} color={C.amb} />
          <Text style={[styles.emptyText, { color: C.amb }]}>{t('home.profileIncomplete')}</Text>
          <Text style={[styles.emptySub, { color: C.tx3 }]}>{t('home.completeNow')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Last Scan Card ───────────────────────────────────────────────────────────
function LastScanCard({ scan, totalScans, onPress, C }) {
  const { t } = useTranslation();
  const hasScan = scan && scan.id;

  return (
    <View style={[styles.sectionCard, { backgroundColor: C.s2, borderColor: C.bd }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: C.bd }]}>
        <Feather name="radio" size={14} color={C.tx3} />
        <Text style={[styles.sectionTitle, { color: C.tx3 }]}>{t('home.lastScan')}</Text>
        {totalScans > 0 && (
          <TouchableOpacity onPress={onPress} style={styles.editBtn}>
            <Text style={[styles.editText, { color: C.primary }]}>{t('home.viewAll', { count: totalScans })}</Text>
            <Feather name="chevron-right" size={12} color={C.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!hasScan ? (
        <View style={styles.emptyScan}>
          <Feather name="maximize-2" size={28} color={C.tx3} />
          <Text style={[styles.emptyTitle, { color: C.tx2 }]}>{t('home.noScansYet')}</Text>
          <Text style={[styles.emptyDesc, { color: C.tx3 }]}>{t('home.noScansBody')}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.scanRow} onPress={onPress}>
          <View style={[styles.scanDot, { backgroundColor: scan.result === 'SUCCESS' ? C.ok : C.red }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.scanLabel, { color: C.tx }]}>
              {scan.scan_purpose === 'EMERGENCY' ? '🆘 ' : ''}{scan.result || t('home.scan')}
            </Text>
            <Text style={[styles.scanMeta, { color: C.tx3 }]}>
              {fmtRelTime(scan.created_at, t)} • {scan.ip_city || 'Unknown location'}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.tx3} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const { parentUser } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { students, activeStudentId, setActiveStudent, fetchAndPersist, lastScan, scanCount, anomaly } = useProfileStore();

  const activeStudent = students?.find(s => s.id === activeStudentId) || students?.[0] || null;
  const token = activeStudent?.token || null;
  const emergency = activeStudent?.emergency || null;
  const contacts = emergency?.contacts || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchAndPersist();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAndPersist();
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.greetingMorning') : hour < 17 ? t('home.greetingAfternoon') : t('home.greetingEvening');
  const userName = activeStudent?.first_name || parentUser?.name?.split(' ')[0] || '';

  if (loading) {
    return (
      <Screen bg={C.bg}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Skeleton width={200} height={28} />
          <Skeleton width={140} height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={140} radius={20} style={{ marginTop: 16 }} />
          <View style={styles.quickRow}>
            {[1, 2, 3].map(i => <Skeleton key={i} width={100} height={90} radius={16} />)}
          </View>
          <Skeleton width="100%" height={200} radius={18} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={120} radius={18} style={{ marginTop: 12 }} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen bg={C.bg}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Greeting */}
        <Animated2.View entering={FadeInDown.delay(0).duration(400)}>
          <Text style={[styles.greeting, { color: C.tx }]}>
            {userName ? `${userName}, ` : ''}{greeting} 👋
          </Text>
          <Text style={[styles.subGreeting, { color: C.tx3 }]}>
            {activeStudent ? t('home.subtitleNamed', { name: activeStudent.first_name }) : t('home.subtitle')}
          </Text>
        </Animated2.View>

        {/* Child Switcher */}
        {students?.length > 1 && (
          <Animated2.View entering={FadeInDown.delay(40).duration(400)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
              {students.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.childCard,
                    {
                      backgroundColor: s.id === activeStudentId ? C.primaryBg : C.s2,
                      borderColor: s.id === activeStudentId ? C.primaryBd : C.bd,
                    }
                  ]}
                  onPress={() => setActiveStudent(s.id)}
                >
                  <Text style={[styles.childInitial, { color: s.id === activeStudentId ? C.primary : C.tx }]}>
                    {s.first_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                  <Text style={[styles.childName, { color: s.id === activeStudentId ? C.primary : C.tx }]} numberOfLines={1}>
                    {s.first_name || 'Child'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated2.View>
        )}

        {/* Hero Card */}
        <Animated2.View entering={FadeInDown.delay(80).duration(400)}>
          <HeroCard student={activeStudent} token={token} onPress={() => router.push('/(app)/qr')} C={C} />
        </Animated2.View>

        {/* Quick Actions */}
        <Animated2.View entering={FadeInDown.delay(120).duration(400)}>
          <QuickActions
            onShowQR={() => router.push('/(app)/qr')}
            onEditProfile={() => router.push('/(app)/updates')}
            onScanHistory={() => router.push('/(app)/scan-history')}
            C={C}
          />
        </Animated2.View>

        {/* Emergency Card */}
        <Animated2.View entering={FadeInDown.delay(160).duration(400)}>
          <EmergencyCard emergency={emergency} contacts={contacts} onEdit={() => router.push('/(app)/updates')} C={C} />
        </Animated2.View>

        {/* Last Scan Card */}
        <Animated2.View entering={FadeInDown.delay(200).duration(400)}>
          <LastScanCard scan={lastScan} totalScans={scanCount} onPress={() => router.push('/(app)/scan-history')} C={C} />
        </Animated2.View>

        {/* Safety Tip */}
        <Animated2.View entering={FadeInDown.delay(240).duration(400)}>
          <View style={[styles.safetyTip, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
            <Feather name="shield" size={16} color={C.ok} />
            <Text style={[styles.safetyText, { color: C.tx2 }]}>{t('home.safetyTip')}</Text>
          </View>
        </Animated2.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 20, paddingBottom: 40, gap: 16 },
  greeting: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subGreeting: { fontSize: 13, marginTop: 4 },
  childScroll: { flexDirection: 'row', marginVertical: 4 },
  childCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10 },
  childInitial: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', fontSize: 14, fontWeight: '700', marginRight: 8 },
  childName: { fontSize: 13, fontWeight: '600' },
  heroCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  heroAccent: { height: 3, width: '100%' },
  heroInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  heroAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(232,52,42,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 20, fontWeight: '800' },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 16, fontWeight: '700' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  classChipText: { fontSize: 10, fontWeight: '700' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  pulseDot: { width: 5, height: 5, borderRadius: 2.5 },
  cardNumber: { fontSize: 10, marginTop: 2 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  footerText: { fontSize: 11 },
  footerDivider: { width: 1, height: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '600' },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  sectionTitle: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  editText: { fontSize: 12, fontWeight: '600' },
  bloodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  bloodIcon: { fontSize: 24 },
  bloodLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  bloodValue: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  allergyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  allergyText: { fontSize: 10, fontWeight: '600', maxWidth: 100 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactInitial: { fontSize: 16, fontWeight: '700' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactRelation: { fontSize: 11 },
  callBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', padding: 24, gap: 4 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptySub: { fontSize: 12 },
  emptyScan: { alignItems: 'center', padding: 28, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
  emptyDesc: { fontSize: 12, textAlign: 'center' },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  scanDot: { width: 8, height: 8, borderRadius: 4 },
  scanLabel: { fontSize: 14, fontWeight: '600' },
  scanMeta: { fontSize: 11, marginTop: 2 },
  safetyTip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, borderWidth: 1 },
  safetyText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16 },
});