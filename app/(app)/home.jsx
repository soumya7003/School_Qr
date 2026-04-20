// app/(app)/home.jsx
import Screen from '@/components/common/Screen';
import { EssentialHelplines } from '@/components/home/EssentialHelplines';
import {
  ChildSwitcher,
  EmergencyCard,
  HeroCard,
  HomeSkeleton,
  LastScanCard,
  QuickActions
} from '@/components/home/home.index';
import { useAuthStore } from '@/features/auth/auth.store';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { useTheme } from '@/providers/ThemeProvider';
import { homeStyles } from '@/styles/home.style';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const { parentUser } = useAuthStore();

  const {
    loading,
    refreshing,
    students,
    activeStudent,
    activeStudentId,
    token,
    emergency,
    contacts,
    lastScan,
    scanCount,
    setActiveStudent,
    onRefresh,
  } = useHomeData();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.greetingMorning') : hour < 17 ? t('home.greetingAfternoon') : t('home.greetingEvening');
  const userName = activeStudent?.first_name || parentUser?.name?.split(' ')[0] || '';

  if (loading) {
    return (
      <Screen bg={C.bg}>
        <ScrollView contentContainerStyle={homeStyles.scroll}>
          <HomeSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen bg={C.bg}>
      <ScrollView
        contentContainerStyle={homeStyles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <Text style={[homeStyles.greeting, { color: C.tx }]}>
            {userName ? `${userName}, ` : ''}{greeting} 👋
          </Text>
          <Text style={[homeStyles.subGreeting, { color: C.tx3 }]}>
            {activeStudent ? t('home.subtitleNamed', { name: activeStudent.first_name }) : t('home.subtitle')}
          </Text>
        </Animated.View>

        {/* Child Switcher */}
        {students?.length > 1 && (
          <Animated.View entering={FadeInDown.delay(40).duration(400)}>
            <ChildSwitcher
              students={students}
              activeStudentId={activeStudentId}
              onSelect={setActiveStudent}
              C={C}
            />
          </Animated.View>
        )}

        {/* Hero Card */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <HeroCard
            student={activeStudent}
            token={token}
            onPress={() => router.push('/(app)/qr')}
            C={C}
          />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <QuickActions
            onShowQR={() => router.push('/(app)/qr')}
            onEditProfile={() => router.push('/(app)/updates')}
            onScanHistory={() => router.push('/(app)/scan-history')}
            C={C}
          />
        </Animated.View>

        {/* Emergency Card */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <EmergencyCard
            emergency={emergency}
            contacts={contacts}
            onEdit={() => router.push('/(app)/updates')}
            C={C}
          />
        </Animated.View>

        {/* Last Scan Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <LastScanCard
            scan={lastScan}
            totalScans={scanCount}
            onPress={() => router.push('/(app)/scan-history')}
            C={C}
          />
        </Animated.View>

        {/* Essential Helplines */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <EssentialHelplines C={C} />
        </Animated.View>

        {/* Safety Tip */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <View style={[homeStyles.safetyTip, { backgroundColor: C.okBg, borderColor: C.okBd }]}>
            <Feather name="shield" size={16} color={C.ok} />
            <Text style={[homeStyles.safetyText, { color: C.tx2 }]}>{t('home.safetyTip')}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}