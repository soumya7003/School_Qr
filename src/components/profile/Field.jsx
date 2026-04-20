// src/components/profile/Field.jsx
import { typography } from '@/theme';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { InfoSvg } from './icons/profile.icon.index';

export function Field({
    label, value, onChangeText, placeholder, multiline, keyboardType, hint, required, C,
    inputRef: externalRef, onSubmitEditing, returnKeyType
}) {
    const internalRef = useRef(null);
    const ref = externalRef ?? internalRef;
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
    }, [value]);

    const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [C.bd2, C.primary] });

    return (
        <TouchableWithoutFeedback onPress={() => ref.current?.focus()}>
            <View style={styles.wrap}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: C.tx3 }]}>{label}</Text>
                    {required && <View style={[styles.reqDot, { backgroundColor: C.primary }]} />}
                </View>
                <Animated.View style={[styles.box, { borderColor, backgroundColor: C.s2 }]}>
                    <TextInput
                        ref={ref}
                        style={[styles.input, { color: C.tx }, multiline && styles.inputMulti]}
                        value={value || ''}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={C.tx3}
                        multiline={multiline}
                        numberOfLines={multiline ? 3 : 1}
                        keyboardType={keyboardType ?? 'default'}
                        textAlignVertical={multiline ? 'top' : 'center'}
                        selectionColor={C.primary}
                        onSubmitEditing={onSubmitEditing}
                        returnKeyType={returnKeyType ?? (multiline ? 'default' : 'next')}
                        blurOnSubmit={!multiline}
                    />
                </Animated.View>
                {hint && (
                    <View style={styles.hintRow}>
                        <InfoSvg c={C.tx3} s={11} />
                        <Text style={[styles.hint, { color: C.tx3 }]}>{hint}</Text>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 6 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    reqDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
    box: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 44 },
    input: { ...typography.bodyMd, height: 42, paddingVertical: 0, fontSize: 15, paddingHorizontal: 0 },
    inputMulti: { height: 80, paddingTop: 10, paddingBottom: 10, textAlignVertical: 'top' },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    hint: { fontSize: 11, fontStyle: 'italic' },
});