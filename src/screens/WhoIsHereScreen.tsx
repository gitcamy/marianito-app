import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PersonRow } from '@/components/PersonRow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useFriendStore } from '@/stores/useFriendStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTableStore } from '@/stores/useTableStore';
import { Friend } from '@/types/models';
import { theme } from '@/theme';
import { confirmAction } from '@/utils/confirm';

/** 05 — Add Who's Present (C2): nearby surfaced first, search, ≥1 selection required. */
export function WhoIsHereScreen() {
  const router = useRouter();
  const draft = useTableStore((s) => s.draft);
  const toggle = useTableStore((s) => s.toggleParticipant);
  const search = useFriendStore((s) => s.search);
  const block = useFriendStore((s) => s.block);
  const discoverable = useSettingsStore((s) => s.settings.discoverablePresence);

  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Friend[]>([]);

  useEffect(() => {
    let live = true;
    search(query).then((r) => {
      if (live) setPeople(r);
    });
    return () => {
      live = false;
    };
  }, [query, search]);

  const selected = draft?.participantIds ?? [];
  const count = selected.length + 1; // + the initiator

  const { nearby, rest } = useMemo(() => {
    const nearby = discoverable ? people.filter((p) => p.isNearby) : [];
    const rest = people.filter((p) => !nearby.includes(p));
    return { nearby, rest };
  }, [people, discoverable]);

  // H1: block directly from the people list.
  const confirmBlock = (person: Friend) =>
    confirmAction(
      `Block @${person.username}?`,
      'They will disappear from your lists and search.',
      'Block',
      async () => {
        await block(person.id);
        setPeople(await search(query));
      },
    );

  const sections = [
    ...(nearby.length ? [{ label: 'Nearby presence', data: nearby }] : []),
    ...(rest.length ? [{ label: nearby.length ? 'Everyone' : 'People', data: rest }] : []),
  ];

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
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
