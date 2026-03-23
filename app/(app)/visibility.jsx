/**
 * app/(app)/visibility.jsx
 * Visibility control — all colors from useTheme().colors
 */

import Screen from '@/components/common/Screen';
import { useProfileStore } from '@/features/profile/profile.store';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

const BackIcon = ({ c }) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M19 12H5M12 5l-7 7 7 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const CheckIcon = ({ c }) => (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
const LockIcon = ({ c }) => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Rect x={3} y={11} width={18} height={11} rx={2} stroke={c} strokeWidth={1.8} />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
);

function getVisibilityOptions(C) {
    return [
        {
            value: 'PUBLIC',
            label: 'Full Info Visible',
            tagline: 'Recommended for emergencies',
            description: 'Anyone who scans sees name, photo, blood group, allergies, conditions, medications, and all emergency contacts.',
            iconEl: <Text style={{ fontSize: 22 }}>👁️</Text>,
            iconBg: C.okBg,
            accent: C.ok,
            fields: [
                { label: 'Name & Photo', visible: true },
                { label: 'Blood Group', visible: true },
                { label: 'Allergies & Conditions', visible: true },
                { label: 'Medications', visible: true },
                { label: 'Doctor Info', visible: true },
                { label: 'Emergency Contacts', visible: true },
            ],
        },
        {
            value: 'MINIMAL',
            label: 'Name & Contacts Only',
            tagline: 'Balanced privacy',
            description: 'Scanners see name, photo, and emergency contact buttons. Medical details stay hidden.',
            iconEl: <Text style={{ fontSize: 22 }}>🛡️</Text>,
            iconBg: C.ambBg,
            accent: C.amb,
            fields: [
                { label: 'Name & Photo', visible: true },
                { label: 'Blood Group', visible: false },
                { label: 'Allergies & Conditions', visible: false },
                { label: 'Medications', visible: false },
                { label: 'Doctor Info', visible: false },
                { label: 'Emergency Contacts', visible: true },
            ],
        },
        {
            value: 'HIDDEN',
            label: 'Hidden',
            tagline: 'Card shows nothing',
            description: 'Scanning shows only that this is a registered emergency card. No personal info is revealed.',
            iconEl: <Text style={{ fontSize: 22 }}>🚫</Text>,
            iconBg: C.s4,
            accent: C.tx3,
            fields: [
                { label: 'Name & Photo', visible: false },
                { label: 'Blood Group', visible: false },
                { label: 'Allergies & Conditions', visible: false },
                { label: 'Medications', visible: false },
                { label: 'Doctor Info', visible: false },
                { label: 'Emergency Contacts', visible: false },
            ],
        },
    ];
}

function FieldRow({ label, visible, C }) {
    return (
        <View style={vi.fieldRow}>
            <View style={[vi.fieldDot, { backgroundColor: visible ? C.ok : C.s5, borderWidth: visible ? 0 : 1, borderColor: C.bd }]} />
            <Text style={[vi.fieldLabel, { color: visible ? C.tx2 : C.tx3 }]}>{label}</Text>
            {!visible && <LockIcon c={C.tx3} />}
        </View>
    );
}

function VisibilityCard({ option, selected, onSelect, delay, C }) {
    const isSelected = selected === option.value;
    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
            <TouchableOpacity
                style={[vi.optionCard, { backgroundColor: C.s2, borderColor: isSelected ? option.accent : C.bd }, isSelected && { borderWidth: 2, backgroundColor: option.accent + '0C' }]}
                onPress={() => onSelect(option.value)}
                activeOpacity={0.75}
            >
                <View style={vi.optionHeader}>
                    <View style={[vi.optionIconWrap, { backgroundColor: option.iconBg }]}>{option.iconEl}</View>
                    <View style={{ flex: 1 }}>
                        <View style={vi.optionTitleRow}>
                            <Text style={[vi.optionLabel, { color: C.tx }]}>{option.label}</Text>
                            {isSelected && (
                                <View style={[vi.selectedDot, { backgroundColor: option.accent }]}>
                                    <CheckIcon c={C.white} />
                                </View>
                            )}
                        </View>
                        <Text style={[vi.optionTagline, { color: option.accent }]}>{option.tagline}</Text>
                    </View>
                </View>
                <Text style={[vi.optionDesc, { color: C.tx2 }]}>{option.description}</Text>
                {isSelected && (
                    <Animated.View entering={FadeInRight.duration(300)} style={[vi.fieldBreakdown, { backgroundColor: C.s3, borderRadius: 12 }]}>
                        <Text style={[vi.fieldBreakdownTitle, { color: C.tx3 }]}>WHAT SCANNERS WILL SEE</Text>
                        {option.fields.map((f) => <FieldRow key={f.label} label={f.label} visible={f.visible} C={C} />)}
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function VisibilityScreen() {
    const router = useRouter();
    const { colors: C } = useTheme();

    const emergencyProfile = useProfileStore((s) => s.students.find((st) => st.id === s.activeStudentId)?.emergency ?? null);
    const activeStudentId = useProfileStore((s) => s.activeStudentId);
    const updateVisibility = useProfileStore((s) => s.updateVisibility);

    const [selected, setSelected] = useState(emergencyProfile?.visibility ?? 'PUBLIC');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const options = getVisibilityOptions(C);
    const current = options.find((o) => o.value === selected);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateVisibility(activeStudentId, { visibility: selected, hidden_fields: [] });
            setSaved(true);
            setTimeout(() => { setSaved(false); router.back(); }, 1200);
        } catch {
            Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Screen bg={C.bg} edges={['top', 'left', 'right']}>
            <Animated.View entering={FadeInDown.delay(0).duration(350)} style={[vi.header, { borderBottomColor: C.bd }]}>
                <TouchableOpacity style={[vi.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
                    <BackIcon c={C.tx} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[vi.pageTitle, { color: C.tx }]}>Who Can See What</Text>
                    <Text style={[vi.pageSubtitle, { color: C.tx3 }]}>Controls what strangers see when they scan</Text>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={vi.scroll}>

                {/* Context banner */}
                <Animated.View entering={FadeInDown.delay(50).duration(400)} style={[vi.contextBanner, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
                    <Text style={{ fontSize: 16 }}>ℹ️</Text>
                    <Text style={[vi.contextText, { color: C.tx2 }]}>
                        This controls what a <Text style={{ color: C.tx, fontWeight: '700' }}>stranger</Text> sees when they scan your child's physical card. In a real emergency, <Text style={{ color: C.tx, fontWeight: '700' }}>Full Info</Text> helps first responders act faster.
                    </Text>
                </Animated.View>

                {options.map((opt, i) => (
                    <VisibilityCard key={opt.value} option={opt} selected={selected} onSelect={setSelected} delay={100 + i * 60} C={C} />
                ))}

                {/* Save button */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                    <TouchableOpacity
                        style={[vi.saveBtn, { backgroundColor: saved ? C.ok : C.primary }, saving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        activeOpacity={0.8}
                        disabled={saving}
                    >
                        <Text style={[vi.saveBtnText, { color: C.white }]}>
                            {saving ? 'Saving…' : saved ? '✓ Saved' : `Save — ${current?.label}`}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {selected === 'HIDDEN' && (
                    <Animated.View entering={FadeInDown.duration(300)} style={[vi.hiddenWarning, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
                        <Text style={[vi.hiddenWarningText, { color: C.amb }]}>
                            ⚠️  Hidden mode means no one can help your child in an emergency. Only use this temporarily if the card is lost.
                        </Text>
                    </Animated.View>
                )}

            </ScrollView>
        </Screen>
    );
}

const vi = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, borderBottomWidth: 1 },
    backBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    pageSubtitle: { fontSize: 12, marginTop: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12, paddingTop: 16 },
    contextBanner: { flexDirection: 'row', gap: 12, borderRadius: 13, borderWidth: 1, padding: 14, alignItems: 'flex-start' },
    contextText: { fontSize: 13, lineHeight: 18, flex: 1 },
    optionCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
    optionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    optionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    optionLabel: { fontSize: 15, fontWeight: '700' },
    selectedDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    optionTagline: { fontSize: 12, fontWeight: '600' },
    optionDesc: { fontSize: 13, lineHeight: 18 },
    fieldBreakdown: { padding: 12, gap: 8 },
    fieldBreakdownTitle: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1.0, marginBottom: 4 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fieldDot: { width: 7, height: 7, borderRadius: 3.5 },
    fieldLabel: { fontSize: 13, flex: 1 },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveBtnText: { fontSize: 15, fontWeight: '700' },
    hiddenWarning: { borderRadius: 13, borderWidth: 1, padding: 14 },
    hiddenWarningText: { fontSize: 13, lineHeight: 18 },
});