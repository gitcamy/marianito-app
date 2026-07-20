import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useFriendStore } from '@/stores/useFriendStore';
import { Friend } from '@/types/models';
import { theme } from '@/theme';
import { useSafeBack } from '@/hooks/useSafeBack';

/** H1 — Blocked accounts: list, block more (via search screens), unblock here. */
export function BlockedAccountsScreen() {
  const router = useRouter();
  const blocked = useFriendStore((s) => s.blocked);
  const refresh = useFriendStore((s) => s.refresh);
  const unblock = useFriendStore((s) => s.unblock);
  const search = useFriendStore((s) => s.search);
  const block = useFriendStore((s) => s.block);
  const goBack = useSafeBack('/settings');
  const [others, setOthers] = useState<Friend[]>([]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    search('').then(setOthers);
  }, [search, blocked]);

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Blocked accounts</Text>
        <View style={styles.back} />
      </View>

      <FlatList
        data={blocked}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No blocked accounts. Long-press anyone in a people list to block them.
          </Text>
        }
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            accessory={
              <Pressable onPress={() => unblock(item.id)} style={styles.unblockBtn}>
                <Text style={styles.unblockLabel}>Unblock</Text>
              </Pressable>
            }
          />
        )}
        ListFooterComponent={
          others.length > 0 ? (
            <View>
              <Text style={styles.sectionLabel}>People</Text>
              {others.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  accessory={
                    <Pressable onPress={() => block(p.id)} style={styles.blockBtn}>
                      <Text style={styles.blockLabel}>Block</Text>
                    </Pressable>
                  }
                />
              ))}
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
  },
  back: { fontSize: theme.type.size.md, color: theme.colors.link, minWidth: 52 },
  title: {
    fontSize: theme.type.size.lg,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
  },
  list: { padding: theme.space.xl },
  empty: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.space.xl,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xl,
    marginBottom: theme.space.xs,
  },
  unblockBtn: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.md,
    paddingVertical: 5,
  },
  unblockLabel: { color: theme.colors.accent, fontSize: theme.type.size.xs, fontWeight: '600' },
  blockBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.md,
    paddingVertical: 6,
  },
  blockLabel: { color: theme.colors.ctaText, fontSize: theme.type.size.xs, fontWeight: '600' },
});
