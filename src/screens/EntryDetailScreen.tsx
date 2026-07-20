import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EntryPhoto } from '@/components/EntryPhoto';
import { MarianitoBadge } from '@/components/MarianitoBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ME_ID, SEED_FRIENDS } from '@/mocks/seed';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntryStore } from '@/stores/useEntryStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { theme } from '@/theme';
import { entryDateLabel } from '@/utils/dates';
import { pickPhoto } from '@/utils/pickPhoto';

/** 07 — Co-authored Entry (C3, C4, D5, E2 badge). */
export function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const entry = useEntryStore((s) => s.entries.find((e) => e.id === id));
  const addAppend = useEntryStore((s) => s.addAppend);
  const friends = useFriendStore((s) => s.friends);
  const blocked = useFriendStore((s) => s.blocked);

  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => {
    const map = new Map<string, { displayName: string; username: string; avatarUri: string | null }>();
    for (const f of [...SEED_FRIENDS, ...friends, ...blocked]) map.set(f.id, f);
    if (user) map.set(ME_ID, user);
    return map;
  }, [friends, blocked, user]);

  if (!entry) {
    return (
      <ScreenContainer>
        <View style={styles.missing}>
          <Text style={styles.missingText}>This moment is gone.</Text>
          <PrimaryButton title="Back to journal" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const nameOf = (pid: string) =>
    pid === ME_ID ? 'You' : (peopleById.get(pid)?.displayName ?? 'Someone');

  const isTagged = entry.participantIds.includes(ME_ID) && entry.initiatorId !== ME_ID;
  const hasAppended = entry.appends.some((a) => a.authorId === ME_ID);
  const showTaggedCard = isTagged && !hasAppended;

  const submitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setBusy(true);
    try {
      await addAppend(entry.id, { authorId: ME_ID, kind: 'comment', text });
      setComment('');
    } finally {
      setBusy(false);
    }
  };

  const addPhotoAppend = async () => {
    const uri = await pickPhoto();
    if (uri) {
      await addAppend(entry.id, { authorId: ME_ID, kind: 'photo', photoUri: uri });
    }
  };

  return (
    <ScreenContainer keyboard edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Journal</Text>
        </Pressable>

        {entry.isMarianitoHour ? (
          <View style={styles.badgeWrap}>
            <MarianitoBadge />
          </View>
        ) : null}

        <EntryPhoto uri={entry.photoUri} style={styles.photo} radius={theme.radius.lg} />

        {entry.caption ? <Text style={styles.caption}>{entry.caption}</Text> : null}
        <Text style={styles.meta}>
          {entryDateLabel(entry.createdAt)}
          {entry.location ? `  ·  ${entry.location}` : ''}
        </Text>

        <Text style={styles.sectionLabel}>At the table</Text>
        <View style={styles.people}>
          {entry.participantIds.map((pid) => {
            const p = peopleById.get(pid);
            return (
              <View key={pid} style={styles.person}>
                <Avatar name={p?.displayName ?? '?'} uri={p?.avatarUri} size={28} />
                <Text style={styles.personName}>{nameOf(pid)}</Text>
              </View>
            );
          })}
        </View>

        {entry.appends.length > 0 ? (
          <View style={styles.appends}>
            {entry.appends.map((a) => (
              <View key={a.id} style={styles.append}>
                <Avatar
                  name={peopleById.get(a.authorId)?.displayName ?? '?'}
                  uri={peopleById.get(a.authorId)?.avatarUri}
                  size={24}
                />
                <View style={styles.appendBody}>
                  <Text style={styles.appendAuthor}>{nameOf(a.authorId)}</Text>
                  {a.kind === 'comment' ? (
                    <Text style={styles.appendText}>{a.text}</Text>
                  ) : (
                    <EntryPhoto uri={a.photoUri} style={styles.appendPhoto} radius={theme.radius.sm} />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {showTaggedCard ? (
          <View style={styles.taggedCard}>
            <Text style={styles.taggedTitle}>You were tagged</Text>
            <Text style={styles.taggedSubtitle}>Add a photo or comment</Text>
            <View style={styles.taggedRow}>
              <TextField
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment…"
                containerStyle={styles.taggedField}
              />
              <PrimaryButton
                title="Add"
                onPress={submitComment}
                disabled={!comment.trim()}
                loading={busy}
                style={styles.taggedAdd}
              />
            </View>
            <PrimaryButton title="Add a photo instead" variant="ghost" onPress={addPhotoAppend} />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: theme.space.xl, paddingBottom: theme.space.xxl },
  back: { fontSize: theme.type.size.md, color: theme.colors.link, marginBottom: theme.space.lg },
  badgeWrap: { marginBottom: theme.space.md },
  photo: { width: '100%', height: 260 },
  caption: {
    fontSize: theme.type.size.md,
    color: theme.colors.textPrimary,
    marginTop: theme.space.lg,
    lineHeight: 22,
  },
  meta: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.sm,
  },
  sectionLabel: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xl,
    marginBottom: theme.space.md,
  },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.lg },
  person: { alignItems: 'center', maxWidth: 64 },
  personName: {
    fontSize: theme.type.size.xs,
    color: theme.colors.textPrimary,
    marginTop: theme.space.xs,
  },
  appends: { marginTop: theme.space.xl, gap: theme.space.lg },
  append: { flexDirection: 'row', gap: theme.space.md },
  appendBody: { flex: 1 },
  appendAuthor: { fontSize: theme.type.size.sm, fontWeight: '600', color: theme.colors.textPrimary },
  appendText: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textPrimary,
    marginTop: 2,
    lineHeight: 20,
  },
  appendPhoto: { width: '100%', height: 140, marginTop: theme.space.sm },
  taggedCard: {
    marginTop: theme.space.xxl,
    backgroundColor: theme.colors.cardTint,
    borderRadius: theme.radius.lg,
    padding: theme.space.xl,
  },
  taggedTitle: {
    fontSize: theme.type.size.md,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  taggedSubtitle: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.space.xs,
    marginBottom: theme.space.lg,
  },
  taggedRow: { flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.sm },
  taggedField: { flex: 1 },
  taggedAdd: { paddingHorizontal: theme.space.lg },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space.lg },
  missingText: { fontSize: theme.type.size.md, color: theme.colors.textSecondary },
});
