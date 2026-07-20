import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

interface Props {
  /** Which dot is lit: Table home, Journal, or Settings. */
  active: 'table' | 'journal' | 'settings';
  onTable: () => void;
  onJournal: () => void;
  onSettings: () => void;
}

/** Wireframe bottom bar: three dots — Table · Journal · Settings. */
export function BottomBar({ active, onTable, onJournal, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const items = [
    { key: 'table' as const, onPress: onTable },
    { key: 'journal' as const, onPress: onJournal },
    { key: 'settings' as const, onPress: onSettings },
  ];
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, theme.space.lg) }]}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={item.onPress} style={styles.item} hitSlop={16}>
          <View style={[styles.dot, active === item.key && styles.dotActive]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: theme.space.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  item: { alignItems: 'center', justifyContent: 'center', width: 44, height: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.accent },
});
