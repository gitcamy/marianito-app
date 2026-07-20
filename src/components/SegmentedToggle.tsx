import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: { color: theme.colors.ctaText, fontWeight: '600' },
});
