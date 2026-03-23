/**
 * app/(app)/support.jsx
 * Help & Support — all colors from useTheme().colors
 */

import Screen from '@/components/common/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

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

const FAQS = [
    { q: "What happens when someone scans my child's card?", a: "They see your child's name, photo, and emergency contacts based on your visibility setting. Every scan is logged and you get a notification." },
    { q: 'Are phone numbers visible to strangers?', a: 'Never. All calls go through our secure relay system. The person scanning cannot see your actual phone number.' },
    { q: 'What does "HIDDEN" visibility mode do?', a: "When set to Hidden, scanning the card shows only that it's a registered RESQID card, with no personal info." },
    { q: 'My card shows INACTIVE status. What does that mean?', a: "INACTIVE means the card has been manually deactivated. Go to the QR tab and tap Activate to re-enable it." },
    { q: 'How do I replace a lost or damaged card?', a: "Go to Settings → Physical Card → Deactivate / Replace Card, then contact your school to request a replacement." },
    { q: 'What is a "Scan Anomaly"?', a: "An anomaly is flagged when the system detects unusual activity — like multiple rapid scans. You'll be notified immediately." },
    { q: "Can I update my child's medical info myself?", a: 'Yes. Go to the Updates tab and edit any field. Changes are submitted to the school for approval.' },
    { q: 'How long are scan logs kept?', a: 'Scan logs are retained for 12 months, then automatically deleted.' },
];

function FaqItem({ faq, delay, C }) {
    const [open, setOpen] = useState(false);
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
            <TouchableOpacity
                style={[su.faqItem, { borderBottomColor: C.bd }, open && { backgroundColor: C.s3 }]}
                onPress={() => setOpen((v) => !v)}
                activeOpacity={0.7}
            >
                <View style={su.faqHeader}>
                    <Text style={[su.faqQ, { color: C.tx }]}>{faq.q}</Text>
                    <ChevronDown c={C.tx3} open={open} />
                </View>
                {open && (
                    <Animated.View entering={FadeInDown.duration(200)}>
                        <Text style={[su.faqA, { color: C.tx2 }]}>{faq.a}</Text>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

function ContactCard({ iconBg, iconEl, title, subtitle, value, onPress, delay, C }) {
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(350)}>
            <TouchableOpacity style={[su.contactCard, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={onPress} activeOpacity={0.75}>
                <View style={[su.contactIcon, { backgroundColor: iconBg }]}>{iconEl}</View>
                <View style={{ flex: 1 }}>
                    <Text style={[su.contactTitle, { color: C.tx }]}>{title}</Text>
                    <Text style={[su.contactSub, { color: C.tx3 }]}>{subtitle}</Text>
                </View>
                <Text style={[su.contactValue, { color: C.primary }]}>{value}</Text>
                <ExternalIcon c={C.primary} />
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function SupportScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={[su.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity style={[su.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon c={C.tx} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[su.pageTitle, { color: C.tx }]}>Help & Support</Text>
                    <Text style={[su.pageSubtitle, { color: C.tx3 }]}>We're here to help</Text>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={su.scroll}>

                <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                    <Text style={[su.sectionLabel, { color: C.tx3 }]}>CONTACT US</Text>
                </Animated.View>

                <ContactCard
                    iconBg={C.okBg} iconEl={<Text style={{ fontSize: 16 }}>💬</Text>}
                    title="WhatsApp Support" subtitle="Typically replies in under 2 hours" value="Chat Now"
                    onPress={() => Linking.openURL('https://wa.me/911234567890')} delay={80} C={C}
                />
                <ContactCard
                    iconBg={C.blueBg} iconEl={<Text style={{ fontSize: 16 }}>✉️</Text>}
                    title="Email Support" subtitle="support@resqid.in" value="Email"
                    onPress={() => Linking.openURL('mailto:support@resqid.in')} delay={110} C={C}
                />
                <ContactCard
                    iconBg={C.ambBg} iconEl={<Text style={{ fontSize: 16 }}>📞</Text>}
                    title="Call Support" subtitle="Mon–Sat, 9AM–6PM IST" value="Call"
                    onPress={() => Linking.openURL('tel:+911234567890')} delay={140} C={C}
                />

                <Animated.View entering={FadeInDown.delay(170).duration(400)}>
                    <Text style={[su.sectionLabel, { color: C.tx3, marginTop: 8 }]}>FREQUENTLY ASKED QUESTIONS</Text>
                </Animated.View>

                <View style={[su.faqList, { backgroundColor: C.s2, borderColor: C.bd }]}>
                    {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} delay={200 + i * 25} C={C} />)}
                </View>

                <Animated.View entering={FadeInDown.delay(440).duration(400)}>
                    <Text style={[su.sectionLabel, { color: C.tx3, marginTop: 8 }]}>LEGAL</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(460).duration(400)} style={su.legalRow}>
                    <TouchableOpacity style={[su.legalBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => Linking.openURL('https://resqid.in/privacy')} activeOpacity={0.7}>
                        <Text style={{ fontSize: 14 }}>🛡️</Text>
                        <Text style={[su.legalBtnText, { color: C.tx2 }]}>Privacy Policy</Text>
                        <ExternalIcon c={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[su.legalBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => Linking.openURL('https://resqid.in/terms')} activeOpacity={0.7}>
                        <Text style={{ fontSize: 14 }}>📋</Text>
                        <Text style={[su.legalBtnText, { color: C.tx2 }]}>Terms of Use</Text>
                        <ExternalIcon c={C.primary} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(480).duration(400)} style={su.versionRow}>
                    <Text style={[su.versionText, { color: C.tx3 }]}>RESQID v1.0.0  ·  Build 100</Text>
                    <Text style={[su.versionSub, { color: C.tx3 }]}>Emergency ID Card Platform</Text>
                </Animated.View>

            </ScrollView>
        </Screen>
    );
}

const su = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, borderBottomWidth: 1 },
    backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    pageSubtitle: { fontSize: 12, marginTop: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 10, paddingTop: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, borderWidth: 1, padding: 14 },
    contactIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contactTitle: { fontSize: 14, fontWeight: '600' },
    contactSub: { fontSize: 11.5, marginTop: 1 },
    contactValue: { fontSize: 12.5, fontWeight: '700' },
    faqList: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    faqItem: { padding: 16, borderBottomWidth: 1 },
    faqHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    faqQ: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
    faqA: { fontSize: 13, lineHeight: 18, marginTop: 12 },
    legalRow: { flexDirection: 'row', gap: 8 },
    legalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, borderWidth: 1, padding: 14 },
    legalBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },
    versionRow: { alignItems: 'center', paddingVertical: 16, gap: 4 },
    versionText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
    versionSub: { fontSize: 11 },
});