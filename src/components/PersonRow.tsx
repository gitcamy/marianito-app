import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Friend } from '@/types/models';
import { theme } from '@/theme';
import { Avatar } from './Avatar';

interface Props {
  person: Friend;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Right-side accessory overriding the selection check (e.g. Unblock button). */
  accessory?: React.ReactNode;
}

export function PersonRow({ person, selected, onPress, onLongPress, accessory }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <Avatar name={person.displayName} uri={person.avatarUri} showNearbyDot={person.isNearby} />
      <View style={styles.text}>
        <Text style={styles.name}>{person.displayName}</Text>
        <Text style={styles.handle}>@{person.username}</Text>
      </View>
      {person.isNearby ? (
        <View style={styles.nearbyPill}>
          <Text style={styles.nearbyLabel}>nearby</Text>
        </View>
      ) : null}
      {accessory ??
        (selected !== undefined ? (
          <View style={[styles.check, selected && styles.checkOn]}>
            {selected ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space.md,
    gap: theme.space.md,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1 },
  name: { fontSize: theme.type.size.md, color: theme.colors.textPrimary, fontWeight: '500' },
  handle: { fontSize: theme.type.size.sm, color: theme.colors.textSecondary, marginTop: 1 },
  nearbyPill: {
    backgroundColor: theme.colors.badgeBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.sm + 2,
    paddingVertical: 3,
  },
  nearbyLabel: { fontSize: theme.type.size.xs, color: theme.colors.olive, fontWeight: '600' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  checkMark: { color: theme.colors.ctaText, fontSize: 13, fontWeight: '700' },
});
