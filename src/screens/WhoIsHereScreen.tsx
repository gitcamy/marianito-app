import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useFriendStore } from '@/stores/useFriendStore';
import { useTableStore } from '@/stores/useTableStore';
import { Friend } from '@/types/models';
import { theme } from '@/theme';
import { confirmAction } from '@/utils/confirm';
import { friendlyMessage } from '@/utils/errors';
import { useSafeBack } from '@/hooks/useSafeBack';

/**
 * 05 — Add Who's Present (C2).
 * Default view: "Nearby" (friends first, then nearby non-friends, all chipped)
 * and "Friends" below. Everyone else is only findable by searching directly.
 */
export function WhoIsHereScreen() {
  const router = useRouter();
  const draft = useTableStore((s) => s.draft);
  const toggle = useTableStore((s) => s.toggleParticipant);
  const openTable = useTableStore((s) => s.open);
  const search = useFriendStore((s) => s.search);
  const block = useFriendStore((s) => s.block);
  const addGuest = useFriendStore((s) => s.addGuest);
  const nearbyPeople = useFriendStore((s) => s.nearbyPeople);
  const listFriends = useFriendStore((s) => s.refresh);
  const friends = useFriendStore((s) => s.friends);

  const goBack = useSafeBack('/');
  const [query, setQuery] = useState('');
  const [nearby, setNearby] = useState<Friend[]>([]);
  const [results, setResults] = useState<Friend[]>([]);
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // Direct load (refresh/deep link) lands here without a draft — open one now
  // so selection works. openedAt = now keeps Marianito Hour semantics right.
  useEffect(() => {
    if (!draft) openTable();
  }, [draft, openTable]);

  const loadDefault = useCallback(async () => {
    const [n] = await Promise.all([nearbyPeople().catch(() => [] as Friend[]), listFriends()]);
    setNearby(n);
  }, [nearbyPeople, listFriends]);

  useEffect(() => {
    loadDefault();
  }, [loadDefault]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      return;
    }
    let live = true;
    search(trimmedQuery).then((r) => {
      if (live) setResults(r);
    });
    return () => {
      live = false;
    };
  }, [trimmedQuery, search]);

  const selected = draft?.participantIds ?? [];
  const count = selected.length + 1; // + the initiator

  const sections = useMemo(() => {
    if (trimmedQuery) {
      return results.length ? [{ label: 'Results', data: results }] : [];
    }
    // My discoverable-presence toggle affects only MY visibility to others —
    // it never hides other (opted-in) people from me.
    const nearbySorted = [...nearby].sort((a, b) => Number(b.isFriend) - Number(a.isFriend));
    // Friends ALWAYS all show below, alphabetically — nearby friends
    // intentionally appear twice.
    const friendsAlpha = [...friends].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
    return [
      ...(nearbySorted.length ? [{ label: 'Nearby', data: nearbySorted }] : []),
      ...(friendsAlpha.length ? [{ label: 'Friends', data: friendsAlpha }] : []),
    ];
  }, [trimmedQuery, results, nearby, friends]);

  // H1: block directly from the people list.
  const confirmBlock = (person: Friend) =>
    confirmAction(
      `Block @${person.username}?`,
      'They will disappear from your lists and search.',
      'Block',
      async () => {
        await block(person.id);
        await loadDefault();
        if (trimmedQuery) setResults(await search(trimmedQuery));
      },
    );

  // Guest friends: type a name, add them without an account, keep them forever.
  const visible = trimmedQuery ? results : [...nearby, ...friends];
  const q = trimmedQuery.toLowerCase();
  const exactMatch = visible.some(
    (p) => p.displayName.toLowerCase() === q || p.username.toLowerCase() === q,
  );
  const showAddGuest = trimmedQuery.length >= 2 && !exactMatch;

  const createGuest = async () => {
    if (addingGuest) return;
    setGuestError(null);
    setAddingGuest(true);
    try {
      const guest = await addGuest(trimmedQuery);
      toggle(guest.id); // seat them at this table right away
      setQuery('');
      await loadDefault();
    } catch (e) {
      setGuestError(friendlyMessage(e, "Couldn't add them — try again."));
    } finally {
      setAddingGuest(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Who's here?</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.searchWrap}>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={sections.flatMap((s) => [{ header: s.label } as const, ...s.data])}
        keyExtractor={(item, i) => ('header' in item ? `h-${item.header}` : item.id) + i}
        contentContainerStyle={styles.list}
        renderItem={({ item }) =>
          'header' in item ? (
            <Text style={styles.sectionLabel}>{item.header}</Text>
          ) : (
            <PersonRow
              person={item}
              selected={selected.includes(item.id)}
              onPress={() => toggle(item.id)}
              onLongPress={() => confirmBlock(item)}
            />
          )
        }
        ListFooterComponent={
          <>
          {guestError ? <Text style={styles.guestErrorText}>{guestError}</Text> : null}
          {showAddGuest ? (
            <Pressable onPress={createGuest} style={styles.addGuestRow} disabled={addingGuest}>
              <View style={styles.addGuestIcon}>
                <Text style={styles.addGuestPlus}>+</Text>
              </View>
              <Text style={styles.addGuestLabel}>
                Add “{trimmedQuery}” as a friend
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.guestHint}>
              {trimmedQuery
                ? 'No one by that name yet.'
                : 'Someone else? Search their name — or type it to add them as a friend.'}
            </Text>
          )}
          </>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.count}>
          {count} {count === 1 ? 'person' : 'people'} at the table
        </Text>
        <PrimaryButton
          title="Next"
          onPress={() => router.push('/table/moment')}
          disabled={selected.length < 1} // the 2-person rule: you + at least one more
        />
      </View>
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
  searchWrap: { paddingHorizontal: theme.space.xl, marginTop: theme.space.lg },
  list: { paddingHorizontal: theme.space.xl, paddingBottom: theme.space.xl },
  sectionLabel: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xl,
    marginBottom: theme.space.xs,
  },
  addGuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.md,
  },
  addGuestIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.cardTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGuestPlus: { fontSize: theme.type.size.lg, color: theme.colors.accent, lineHeight: 24 },
  addGuestLabel: { fontSize: theme.type.size.md, color: theme.colors.accent, fontWeight: '600' },
  guestHint: {
    fontSize: theme.type.size.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xl,
    lineHeight: 17,
  },
  guestErrorText: {
    fontSize: theme.type.size.sm,
    color: theme.colors.danger,
    marginTop: theme.space.lg,
  },
  footer: {
    padding: theme.space.xl,
    paddingTop: theme.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    gap: theme.space.md,
  },
  count: {
    textAlign: 'center',
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
  },
});
