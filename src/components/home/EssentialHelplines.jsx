/**
 * components/home/EssentialHelplines.jsx
 * Essential Helpline Numbers — RESQID Home Section
 * Bottom sheet modal with category tiles + call/email actions
 */

import { Feather } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
    Animated,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
    {
        id: 'emergency',
        label: 'Emergency',
        icon: 'alert-octagon',
        emoji: '🆘',
        accent: '#E8342A',   // C.primary
        entries: [
            { name: 'National Emergency', number: '112' },
            { name: 'Fire Brigade', number: '101' },
            { name: 'Ambulance', number: '102' },
            { name: 'Disaster Management', number: '108' },
        ],
    },
    {
        id: 'child',
        label: 'Child Safety',
        icon: 'shield',
        emoji: '🛡️',
        accent: '#7C3AED',
        entries: [
            { name: 'Child Helpline', number: '1098' },
            { name: 'NCPCR', number: '1800-121-2830' },
            { name: 'Missing Child / Women', number: '1094' },
        ],
    },
    {
        id: 'health',
        label: 'Health',
        icon: 'activity',
        emoji: '🏥',
        accent: '#059669',
        entries: [
            { name: 'COVID-19 Helpline', number: '1075' },
            { name: 'National AIDS Helpline', number: '1097' },
            { name: 'Indian Medical Assoc.', number: '011-26588895' },
        ],
    },
    {
        id: 'police',
        label: 'Police',
        icon: 'user-check',
        emoji: '👮',
        accent: '#1D4ED8',
        entries: [
            { name: 'Emergency Police', number: '112' },
            { name: 'Women\'s Helpline', number: '1090' },
            { name: 'Cyber Crime', number: '1930' },
            { name: 'Delhi Police Complaints', number: '1093' },
        ],
    },
    {
        id: 'women',
        label: 'Women & Child',
        icon: 'heart',
        emoji: '💜',
        accent: '#DB2777',
        entries: [
            { name: 'Women Helpline', number: '1091' },
            { name: 'NCW Helpline', number: '7827-170-170' },
            { name: 'Domestic Violence', number: '181' },
        ],
    },
    {
        id: 'senior',
        label: 'Senior Citizen',
        icon: 'users',
        emoji: '👴',
        accent: '#D97706',
        entries: [
            { name: 'Elder Line', number: '14567' },
            { name: 'HelpAge India', number: '011-41688955' },
        ],
    },
    {
        id: 'student',
        label: 'Student',
        icon: 'book-open',
        emoji: '🎓',
        accent: '#0891B2',
        entries: [
            { name: 'Anti-Ragging Helpline', number: '1800-180-5522' },
            { name: 'UGC', number: '011-23604446' },
            { name: 'CBSE', number: '1800-11-8002' },
            { name: 'AICTE', number: '011-26131576' },
        ],
    },
    {
        id: 'railway',
        label: 'Railways',
        icon: 'map',
        emoji: '🚆',
        accent: '#64748B',
        entries: [
            { name: 'Railway Helpline', number: '139' },
            { name: 'All India Railway', number: '1512' },
        ],
    },
];

// ─── Category Tile ─────────────────────────────────────────────────────────────
function CategoryTile({ cat, onPress, C }) {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    return (
        <Animated.View style={{ transform: [{ scale }], width: '22%' }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={[styles.tile, { backgroundColor: C.s2, borderColor: C.bd }]}
            >
                <View style={[styles.tileIconWrap, { backgroundColor: cat.accent + '18' }]}>
                    <Text style={styles.tileEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[styles.tileLabel, { color: C.tx2 }]} numberOfLines={2}>{cat.label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────────
function HelplinesSheet({ cat, visible, onClose, C }) {
    const translateY = useRef(new Animated.Value(400)).current;

    const show = () => Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
    const hide = (cb) => Animated.timing(translateY, { toValue: 500, duration: 220, useNativeDriver: true }).start(cb);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
            onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 80 || g.vy > 0.6) hide(onClose);
                else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
            },
        })
    ).current;

    if (!visible || !cat) return null;

    // trigger show on mount via key trick — use useEffect workaround inline
    setTimeout(show, 10);

    const accent = cat.accent;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={() => hide(onClose)}>
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={() => hide(onClose)}>
                <View style={{ flex: 1 }} />
            </Pressable>

            {/* Sheet */}
            <Animated.View
                style={[styles.sheet, { backgroundColor: C.bg, transform: [{ translateY }] }]}
                {...panResponder.panHandlers}
            >
                {/* Handle */}
                <View style={[styles.sheetHandle, { backgroundColor: C.bd }]} />

                {/* Header */}
                <View style={[styles.sheetHeader, { borderBottomColor: C.bd }]}>
                    <View style={[styles.sheetIconWrap, { backgroundColor: accent + '18' }]}>
                        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                    </View>
                    <Text style={[styles.sheetTitle, { color: C.tx }]}>{cat.label}</Text>
                    <TouchableOpacity
                        onPress={() => hide(onClose)}
                        style={[styles.sheetClose, { backgroundColor: C.s3 }]}
                    >
                        <Feather name="x" size={16} color={C.tx2} />
                    </TouchableOpacity>
                </View>

                {/* Entries */}
                <ScrollView
                    style={{ maxHeight: 420 }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {cat.entries.map((entry, i) => (
                        <View
                            key={i}
                            style={[
                                styles.entryRow,
                                {
                                    borderBottomColor: C.bd,
                                    borderBottomWidth: i < cat.entries.length - 1 ? 1 : 0,
                                },
                            ]}
                        >
                            <View style={[styles.entryIconWrap, { backgroundColor: accent + '14' }]}>
                                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.entryName, { color: C.tx }]}>{entry.name}</Text>
                                <Text style={[styles.entryNumber, { color: accent }]}>{entry.number}</Text>
                            </View>
                            <View style={styles.entryActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: accent + '14' }]}
                                    onPress={() => Linking.openURL(`tel:${entry.number.replace(/[^0-9+]/g, '')}`)}
                                >
                                    <Feather name="phone" size={14} color={accent} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function EssentialHelplines({ C }) {
    const [activeCategory, setActiveCategory] = useState(null);

    return (
        <View style={[styles.container, { backgroundColor: C.s2, borderColor: C.bd }]}>
            {/* Section Header */}
            <View style={[styles.sectionHeader, { borderBottomColor: C.bd }]}>
                <View style={[styles.headerIconWrap, { backgroundColor: C.primaryBg }]}>
                    <Feather name="phone-call" size={13} color={C.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: C.tx3 }]}>ESSENTIAL HELPLINES</Text>
                <View style={[styles.badge, { backgroundColor: C.redBg }]}>
                    <Text style={[styles.badgeText, { color: C.primary }]}>24 × 7</Text>
                </View>
            </View>

            {/* Tiles Grid */}
            <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <CategoryTile
                        key={cat.id}
                        cat={cat}
                        onPress={() => setActiveCategory(cat)}
                        C={C}
                    />
                ))}
            </View>

            {/* Bottom Sheet */}
            <HelplinesSheet
                cat={activeCategory}
                visible={!!activeCategory}
                onClose={() => setActiveCategory(null)}
                C={C}
            />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        flex: 1,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        paddingVertical: 14,
        gap: 10,
        rowGap: 12,
    },
    tile: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
    },
    tileIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileEmoji: {
        fontSize: 22,
    },
    tileLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 13,
    },
    // Sheet
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    sheetIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
    },
    sheetClose: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    entryIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    entryName: {
        fontSize: 14,
        fontWeight: '600',
    },
    entryNumber: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 0.3,
    },
    entryActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});