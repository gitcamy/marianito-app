import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { theme } from '@/theme';

interface Props {
  months: { key: string; label: string }[];
  /** null = All */
  value: string | null;
  onChange: (key: string | null) => void;
}

/** D3: month filter chips derived from real entry dates + "All". */
export function MonthChips({ months, value, onChange }: Props) {
  const chips: { key: string | null; label: string }[] = [
    ...months.map((m) => ({ key: m.key as string | null, label: m.label })),
    { key: null, label: 'All' },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key ?? 'all'}
            onPress={() => onChange(chip.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: theme.space.sm, paddingRight: theme.space.lg },
  chip: {
    paddingHorizontal: theme.space.lg,
    height: 34,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  label: { fontSize: theme.type.size.sm, color: theme.colors.textPrimary, fontWeight: '500' },
  labelActive: { color: theme.colors.ctaText, fontWeight: '600' },
});
