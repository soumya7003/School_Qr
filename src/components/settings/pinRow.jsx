// src/components/settings/PinRow.jsx
import { useTheme } from '@/providers/ThemeProvider';
import { useBiometricStore } from '@/store/biometricStore';
import { hasPin } from '@/services/pinService';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, Text, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import PinSetupModal from '@/components/auth/PinSetupModal';
import { Ionicons } from '@expo/vector-icons';

export default function PinRow({ isLast = false }) {
  const { colors: C } = useTheme();
  const { t } = useTranslation();
  const { isPinEnabled, setPinEnabled } = useBiometricStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [pinExists, setPinExists] = useState(false);

  // Check if PIN already exists on mount
  useEffect(() => {
    hasPin().then(setPinExists);
  }, []);

  const handleToggle = async (newValue) => {
    if (newValue) {
      // If PIN already exists, just enable the lock
      if (pinExists) {
        setPinEnabled(true);
        return;
      }
      // Otherwise, open setup modal
      setModalVisible(true);
    } else {
      // Disable PIN lock (but keep the PIN stored)
      Alert.alert(
        t('settings.pinDisableTitle', 'Disable PIN Lock?'),
        t('settings.pinDisableMsg', 'The app will no longer ask for your PIN when you return.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('settings.pinDisableConfirm', 'Disable'),
            style: 'destructive',
            onPress: () => setPinEnabled(false),
          },
        ]
      );
    }
  };

  const handlePinSetupSuccess = async () => {
    setPinExists(true);
    setPinEnabled(true);
    setModalVisible(false);
  };

  const subtitle = isPinEnabled
    ? t('settings.pinEnabledSub', 'App locks with your 4‑digit PIN')
    : t('settings.pinDisabledSub', 'Enable to lock app with a PIN');

  return (
    <>
      <View style={[
        styles.container,
        !isLast && { borderBottomWidth: 1, borderBottomColor: C.bd },
      ]}>
        <View style={styles.row}>
          <View style={[
            styles.iconWrap,
            {
              backgroundColor: isPinEnabled ? C.purpBg : C.s4,
              borderColor: isPinEnabled ? C.purpBd : C.bd2,
            },
          ]}>
            <Ionicons
              name="keypad-outline"
              size={18}
              color={isPinEnabled ? C.purp : C.tx3}
            />
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: C.tx }]}>
                {t('settings.pinLock', 'PIN App Lock')}
              </Text>
              <View style={[
                badge.wrap,
                {
                  backgroundColor: isPinEnabled ? C.okBg : C.s4,
                  borderColor: isPinEnabled ? C.okBd : C.bd2,
                },
              ]}>
                <Text style={[badge.text, { color: isPinEnabled ? C.ok : C.tx3 }]}>
                  {isPinEnabled ? t('common.on', 'ON') : t('common.off', 'OFF')}
                </Text>
              </View>
            </View>
            <Text style={[styles.sub, { color: C.tx3 }]}>{subtitle}</Text>
          </View>

          <Switch
            value={isPinEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: C.s5, true: C.purp + '80' }}
            thumbColor={isPinEnabled ? C.purp : C.tx3}
            ios_backgroundColor={C.s5}
          />
        </View>

        {isPinEnabled && (
          <TouchableOpacity
            style={[styles.changePinBtn, { borderTopColor: C.bd }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="create-outline" size={14} color={C.purp} />
            <Text style={[styles.changePinText, { color: C.purp }]}>
              {t('settings.changePin', 'Change PIN')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <PinSetupModal
        visible={modalVisible}
        onSuccess={handlePinSetupSuccess}
        onCancel={() => setModalVisible(false)}
        isChanging={pinExists}
      />
    </>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
  },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1, gap: 3 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  title: { fontSize: 14, fontWeight: '600' },
  sub: { fontSize: 12, lineHeight: 16 },
  changePinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
  },
  changePinText: { fontSize: 12, fontWeight: '600' },
});