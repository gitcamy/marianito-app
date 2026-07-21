import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EntryPhoto } from '@/components/EntryPhoto';
import { MarianitoBadge } from '@/components/MarianitoBadge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEntryStore } from '@/stores/useEntryStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { EntryAppend, Friend } from '@/types/models';
import { theme } from '@/theme';
import { confirmAction } from '@/utils/confirm';
import { entryDateLabel } from '@/utils/dates';
import { friendlyMessage } from '@/utils/errors';
import { pickPhoto } from '@/utils/pickPhoto';
import { useSafeBack } from '@/hooks/useSafeBack';

/** 07 — Co-authored Entry (C3, C4, D5, E2 badge). */
export function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const myId = user?.id ?? '';
  const entry = useEntryStore((s) => s.entries.find((e) => e.id === id));
  const entriesLoaded = useEntryStore((s) => s.loaded);
  const refreshEntries = useEntryStore((s) => s.refresh);
  const addAppend = useEntryStore((s) => s.addAppend);
  const updateEntry = useEntryStore((s) => s.update);
  const hideEntry = useEntryStore((s) => s.hide);
  const leaveEntry = useEntryStore((s) => s.leave);
  const updateAppend = useEntryStore((s) => s.updateAppend);
  const deleteAppend = useEntryStore((s) => s.deleteAppend);
  const loadProfiles = useFriendStore((s) => s.profiles);

  useEffect(() => {
    if (!entriesLoaded) refreshEntries();
  }, [entriesLoaded, refreshEntries]);

  const goBack = useSafeBack('/');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Friend[]>([]);

  const [editingPost, setEditingPost] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);

  const [editingAppendId, setEditingAppendId] = useState<string | null>(null);
  const [editAppendText, setEditAppendText] = useState('');

  const personIds = useMemo(() => {
    if (!entry) return [];
    return [...new Set([...entry.participantIds, ...entry.appends.map((a) => a.authorId)])];
  }, [entry]);

  useEffect(() => {
    if (personIds.length) loadProfiles(personIds).then(setPeople);
  }, [personIds, loadProfiles]);

  const peopleById = useMemo(() => {
    const map = new Map<string, { displayName: string; username: string; avatarUri: string | null }>();
    for (const f of people) map.set(f.id, f);
    if (user) map.set(user.id, user);
    return map;
  }, [people, user]);

  if (!entry) {
    return (
      <ScreenContainer>
        <View style={styles.missing}>
          {entriesLoaded ? (
            <>
              <Text style={styles.missingText}>This moment is gone.</Text>
              <PrimaryButton title="Back to journal" onPress={goBack} />
            </>
          ) : null}
        </View>
      </ScreenContainer>
    );
  }

  const nameOf = (pid: string) =>
    pid === myId ? 'You' : (peopleById.get(pid)?.displayName ?? 'Someone');

  const isParticipant = entry.participantIds.includes(myId);
  const isTagged = isParticipant && entry.initiatorId !== myId;
  const hasAppended = entry.appends.some((a) => a.authorId === myId);
  const showTaggedCard = isTagged && !hasAppended;
  const showComposer = isParticipant && !showTaggedCard;

  const startEditPost = () => {
    setEditCaption(entry.caption);
    setEditLocation(entry.location ?? '');
    setEditPhotoUri(entry.photoUri);
    setEditingPost(true);
    setError(null);
  };

  const cancelEditPost = () => {
    setEditingPost(false);
    setError(null);
  };

  const savePost = async () => {
    setBusy(true);
    setError(null);
    try {
      const patch: { caption: string; location: string | null; photoUri?: string } = {
        caption: editCaption.trim(),
        location: editLocation.trim() || null,
      };
      if (editPhotoUri && editPhotoUri !== entry.photoUri) patch.photoUri = editPhotoUri;
      await updateEntry(entry.id, patch);
      setEditingPost(false);
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't save — try again."));
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setEditPhotoUri(uri);
  };

  const confirmHide = () =>
    confirmAction(
      'Delete from your journal?',
      'Others at this table will still see the moment.',
      'Delete',
      async () => {
        try {
          await hideEntry(entry.id);
          goBack();
        } catch (e) {
          setError(friendlyMessage(e, "Couldn't delete — try again."));
        }
      },
    );

  const confirmLeave = () =>
    confirmAction(
      'Leave this table?',
      "You'll be removed from the moment — others won't see you tagged anymore.",
      'Leave',
      async () => {
        try {
          await leaveEntry(entry.id);
          goBack();
        } catch (e) {
          setError(friendlyMessage(e, "Couldn't leave — try again."));
        }
      },
    );

  const submitComment = async () => {
    const text = comment.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      await addAppend(entry.id, { authorId: myId, kind: 'comment', text });
      setComment('');
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't add comment — try again."));
    } finally {
      setBusy(false);
    }
  };

  const addPhotoAppend = async () => {
    const uri = await pickPhoto();
    if (!uri) return;
    setError(null);
    try {
      await addAppend(entry.id, { authorId: myId, kind: 'photo', photoUri: uri });
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't add photo — try again."));
    }
  };

  const startEditAppend = (a: EntryAppend) => {
    if (a.kind !== 'comment') return;
    setEditingAppendId(a.id);
    setEditAppendText(a.text);
  };

  const saveAppend = async () => {
    if (!editingAppendId) return;
    const text = editAppendText.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      await updateAppend(entry.id, editingAppendId, { text });
      setEditingAppendId(null);
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't save comment — try again."));
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteAppend = (appendId: string) =>
    confirmAction('Delete this?', 'This removes it for everyone at the table.', 'Delete', async () => {
      try {
        await deleteAppend(entry.id, appendId);
        if (editingAppendId === appendId) setEditingAppendId(null);
      } catch (e) {
        setError(friendlyMessage(e, "Couldn't delete — try again."));
      }
    });

  const replaceAppendPhoto = async (appendId: string) => {
    const uri = await pickPhoto();
    if (!uri) return;
    setError(null);
    try {
      await updateAppend(entry.id, appendId, { photoUri: uri });
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't update photo — try again."));
    }
  };

  return (
    <ScreenContainer keyboard edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Journal</Text>
        </Pressable>

        {entry.isMarianitoHour ? (
          <View style={styles.badgeWrap}>
            <MarianitoBadge />
          </View>
        ) : null}

        {editingPost ? (
          <>
            <Pressable onPress={changePhoto} style={styles.photoEdit}>
              <EntryPhoto uri={editPhotoUri ?? entry.photoUri} style={styles.photo} radius={theme.radius.lg} />
              <Text style={styles.photoEditHint}>Tap to change photo</Text>
            </Pressable>
            <TextField
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Add a caption…"
              multiline
              numberOfLines={3}
              containerStyle={styles.editField}
              style={styles.captionInput}
            />
            <TextField
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="Location (optional)"
              containerStyle={styles.editField}
            />
            <View style={styles.editActions}>
              <PrimaryButton title="Cancel" variant="ghost" onPress={cancelEditPost} style={styles.editBtn} />
              <PrimaryButton title="Save" onPress={savePost} loading={busy} style={styles.editBtn} />
            </View>
          </>
        ) : (
          <>
            <EntryPhoto uri={entry.photoUri} style={styles.photo} radius={theme.radius.lg} />
            {entry.caption ? <Text style={styles.caption}>{entry.caption}</Text> : null}
            <Text style={styles.meta}>
              {entryDateLabel(entry.createdAt)}
              {entry.location ? `  ·  ${entry.location}` : ''}
            </Text>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!editingPost && isParticipant ? (
          <View style={styles.postActions}>
            <Pressable onPress={startEditPost} hitSlop={6}>
              <Text style={styles.actionLink}>Edit</Text>
            </Pressable>
            <Text style={styles.actionDot}>·</Text>
            <Pressable onPress={confirmHide} hitSlop={6}>
              <Text style={styles.actionLinkDanger}>Delete</Text>
            </Pressable>
            <Text style={styles.actionDot}>·</Text>
            <Pressable onPress={confirmLeave} hitSlop={6}>
              <Text style={styles.actionLinkDanger}>Leave table</Text>
            </Pressable>
          </View>
        ) : null}

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
            {entry.appends.map((a) => {
              const mine = a.authorId === myId;
              const editing = editingAppendId === a.id;
              return (
                <View key={a.id} style={styles.append}>
                  <Avatar
                    name={peopleById.get(a.authorId)?.displayName ?? '?'}
                    uri={peopleById.get(a.authorId)?.avatarUri}
                    size={24}
                  />
                  <View style={styles.appendBody}>
                    <Text style={styles.appendAuthor}>{nameOf(a.authorId)}</Text>
                    {editing && a.kind === 'comment' ? (
                      <>
                        <TextField
                          value={editAppendText}
                          onChangeText={setEditAppendText}
                          multiline
                          containerStyle={styles.appendEditField}
                        />
                        <View style={styles.appendActions}>
                          <Pressable onPress={() => setEditingAppendId(null)} hitSlop={6}>
                            <Text style={styles.actionLink}>Cancel</Text>
                          </Pressable>
                          <Pressable onPress={saveAppend} hitSlop={6} disabled={!editAppendText.trim()}>
                            <Text style={styles.actionLink}>Save</Text>
                          </Pressable>
                        </View>
                      </>
                    ) : a.kind === 'comment' ? (
                      <Text style={styles.appendText}>{a.text}</Text>
                    ) : (
                      <EntryPhoto uri={a.photoUri} style={styles.appendPhoto} radius={theme.radius.sm} />
                    )}
                    {mine && !editing ? (
                      <View style={styles.appendActions}>
                        {a.kind === 'comment' ? (
                          <Pressable onPress={() => startEditAppend(a)} hitSlop={6}>
                            <Text style={styles.actionLink}>Edit</Text>
                          </Pressable>
                        ) : (
                          <Pressable onPress={() => replaceAppendPhoto(a.id)} hitSlop={6}>
                            <Text style={styles.actionLink}>Replace</Text>
                          </Pressable>
                        )}
                        <Pressable onPress={() => confirmDeleteAppend(a.id)} hitSlop={6}>
                          <Text style={styles.actionLinkDanger}>Delete</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
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

        {showComposer ? (
          <View style={styles.composer}>
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
            <PrimaryButton title="Add a photo" variant="ghost" onPress={addPhotoAppend} />
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
  photoEdit: { marginBottom: theme.space.md },
  photoEditHint: {
    textAlign: 'center',
    marginTop: theme.space.sm,
    fontSize: theme.type.size.sm,
    color: theme.colors.link,
  },
  caption: {
    fontSize: theme.type.size.md,
    color: theme.colors.textPrimary,
    marginTop: theme.space.lg,
    lineHeight: 22,
  },
  captionInput: { minHeight: 64, textAlignVertical: 'top' },
  meta: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.sm,
  },
  editField: { marginTop: theme.space.lg },
  editActions: { flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.lg },
  editBtn: { flex: 1 },
  error: {
    color: theme.colors.danger,
    fontSize: theme.type.size.sm,
    marginTop: theme.space.md,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.lg,
  },
  actionLink: { fontSize: theme.type.size.sm, color: theme.colors.link, fontWeight: '600' },
  actionLinkDanger: { fontSize: theme.type.size.sm, color: theme.colors.danger, fontWeight: '600' },
  actionDot: { fontSize: theme.type.size.sm, color: theme.colors.textSecondary },
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
  appendEditField: { marginTop: theme.space.sm },
  appendActions: {
    flexDirection: 'row',
    gap: theme.space.lg,
    marginTop: theme.space.sm,
  },
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
  composer: { marginTop: theme.space.xxl },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.space.lg },
  missingText: { fontSize: theme.type.size.md, color: theme.colors.textSecondary },
});
