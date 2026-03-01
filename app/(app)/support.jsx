/**
 * Support Screen — Help & Support for parents
 * Self-contained: no store dependencies, no external API calls
 */

import Screen from '@/src/components/common/Screen';
import { colors, radius, spacing, typography } from '@/src/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7"
            stroke={colors.textPrimary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ChevronDown = ({ open }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
        style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
        <Path d="M6 9l6 6 6-6" stroke={colors.textTertiary} strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const ExternalIcon = () => (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
            stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const MailIcon = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const WhatsAppIcon = ({ color = colors.success }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const PhoneIcon = ({ color = colors.warning }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const BookIcon = ({ color = colors.info }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M4 19.5A2.5 2.5 0 016.5 17H20"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

const ShieldIcon = ({ color = colors.primary }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS = [
    {
        q: 'What happens when someone scans my child\'s card?',
        a: 'They see your child\'s name, photo, and emergency contacts based on your visibility setting. Calls are connected through a secure relay — the caller\'s number and your number are never revealed to each other. Every scan is logged and you get a notification.',
    },
    {
        q: 'Are phone numbers visible to strangers?',
        a: 'Never. All calls go through our secure relay system. The person scanning cannot see your actual phone number, and you cannot see theirs. This protects both parties.',
    },
    {
        q: 'What does "HIDDEN" visibility mode do?',
        a: 'When set to Hidden, scanning the card shows only that it\'s a registered SafeTag card, with no personal info. Use this temporarily if the physical card is lost or stolen until you get a replacement.',
    },
    {
        q: 'My card shows INACTIVE status. What does that mean?',
        a: 'INACTIVE means the card has been manually deactivated. Go to the QR tab and tap Activate to re-enable it. If you didn\'t deactivate it, contact support immediately as it may indicate misuse.',
    },
    {
        q: 'How do I replace a lost or damaged card?',
        a: 'Go to Settings → Physical Card → Deactivate / Replace Card. First deactivate the lost card so it can\'t be misused, then contact your school to request a replacement physical card.',
    },
    {
        q: 'What is a "Scan Anomaly"?',
        a: 'An anomaly is flagged when the system detects unusual activity — like the same card being scanned multiple times in quick succession, or scans from unexpected locations. You\'ll be notified immediately.',
    },
    {
        q: 'Can I update my child\'s medical info myself?',
        a: 'Yes. Go to Updates tab and edit any field. Changes are submitted to the school for approval before going live on the public emergency profile. This ensures data accuracy.',
    },
    {
        q: 'How long are scan logs kept?',
        a: 'Scan logs are retained for 12 months. After that they are automatically deleted. You can view all logs in Settings → Scan History.',
    },
];

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FaqItem({ faq, delay }) {
    const [open, setOpen] = useState(false);

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
            <TouchableOpacity
                style={[styles.faqItem, open && styles.faqItemOpen]}
                onPress={() => setOpen(v => !v)}
                activeOpacity={0.7}
            >
                <View style={styles.faqHeader}>
                    <Text style={styles.faqQ}>{faq.q}</Text>
                    <ChevronDown open={open} />
                </View>
                {open && (
                    <Animated.View entering={FadeInDown.duration(200)}>
                        <Text style={styles.faqA}>{faq.a}</Text>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Contact card ──────────────────────────────────────────────────────────────

function ContactCard({ icon, iconBg, title, subtitle, value, onPress, delay }) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
            <TouchableOpacity style={styles.contactCard} onPress={onPress} activeOpacity={0.75}>
                <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>{icon}</View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.contactTitle}>{title}</Text>
                    <Text style={styles.contactSub}>{subtitle}</Text>
                </View>
                <Text style={styles.contactValue}>{value}</Text>
                <ExternalIcon />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SupportScreen() {
    const router = useRouter();

    return (
        <Screen bg={colors.screenBg} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Help & Support</Text>
                    <Text style={styles.pageSubtitle}>We're here to help</Text>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Contact options */}
                <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                    <Text style={styles.sectionLabel}>Contact Us</Text>
                </Animated.View>

                <ContactCard
                    icon={<WhatsAppIcon />}
                    iconBg={colors.successBg}
                    title="WhatsApp Support"
                    subtitle="Typically replies in under 2 hours"
                    value="Chat Now"
                    onPress={() => Linking.openURL('https://wa.me/911234567890?text=Hi, I need help with SafeTag')}
                    delay={80}
                />
                <ContactCard
                    icon={<MailIcon />}
                    iconBg={colors.infoBg}
                    title="Email Support"
                    subtitle="support@safetag.in"
                    value="Email"
                    onPress={() => Linking.openURL('mailto:support@safetag.in?subject=SafeTag App Support')}
                    delay={110}
                />
                <ContactCard
                    icon={<PhoneIcon />}
                    iconBg={colors.warningBg}
                    title="Call Support"
                    subtitle="Mon–Sat, 9AM–6PM IST"
                    value="Call"
                    onPress={() => Linking.openURL('tel:+911234567890')}
                    delay={140}
                />

                {/* FAQ */}
                <Animated.View entering={FadeInDown.delay(170).duration(400)}>
                    <Text style={[styles.sectionLabel, { marginTop: spacing[2] }]}>
                        Frequently Asked Questions
                    </Text>
                </Animated.View>

                <View style={styles.faqList}>
                    {FAQS.map((faq, i) => (
                        <FaqItem key={i} faq={faq} delay={200 + i * 30} />
                    ))}
                </View>

                {/* Legal links */}
                <Animated.View entering={FadeInDown.delay(440).duration(400)}>
                    <Text style={[styles.sectionLabel, { marginTop: spacing[2] }]}>Legal</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(460).duration(400)} style={styles.legalRow}>
                    <TouchableOpacity
                        style={styles.legalBtn}
                        onPress={() => Linking.openURL('https://safetag.in/privacy')}
                        activeOpacity={0.7}
                    >
                        <ShieldIcon />
                        <Text style={styles.legalBtnText}>Privacy Policy</Text>
                        <ExternalIcon />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.legalBtn}
                        onPress={() => Linking.openURL('https://safetag.in/terms')}
                        activeOpacity={0.7}
                    >
                        <BookIcon />
                        <Text style={styles.legalBtnText}>Terms of Use</Text>
                        <ExternalIcon />
                    </TouchableOpacity>
                </Animated.View>

                {/* App version */}
                <Animated.View entering={FadeInDown.delay(480).duration(400)} style={styles.versionRow}>
                    <Text style={styles.versionText}>SafeTag v1.0.0  ·  Build 100</Text>
                    <Text style={styles.versionSub}>Emergency ID Card Platform for Parents</Text>
                </Animated.View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing.screenH,
        paddingTop: spacing[6],
        paddingBottom: spacing[3],
    },
    backBtn: {
        width: 38,
        height: 38,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    pageSubtitle: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },

    scroll: {
        paddingHorizontal: spacing.screenH,
        paddingBottom: spacing[10],
        gap: spacing[2],
    },

    sectionLabel: {
        ...typography.overline,
        color: colors.textTertiary,
        paddingLeft: spacing[1],
        marginBottom: spacing[1],
    },

    // ── Contact cards ─────────────────────────────
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[4],
    },
    contactIcon: {
        width: 38,
        height: 38,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    contactTitle: {
        ...typography.labelLg,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    contactSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    contactValue: {
        ...typography.labelSm,
        color: colors.primary,
        fontWeight: '600',
    },

    // ── FAQ ───────────────────────────────────────
    faqList: {
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    faqItem: {
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    faqItemOpen: {
        backgroundColor: colors.surface3,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing[3],
    },
    faqQ: {
        ...typography.labelMd,
        color: colors.textPrimary,
        fontWeight: '600',
        flex: 1,
        lineHeight: 20,
    },
    faqA: {
        ...typography.bodySm,
        color: colors.textSecondary,
        lineHeight: 18,
        marginTop: spacing[3],
    },

    // ── Legal ─────────────────────────────────────
    legalRow: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    legalBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.surface,
        borderRadius: radius.cardSm,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[3.5],
    },
    legalBtnText: {
        ...typography.labelSm,
        color: colors.textSecondary,
        fontWeight: '600',
        flex: 1,
    },

    // ── Version ───────────────────────────────────
    versionRow: {
        alignItems: 'center',
        paddingVertical: spacing[4],
        gap: spacing[1],
    },
    versionText: {
        ...typography.labelSm,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    versionSub: {
        ...typography.labelXs,
        color: colors.textTertiary,
    },
});