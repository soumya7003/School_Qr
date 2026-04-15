import Screen from '@/components/common/Screen';
import { useTheme } from '@/providers/ThemeProvider';
import { useProfile } from '@/features/profile/useProfile';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { VisibilityCard, BackIcon } from '@/components/visibility';
import { VISIBILITY_OPTIONS } from '@/constants/visibility';
import { styles } from '@/styles/visibility.style';

export default function VisibilityScreen() {
  const router = useRouter();
  const { colors: C } = useTheme();
  const { student, updateVisibility } = useProfile();

  const [selected, setSelected] = useState(student?.card_visibility?.visibility ?? 'PUBLIC');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentOption = VISIBILITY_OPTIONS.find((opt) => opt.value === selected);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVisibility({ visibility: selected, hidden_fields: [] });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.back();
      }, 1200);
    } catch {
      Alert.alert('Save Failed', 'Could not update visibility. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen bg={C.bg} edges={['top', 'left', 'right']}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={[styles.header, { borderBottomColor: C.bd }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: C.s2, borderColor: C.bd }]} onPress={() => router.back()} activeOpacity={0.7}>
          <BackIcon color={C.tx} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: C.tx }]}>Who Can See What</Text>
          <Text style={[styles.pageSubtitle, { color: C.tx3 }]}>Controls what strangers see when they scan</Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={[styles.contextBanner, { backgroundColor: C.blueBg, borderColor: C.blueBd }]}>
          <Text style={{ fontSize: 16 }}>ℹ️</Text>
          <Text style={[styles.contextText, { color: C.tx2 }]}>
            This controls what a <Text style={{ color: C.tx, fontWeight: '700' }}>stranger</Text> sees when they scan your child's physical card. In a real emergency, <Text style={{ color: C.tx, fontWeight: '700' }}>Full Info</Text> helps first responders act faster.
          </Text>
        </Animated.View>

        {VISIBILITY_OPTIONS.map((opt, i) => (
          <VisibilityCard
            key={opt.value}
            option={opt}
            selected={selected}
            onSelect={setSelected}
            delay={100 + i * 60}
          />
        ))}

        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saved ? C.ok : C.primary }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Text style={[styles.saveBtnText, { color: C.white }]}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : `Save — ${currentOption?.label}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {selected === 'HIDDEN' && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.hiddenWarning, { backgroundColor: C.ambBg, borderColor: C.ambBd }]}>
            <Text style={[styles.hiddenWarningText, { color: C.amb }]}>
              ⚠️ Hidden mode means no one can help your child in an emergency. Only use this temporarily if the card is lost.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}