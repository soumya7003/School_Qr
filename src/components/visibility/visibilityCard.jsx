import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { CheckIcon } from './icons';
import FieldRow from './FieldRow';
import { useTheme } from '@/providers/ThemeProvider';
import { styles } from '@/styles/visibility.style';

export default function VisibilityCard({ option, selected, onSelect, delay, themeColors }) {
  const { colors: C } = useTheme();
  const isSelected = selected === option.value;

  // Combine fields with visibility from constants
  const fieldsWithVisibility = option.fields.map((field, idx) => ({
    label: field,
    visible: option.fieldVisibility[idx],
  }));

  // Use themeColors prop to get accent colors (since they depend on theme)
  const accentColor = option.value === 'PUBLIC' ? C.ok :
                      option.value === 'MINIMAL' ? C.amb :
                      C.tx3;

  const iconBgColor = option.value === 'PUBLIC' ? C.okBg :
                      option.value === 'MINIMAL' ? C.ambBg :
                      C.s4;

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <TouchableOpacity
        style={[
          styles.optionCard,
          {
            backgroundColor: C.s2,
            borderColor: isSelected ? accentColor : C.bd,
          },
          isSelected && {
            borderWidth: 2,
            backgroundColor: accentColor + '0C',
          },
        ]}
        onPress={() => onSelect(option.value)}
        activeOpacity={0.75}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIconWrap, { backgroundColor: iconBgColor }]}>
            <Text style={{ fontSize: 22 }}>{option.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.optionTitleRow}>
              <Text style={[styles.optionLabel, { color: C.tx }]}>{option.label}</Text>
              {isSelected && (
                <View style={[styles.selectedDot, { backgroundColor: accentColor }]}>
                  <CheckIcon color={C.white} />
                </View>
              )}
            </View>
            <Text style={[styles.optionTagline, { color: accentColor }]}>{option.tagline}</Text>
          </View>
        </View>
        <Text style={[styles.optionDesc, { color: C.tx2 }]}>{option.description}</Text>
        {isSelected && (
          <Animated.View entering={FadeInRight.duration(300)} style={[styles.fieldBreakdown, { backgroundColor: C.s3 }]}>
            <Text style={[styles.fieldBreakdownTitle, { color: C.tx3 }]}>WHAT SCANNERS WILL SEE</Text>
            {fieldsWithVisibility.map((f) => (
              <FieldRow key={f.label} label={f.label} visible={f.visible} />
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}