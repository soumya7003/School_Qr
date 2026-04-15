// src/components/profile/ContactModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Field } from './Field';
import { CheckSvg, XSvg } from './icons/profile.icon.index';

export function ContactModal({ visible, contact, onSave, onClose, C }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [rel, setRel] = useState('');
    const phoneRef = useRef(null);
    const relRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setName(contact?.name ?? '');
            setPhone(contact?.phone ?? '');
            setRel(contact?.relationship ?? '');
        }
    }, [visible, contact]);

    const handleSave = () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Required Fields', 'Please enter a contact name and phone number.');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(phone.trim()) && !phone.trim().startsWith('+')) {
            Alert.alert('Invalid Phone Number', 'Enter a valid 10-digit Indian mobile number or an international number starting with +.');
            return;
        }
        onSave({ name: name.trim(), phone: phone.trim(), relationship: rel.trim() });
        onClose();
    };

    const isEditing = !!contact?.id;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView behavior="padding" style={styles.kavContainer} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                    <Pressable style={[styles.sheet, { backgroundColor: C.s2, borderColor: C.bd2 }]}>
                        <View style={[styles.handle, { backgroundColor: C.s4 }]} />
                        <View style={styles.sheetHead}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sheetTitle, { color: C.tx }]}>
                                    {isEditing ? 'Edit Contact' : 'Add Emergency Contact'}
                                </Text>
                                <Text style={[styles.sheetSub, { color: C.tx3 }]}>
                                    This person will be called when your child's card is scanned.
                                </Text>
                            </View>
                            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: C.s3, borderColor: C.bd }]} onPress={onClose}>
                                <XSvg c={C.tx3} s={14} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.fields}>
                            <Field
                                label="Contact Name" value={name} onChangeText={setName} placeholder="e.g., Priya Sharma"
                                required hint="Full name as saved in the contact's phone" C={C}
                                onSubmitEditing={() => phoneRef.current?.focus()} returnKeyType="next"
                            />
                            <Field
                                label="Mobile Number" value={phone} onChangeText={setPhone} placeholder="e.g., 98765 43210"
                                keyboardType="phone-pad" required
                                hint="10-digit Indian number. International: start with +" C={C}
                                inputRef={phoneRef} onSubmitEditing={() => relRef.current?.focus()} returnKeyType="next"
                            />
                            <Field
                                label="Relationship" value={rel} onChangeText={setRel} placeholder="e.g., Mother, Father, Uncle"
                                hint="Optional — helps responders know who they're speaking to" C={C}
                                inputRef={relRef} returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
                            />
                            <View style={[styles.rulesBox, { backgroundColor: C.s3, borderColor: C.bd }]}>
                                <Text style={[styles.rulesTitle, { color: C.tx2 }]}>Phone number rules</Text>
                                <Text style={[styles.ruleItem, { color: C.tx3 }]}>✓  Must be a reachable mobile number</Text>
                                <Text style={[styles.ruleItem, { color: C.tx3 }]}>✓  10 digits for India (6–9 start) or + prefix for international</Text>
                                <Text style={[styles.ruleItem, { color: C.tx3 }]}>✕  No landlines, no WhatsApp-only numbers</Text>
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.primary }]} onPress={handleSave} activeOpacity={0.85}>
                            <CheckSvg c="#fff" s={14} />
                            <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Add Contact'}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    kavContainer: { width: '100%' },
    sheet: {
        borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0,
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, gap: 14, maxHeight: '90%'
    },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    sheetTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    sheetSub: { fontSize: 12, marginTop: 3, lineHeight: 17 },
    closeBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    fields: { gap: 14, paddingBottom: 8 },
    rulesBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 5 },
    rulesTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
    ruleItem: { fontSize: 11.5, lineHeight: 18 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 15 },
    saveBtnText: { fontSize: 14.5, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});