// src/components/profile/StepBar.jsx
import { STEPS } from '@/constants/profile';
import { spacing } from '@/theme';
import { StyleSheet, Text, View } from 'react-native';
import { CheckSvg } from './icons/profile.icon.index';

export function StepBar({ current, completed, C }) {
    return (
        <View style={[styles.wrap, { backgroundColor: C.s2, borderBottomColor: C.bd }]}>
            <View style={styles.container}>
                {STEPS.map((step, i) => {
                    const isActive = i === current;
                    const isDone = completed.includes(i);
                    const isPast = i < current || isDone;

                    return (
                        <View key={step.id} style={styles.stepItem}>
                            {i < STEPS.length - 1 && (
                                <View style={styles.connectorWrapper}>
                                    <View
                                        style={[
                                            styles.connector,
                                            { backgroundColor: C.bd2 },
                                            isPast && { backgroundColor: C.primary }
                                        ]}
                                    />
                                </View>
                            )}
                            <View style={[styles.circleContainer, isActive && styles.circleActive]}>
                                <View style={[
                                    styles.circle,
                                    {
                                        backgroundColor: isDone ? C.ok : (isActive ? C.primary : C.s3),
                                        borderColor: isDone ? C.ok : (isActive ? C.primary : C.bd2),
                                    },
                                ]}>
                                    {isDone ? (
                                        <CheckSvg c="#fff" s={12} />
                                    ) : (
                                        <Text style={[styles.stepNumber, { color: isActive ? '#fff' : C.tx3 }]}>
                                            {step.short}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Text style={[
                                styles.label,
                                { color: C.tx3 },
                                isActive && { color: C.tx, fontWeight: '700' },
                                isDone && { color: C.ok }
                            ]}>
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: spacing.screenH,
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    connectorWrapper: {
        position: 'absolute',
        top: 14,
        left: '50%',
        right: '-50%',
        height: 2,
        zIndex: 0,
    },
    connector: {
        height: 2,
        width: '100%',
    },
    circleContainer: {
        zIndex: 1,
        marginBottom: 8,
    },
    circleActive: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    circle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumber: {
        fontSize: 13,
        fontWeight: '700',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        textAlign: 'center',
    },
});