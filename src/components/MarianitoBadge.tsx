import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

/** E2: marker for entries whose table opened during Marianito Hour (1–2pm). */
export function MarianitoBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.label}>Marianito Hour</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space.sm,
    backgroundColor: theme.colors.badgeBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.xs + 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.accent },
  label: { fontSize: theme.type.size.sm, fontWeight: '600', color: theme.colors.textPrimary },
});
