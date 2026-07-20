import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { theme } from '@/theme';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

export function SettingToggleRow({ label, value, onValueChange }: ToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
        thumbColor="#FDFAF5"
      />
    </View>
  );
}

interface LinkProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function SettingLinkRow({ label, onPress, destructive }: LinkProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.space.lg - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: theme.type.size.md, color: theme.colors.textPrimary },
  destructive: { color: theme.colors.danger },
  chevron: { fontSize: theme.type.size.lg, color: theme.colors.textSecondary },
});
