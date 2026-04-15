import { ScrollView, Text, View, TouchableOpacity, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AnimatedRN, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import Screen from '@/components/common/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useProfileStore } from '@/features/profile/profile.store';
import { useScreenSecurity } from '@/hooks/useScreenSecurity';
import { SectionHeader, SettingsCard } from '@/components/common';
import { emergencyStyles as styles } from '@/styles/emergency.style';
import { VISIBILITY_CONFIG, VIS_OPTIONS, getVisColor, isFieldVisible, ALL_FIELD_KEYS } from '@/constants/emergency';

// ── Scanner Preview Component (inline because it's screen‑specific) ──
function PreviewDataRow({ icon, label, value, last, accent, C }) {
  if (!value) return null;
  return (
    <View style={[styles.prRow, !last && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
      <View style={[styles.prIcon, { backgroundColor: (accent ?? C.blue) + '18' }]}>
        <Feather name={icon} size={12} color={accent ?? C.blue} />
      </View>
      <View style={styles.prBody}>
        <Text style={[styles.prLabel, { color: C.tx3 }]}>{label}</Text>
        <Text style={[styles.prValue, { color: C.tx }]}>{value}</Text>
      </View>
    </View>
  );
}

function ScannerPreview({ student, emergency, contacts, visibility, hiddenFields, C }) {
  const { t } = useTranslation();
  const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.PUBLIC;
  const show = (key) => isFieldVisible(key, visibility, hiddenFields);

  const visibleContacts = show('contacts')
    ? (contacts ?? []).sort((a, b) => a.priority - b.priority)
    : [];

  const hasAnyData = visibility !== 'HIDDEN' && (
    (show('blood_group') && emergency?.blood_group) ||
    (show('allergies') && emergency?.allergies) ||
    (show('conditions') && emergency?.conditions) ||
    (show('medications') && emergency?.medications) ||
    (show('doctor_name') && emergency?.doctor_name) ||
    (show('notes') && emergency?.notes) ||
    visibleContacts.length > 0
  );

  const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ') || t('updates.childTab');
  const visLabel = {
    PUBLIC: t('emergency.visPublicLabel'),
    MINIMAL: t('emergency.visMinimalLabel'),
    HIDDEN: t('emergency.visHiddenLabel'),
  }[visibility] ?? visibility;

  return (
    <View style={[styles.pvCard, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
      {/* Top bar */}
      <View style={[styles.pvTopBar, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
        <View style={styles.pvTopLeft}>
          <View style={[styles.pvScanBadge, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
            <View style={[styles.pvScanDot, { backgroundColor: C.primary }]} />
            <Text style={[styles.pvScanTx, { color: C.primary }]}>{t('emergency.scannerViewLabel').toUpperCase()}</Text>
          </View>
          <Text style={[styles.pvCaption, { color: C.tx3 }]}>{t('emergency.scannerViewCaption')}</Text>
        </View>
        <View style={[styles.pvVisBadge, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
          <Feather name={cfg.iconName} size={10} color={C.tx2} />
          <Text style={[styles.pvVisTx, { color: C.tx2 }]}>{visLabel}</Text>
        </View>
      </View>

      {/* Identity */}
      <View style={[styles.pvIdentity, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
        <View style={[styles.pvAvatar, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
          <Text style={[styles.pvAvatarTx, { color: C.primary }]}>
            {[student?.first_name?.[0], student?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.pvIdentityBody}>
          <Text style={[styles.pvName, { color: C.tx }]}>{fullName}</Text>
          {student?.class && (
            <View style={[styles.pvMetaChip, { backgroundColor: C.s4, borderColor: C.bd2 }]}>
              <Text style={[styles.pvMetaChipTx, { color: C.tx3 }]}>
                {t('emergency.previewLabelClass')} {student.class}{student.section ? `-${student.section}` : ''}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.pvEmergencyPill, { backgroundColor: C.primaryBg, borderColor: C.primaryBd }]}>
          <MaterialCommunityIcons name="medical-bag" size={11} color={C.primary} />
          <Text style={[styles.pvEmergencyTx, { color: C.primary }]}>{t('emergency.emergencyLabel')}</Text>
        </View>
      </View>

      {/* Data section */}
      {visibility === 'HIDDEN' ? (
        <View style={styles.pvBlocked}>
          <View style={[styles.pvBlockedIcon, { backgroundColor: C.redBg, borderColor: C.redBd }]}>
            <Feather name="lock" size={18} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pvBlockedTitle, { color: C.tx }]}>{t('emergency.hiddenTitle')}</Text>
            <Text style={[styles.pvBlockedSub, { color: C.tx3 }]}>{t('emergency.hiddenSub')}</Text>
          </View>
        </View>
      ) : !hasAnyData ? (
        <View style={styles.pvBlocked}>
          <View style={[styles.pvBlockedIcon, { backgroundColor: C.s4, borderColor: C.bd }]}>
            <Feather name="alert-circle" size={18} color={C.tx3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pvBlockedTitle, { color: C.tx2 }]}>{t('emergency.noDataTitle')}</Text>
            <Text style={[styles.pvBlockedSub, { color: C.tx3 }]}>{t('emergency.noDataSub')}</Text>
          </View>
        </View>
      ) : (
        <View>
          {show('blood_group') && emergency?.blood_group && (
            <View style={[styles.pvSection, { borderBottomColor: C.bd }]}>
              <Text style={[styles.pvSectionHead, { color: C.tx3 }]}>{t('emergency.previewMedicalHead').toUpperCase()}</Text>
              <PreviewDataRow icon="droplet" label={t('emergency.previewLabelBloodGroup')} value={emergency.blood_group} accent={C.primary} C={C} />
              {show('allergies') && <PreviewDataRow icon="alert-triangle" label={t('emergency.previewLabelAllergies')} value={emergency?.allergies} accent={C.amb} C={C} />}
              {show('conditions') && <PreviewDataRow icon="activity" label={t('emergency.previewLabelConditions')} value={emergency?.conditions} accent={C.blue} C={C} />}
              {show('medications') && <PreviewDataRow icon="package" label={t('emergency.previewLabelMedications')} value={emergency?.medications} accent={C.blue} C={C} last />}
            </View>
          )}
          {show('doctor_name') && emergency?.doctor_name && (
            <View style={[styles.pvSection, { borderBottomColor: C.bd }]}>
              <Text style={[styles.pvSectionHead, { color: C.tx3 }]}>{t('emergency.previewPhysicianHead').toUpperCase()}</Text>
              <PreviewDataRow icon="user" label={t('emergency.previewLabelDoctor')} value={emergency.doctor_name} accent={C.blue} C={C} />
              {show('doctor_phone') && <PreviewDataRow icon="phone" label={t('emergency.previewLabelDoctorPhone')} value={emergency?.doctor_phone} accent={C.ok} C={C} last />}
            </View>
          )}
          {visibleContacts.length > 0 && (
            <View style={[styles.pvSection, { borderBottomColor: C.bd }]}>
              <Text style={[styles.pvSectionHead, { color: C.tx3 }]}>{t('emergency.previewContactsHead').toUpperCase()}</Text>
              {visibleContacts.map((c, i) => (
                <View key={c.id ?? i} style={[styles.pvContact, i < visibleContacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bd }]}>
                  <View style={[styles.pvContactAv, { backgroundColor: i === 0 ? C.primaryBg : C.blueBg, borderColor: i === 0 ? C.primaryBd : C.blueBd }]}>
                    <Text style={[styles.pvContactAvTx, { color: i === 0 ? C.primary : C.blue }]}>{c.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pvContactName, { color: C.tx }]}>{c.name}</Text>
                    <Text style={[styles.pvContactRel, { color: C.tx3 }]}>
                      {c.relationship ?? t('emergency.previewLabelGuardian')}
                      {c.priority === 1 ? `  ·  ${t('emergency.previewLabelPrimary')}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.pvCallBtn, { backgroundColor: C.okBg, borderColor: C.okBd }]}
                    onPress={() => Linking.openURL(`tel:${c.phone}`)}
                    activeOpacity={0.7}
                  >
                    <Feather name="phone-call" size={13} color={C.ok} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={[styles.pvFooter, { borderTopColor: C.bd, backgroundColor: C.s3 }]}>
        <MaterialCommunityIcons name="shield-check" size={11} color={C.tx3} />
        <Text style={[styles.pvFooterTx, { color: C.tx3 }]}>{t('emergency.poweredBy')}</Text>
      </View>
    </View>
  );
}

// ── Visibility Selector ──
function VisibilitySelector({ current, onChange, C }) {
  const { t } = useTranslation();
  const color = getVisColor(current, C);
  const currentMeta = VIS_OPTIONS.find((o) => o.key === current);

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.vsPillRow, { backgroundColor: C.s3, borderColor: C.bd }]}>
        {VIS_OPTIONS.map(({ key, labelKey, iconName }) => {
          const active = current === key;
          const c = getVisColor(key, C);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.vsPill, active && { backgroundColor: c + '18', borderColor: c + '40' }]}
              onPress={() => onChange(key)}
              activeOpacity={0.75}
            >
              <Feather name={iconName} size={13} color={active ? c : C.tx3} />
              <Text style={[styles.vsPillTx, { color: active ? c : C.tx3 }, active && { fontWeight: '800' }]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.vsDetail, { backgroundColor: color + '0C', borderColor: color + '30' }]}>
        <View style={[styles.vsDetailIconWrap, { backgroundColor: color + '18', borderColor: color + '30' }]}>
          <Feather name={currentMeta?.iconName ?? 'eye'} size={15} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.vsDetailTitle, { color }]}>{t(currentMeta?.labelKey ?? '')}</Text>
          <Text style={[styles.vsDetailBody, { color: C.tx2 }]}>{t(currentMeta?.detailKey ?? '')}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Field Access Table ──
function FieldAccessTable({ visibility, hiddenFields, onToggle, C }) {
  const { t } = useTranslation();

  const isDisabled = (field) => {
    if (visibility === 'HIDDEN') return true;
    if (visibility === 'MINIMAL' && !field.minimalAllowed) return true;
    return false;
  };

  let lastCategory = null;

  return (
    <View style={[styles.ftTable, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
      <View style={[styles.ftTableHead, { backgroundColor: C.s3, borderBottomColor: C.bd }]}>
        <Text style={[styles.ftTableHeadLbl, { color: C.tx3 }]}>FIELD</Text>
        <Text style={[styles.ftTableHeadLbl, { color: C.tx3 }]}>SHOW TO RESPONDERS</Text>
      </View>
      {ALL_FIELD_KEYS.map((field, i) => {
        const disabled = isDisabled(field);
        const visible = !hiddenFields.includes(field.key);
        const effective = visible && !disabled;
        const isLast = i === ALL_FIELD_KEYS.length - 1;
        const showCatHeader = field.categoryKey !== lastCategory;
        lastCategory = field.categoryKey;

        return (
          <View key={field.key}>
            {showCatHeader && i > 0 && (
              <View style={[styles.ftCatDivider, { borderBottomColor: C.bd }]}>
                <Text style={[styles.ftCatTx, { color: C.tx3 }]}>{t(field.categoryKey).toUpperCase()}</Text>
                <View style={[styles.ftCatLine, { backgroundColor: C.bd }]} />
              </View>
            )}
            <View style={[styles.ftRow, !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd }, disabled && styles.ftRowDim]}>
              <View style={[styles.ftDot, { backgroundColor: effective ? C.ok : disabled ? C.tx3 + '30' : C.tx3 + '50' }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.ftFieldLabel, { color: disabled ? C.tx3 : C.tx }]}>{t(field.labelKey)}</Text>
                <Text style={[styles.ftFieldSub, { color: C.tx3 }]}>{field.sublabel}</Text>
              </View>
              {disabled && visibility !== 'HIDDEN' && (
                <View style={[styles.ftLockedTag, { backgroundColor: C.s3, borderColor: C.bd }]}>
                  <Feather name="lock" size={9} color={C.tx3} />
                  <Text style={[styles.ftLockedTx, { color: C.tx3 }]}>{t('emergency.lockedMinimal')}</Text>
                </View>
              )}
              <Switch
                value={effective}
                onValueChange={() => !disabled && onToggle(field.key)}
                disabled={disabled}
                trackColor={{ false: C.s5, true: C.primary + '70' }}
                thumbColor={effective ? C.primary : C.tx3}
                ios_backgroundColor={C.s5}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Sticky Footer (same as before, but using extracted styles) ──
function StickyFooter({ isDirty, saving, saved, onSave, C }) {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: isDirty ? 0 : 80, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.timing(opacAnim, { toValue: isDirty ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isDirty]);

  return (
    <Animated.View
      pointerEvents={isDirty ? 'auto' : 'none'}
      style={[styles.sfBar, { backgroundColor: C.s2, borderColor: C.bd2, transform: [{ translateY: slideAnim }], opacity: opacAnim }]}
    >
      <View style={styles.sfLeft}>
        <View style={[styles.sfDot, { backgroundColor: saving ? C.amb : C.primary }]} />
        <Text style={[styles.sfTx, { color: C.tx2 }]}>{t('emergency.unsavedChanges')}</Text>
      </View>
      <TouchableOpacity
        style={[styles.sfBtn, { backgroundColor: saved ? C.ok : C.primary }, saving && { opacity: 0.6 }]}
        onPress={onSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saved ? <Feather name="check" size={14} color="#fff" /> : <Text style={styles.sfBtnTx}>{saving ? t('emergency.saving') : t('emergency.save')}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function EmergencyScreen() {
  const { colors: C } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  useScreenSecurity();

  const activeStudent = useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? s.students[0] ?? null,
  );
  const patchStudent = useProfileStore((s) => s.patchStudent);

  const student = activeStudent;
  const emergency = activeStudent?.emergency ?? null;
  const contacts = activeStudent?.emergency?.contacts ?? [];
  const cardVis = activeStudent?.card_visibility ?? null;

  const [visibility, setVisibility] = useState(cardVis?.visibility ?? 'PUBLIC');
  const [hiddenFields, setHiddenFields] = useState(cardVis?.hidden_fields ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    visibility !== (cardVis?.visibility ?? 'PUBLIC') ||
    JSON.stringify([...(hiddenFields ?? [])].sort()) !==
    JSON.stringify([...(cardVis?.hidden_fields ?? [])].sort());

  const toggleField = (key) =>
    setHiddenFields((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));

  const handleSave = async () => {
    if (!student?.id) return;
    setSaving(true);
    try {
      await patchStudent(student.id, { card_visibility: { visibility, hidden_fields: hiddenFields } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert(t('emergency.saveFailed'), t('emergency.saveFailedMsg'));
    } finally {
      setSaving(false);
    }
  };

  const visColor = getVisColor(visibility, C);

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.bd }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevLeft c={C.tx} s={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: C.tx }]}>{t('emergency.pageTitle')}</Text>
          <Text style={[styles.pageSub, { color: C.tx3 }]}>
            {student?.first_name ? t('emergency.pageSub', { name: `${student.first_name}'s` }) : t('emergency.pageSubGeneric')}
          </Text>
        </View>
        <View style={[styles.visPill, { backgroundColor: visColor + '12', borderColor: visColor + '35' }]}>
          <View style={[styles.visDot, { backgroundColor: visColor }]} />
          <Text style={[styles.visTx, { color: visColor }]}>
            {{ PUBLIC: t('emergency.visPublicLabel'), MINIMAL: t('emergency.visMinimalLabel'), HIDDEN: t('emergency.visHiddenLabel') }[visibility]}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}>
        <AnimatedRN.View entering={FadeInDown.delay(0).duration(380)}>
          <SectionHeader title={t('emergency.sectionScannerPreview').toUpperCase()} accent={C.primary} />
          <Text style={[styles.sectionDesc, { color: C.tx3 }]}>{t('emergency.sectionScannerDesc')}</Text>
          <ScannerPreview student={student} emergency={emergency} contacts={contacts} visibility={visibility} hiddenFields={hiddenFields} C={C} />
        </AnimatedRN.View>

        <AnimatedRN.View entering={FadeInDown.delay(60).duration(380)}>
          <SectionHeader title={t('emergency.sectionAccessLevel').toUpperCase()} accent={C.primary} />
          <Text style={[styles.sectionDesc, { color: C.tx3 }]}>{t('emergency.sectionAccessDesc')}</Text>
          <VisibilitySelector current={visibility} onChange={setVisibility} C={C} />
        </AnimatedRN.View>

        {visibility !== 'HIDDEN' && (
          <AnimatedRN.View entering={FadeIn.duration(320)} layout={Layout.duration(260)}>
            <SectionHeader title={t('emergency.sectionFieldAccess').toUpperCase()} accent={C.primary} />
            <Text style={[styles.sectionDesc, { color: C.tx3 }]}>
              {visibility === 'MINIMAL' ? t('emergency.sectionFieldAccessDescMinimal') : t('emergency.sectionFieldAccessDescPublic')}
            </Text>
            <FieldAccessTable visibility={visibility} hiddenFields={hiddenFields} onToggle={toggleField} C={C} />
          </AnimatedRN.View>
        )}

        {visibility === 'HIDDEN' && (
          <AnimatedRN.View entering={FadeIn.duration(280)} style={[styles.hiddenWarn, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
            <View style={[styles.hiddenWarnIcon, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
              <Feather name="alert-triangle" size={15} color={C.amb} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hiddenWarnTitle, { color: C.amb }]}>{t('emergency.hiddenWarnTitle')}</Text>
              <Text style={[styles.hiddenWarnBody, { color: C.amb }]}>{t('emergency.hiddenWarnBody')}</Text>
            </View>
          </AnimatedRN.View>
        )}

        <AnimatedRN.View entering={FadeInDown.delay(160).duration(380)} style={[styles.safetyNote, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
          <View style={[styles.safetyIcon, { backgroundColor: C.okBg }]}>
            <Feather name="shield" size={13} color={C.ok} />
          </View>
          <Text style={[styles.safetyTx, { color: C.tx2 }]}>{t('emergency.safetyNote')}</Text>
        </AnimatedRN.View>
      </ScrollView>

      <StickyFooter isDirty={isDirty} saving={saving} saved={saved} onSave={handleSave} C={C} />
    </Screen>
  );
}

// Helper chevron icon component
const ChevLeft = ({ c, s = 20 }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);