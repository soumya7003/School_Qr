// app/(app)/support.jsx
// Refactored – styles and constants extracted

import Screen from '@/components/common/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { APP_VERSION, APP_BUILD, DEFAULT_FAQS } from '@/constants/support';
import { supportStyles as styles } from '@/styles/support.style';

// ── Icons (inline, small) ──
const BackIcon = ({ c }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 5l-7 7 7 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ c, open }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExternalIcon = ({ c }) => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── FAQ Item Component ──
function FaqItem({ faq, delay, C }) {
  const [open, setOpen] = useState(false);
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <TouchableOpacity
        style={[styles.faqItem, { borderBottomColor: C.bd }, open && { backgroundColor: C.s3 }]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQ, { color: C.tx }]}>{faq.q}</Text>
          <ChevronDown c={C.tx3} open={open} />
        </View>
        {open && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text style={[styles.faqA, { color: C.tx2 }]}>{faq.a}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Contact Card Component ──
function ContactCard({ iconBg, iconEl, title, subtitle, value, onPress, delay, C }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
      <TouchableOpacity
        style={[styles.contactCard, { backgroundColor: C.s2, borderColor: C.bd }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>{iconEl}</View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.contactTitle, { color: C.tx }]}>{title}</Text>
          <Text style={[styles.contactSub, { color: C.tx3 }]}>{subtitle}</Text>
        </View>
        <Text style={[styles.contactValue, { color: C.primary }]}>{value}</Text>
        <ExternalIcon c={C.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function SupportScreen() {
  const router = useRouter();
  const { colors: C } = useTheme();
  const { t } = useTranslation();

  // Get FAQs from translation with fallback
  const faqs = Array.isArray(t('support.faqs', { returnObjects: true }))
    ? t('support.faqs', { returnObjects: true })
    : DEFAULT_FAQS;

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={[styles.header, { borderBottomColor: C.bd }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <BackIcon c={C.tx} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: C.tx }]}>{t('support.pageTitle')}</Text>
          <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>{t('support.pageSubtitle')}</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Contact Us */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={[styles.sectionLabel, { color: C.tx3 }]}>{t('support.sectionContact')}</Text>
        </Animated.View>

        <ContactCard
          iconBg={C.okBg}
          iconEl={<Text style={{ fontSize: 16 }}>💬</Text>}
          title={t('support.whatsappTitle')}
          subtitle={t('support.whatsappSub')}
          value={t('support.whatsappValue')}
          onPress={() => Linking.openURL('https://wa.me/916294690079')}
          delay={80}
          C={C}
        />
        <ContactCard
          iconBg={C.blueBg}
          iconEl={<Text style={{ fontSize: 16 }}>✉️</Text>}
          title={t('support.emailTitle')}
          subtitle={t('support.emailSub')}
          value={t('support.emailValue')}
          onPress={() => Linking.openURL('mailto:support@getresqid.in')}
          delay={110}
          C={C}
        />
        <ContactCard
          iconBg={C.ambBg}
          iconEl={<Text style={{ fontSize: 16 }}>📞</Text>}
          title={t('support.callTitle')}
          subtitle={t('support.callSub')}
          value={t('support.callValue')}
          onPress={() => Linking.openURL('tel:+916294690079')}
          delay={140}
          C={C}
        />

        {/* FAQs */}
        <Animated.View entering={FadeInDown.delay(170).duration(400)}>
          <Text style={[styles.sectionLabel, { color: C.tx3, marginTop: 8 }]}>{t('support.sectionFaq')}</Text>
        </Animated.View>

        <View style={[styles.faqList, { backgroundColor: C.s2, borderColor: C.bd }]}>
          {faqs && faqs.length > 0 ? (
            faqs.map((faq, i) => <FaqItem key={i} faq={faq} delay={200 + i * 25} C={C} />)
          ) : (
            <View style={styles.emptyFaq}>
              <Text style={[styles.emptyFaqText, { color: C.tx3 }]}>No FAQs available</Text>
            </View>
          )}
        </View>

        {/* Legal */}
        <Animated.View entering={FadeInDown.delay(440).duration(400)}>
          <Text style={[styles.sectionLabel, { color: C.tx3, marginTop: 8 }]}>{t('support.sectionLegal')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(460).duration(400)} style={styles.legalRow}>
          <TouchableOpacity
            style={[styles.legalBtn, { backgroundColor: C.s2, borderColor: C.bd }]}
            onPress={() => Linking.openURL('https://getresqid.in/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>🛡️</Text>
            <Text style={[styles.legalBtnText, { color: C.tx2 }]}>{t('support.privacyPolicy')}</Text>
            <ExternalIcon c={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.legalBtn, { backgroundColor: C.s2, borderColor: C.bd }]}
            onPress={() => Linking.openURL('https://getresqid.in/terms-of-service')}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>📋</Text>
            <Text style={[styles.legalBtnText, { color: C.tx2 }]}>{t('support.termsOfUse')}</Text>
            <ExternalIcon c={C.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(480).duration(400)} style={styles.versionRow}>
          <Text style={[styles.versionText, { color: C.tx3 }]}>
            {t('support.version', { version: APP_VERSION, build: APP_BUILD })}
          </Text>
          <Text style={[styles.versionSub, { color: C.tx3 }]}>{t('support.versionSub')}</Text>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}