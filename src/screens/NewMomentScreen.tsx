import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useEntryStore } from '@/stores/useEntryStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTableStore } from '@/stores/useTableStore';
import { theme } from '@/theme';
import { friendlyMessage } from '@/utils/errors';
import { pickPhoto } from '@/utils/pickPhoto';
import { useSafeBack } from '@/hooks/useSafeBack';

/** 06 — Photo + Caption (C1, C5): one photo required, caption optional, location never blocks. */
export function NewMomentScreen() {
  const router = useRouter();
  const draft = useTableStore((s) => s.draft);
  const resetDraft = useTableStore((s) => s.reset);
  const createEntry = useEntryStore((s) => s.create);
  const setHomeView = useHomeStore((s) => s.setView);
  const locationConsent = useSettingsStore((s) => s.settings.locationConsent);

  // No draft (refresh/deep link) → back to the start of the flow.
  // postedRef stops this firing when the draft is cleared by a successful post.
  const postedRef = useRef(false);
  useEffect(() => {
    if (!draft && !postedRef.current) router.replace('/table/who');
  }, [draft, router]);

  const goBack = useSafeBack('/table/who');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  };

  const post = async () => {
    if (!photoUri || !draft) return;
    setError(null);
    setBusy(true);
    try {
      const entry = await createEntry({
        photoUri,
        caption: caption.trim(),
        location: location.trim() || null,
        participantIds: draft.participantIds,
        startedAt: draft.openedAt,
      });
      postedRef.current = true;
      resetDraft();
      setHomeView('journal'); // land back on the journal (D1)
      // Pop the whole table modal stack back to home, THEN push the entry —
      // leaves history as [home → entry] so back returns to the journal.
      router.dismissTo('/');
      router.push({ pathname: '/entry/[id]', params: { id: entry.id } });
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't post your moment — please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer keyboard edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={8}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>New moment</Text>
          <View style={styles.back} />
        </View>

        <Pressable onPress={choosePhoto} style={styles.photoArea}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <>
              <View style={styles.photoIcon}>
                <Text style={styles.photoIconPlus}>+</Text>
              </View>
              <Text style={styles.photoHint}>Tap to add a photo</Text>
            </>
          )}
        </Pressable>

        <TextField
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption…"
          multiline
          numberOfLines={3}
          containerStyle={styles.caption}
          style={styles.captionInput}
        />

        {locationConsent ? (
          showLocation ? (
            <TextField
              value={location}
              onChangeText={setLocation}
              placeholder="Where are you?"
              containerStyle={styles.locationField}
            />
          ) : (
            <Pressable onPress={() => setShowLocation(true)} style={styles.locationRow}>
              <Text style={styles.locationLabel}>📍 Add location (optional)</Text>
            </Pressable>
          )
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title="Post moment"
          onPress={post}
          disabled={!photoUri}
          loading={busy}
          style={styles.cta}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: theme.space.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space.xl,
  },
  back: { fontSize: theme.type.size.md, color: theme.colors.link, minWidth: 52 },
  title: {
    fontSize: theme.type.size.lg,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
  },
  photoArea: {
    height: 220,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2DECF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.md,
  },
  photoIconPlus: { fontSize: 26, color: theme.colors.textSecondary },
  photoHint: { fontSize: theme.type.size.sm, color: theme.colors.textSecondary },
  caption: { marginTop: theme.space.xl },
  captionInput: { minHeight: 64, textAlignVertical: 'top' },
  locationRow: {
    marginTop: theme.space.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    height: 44,
    justifyContent: 'center',
  },
  locationLabel: { fontSize: theme.type.size.sm, color: theme.colors.textSecondary },
  locationField: { marginTop: theme.space.lg },
  error: {
    color: theme.colors.danger,
    fontSize: theme.type.size.sm,
    marginTop: theme.space.lg,
    textAlign: 'center',
  },
  cta: { marginTop: theme.space.xxl },
});
