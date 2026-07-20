import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/theme';
import { friendlyMessage } from '@/utils/errors';
import { pickPhoto } from '@/utils/pickPhoto';

/** 02 — Set Up Profile (A3): display name, @username, photo. */
export function ProfileSetupScreen() {
  const completeProfile = useAuthStore((s) => s.completeProfile);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choosePhoto = async () => {
    const uri = await pickPhoto({ allowsEditing: true, aspect: [1, 1] });
    if (uri) setAvatarUri(uri);
  };

  const submit = async () => {
    const name = displayName.trim();
    const handle = username.trim().toLowerCase().replace(/^@/, '');
    if (!name) return setError('Add a display name.');
    if (!/^[a-z0-9_]{2,20}$/.test(handle)) {
      return setError('Username: 2–20 letters, numbers or underscores.');
    }
    setError(null);
    setBusy(true);
    try {
      await completeProfile({ displayName: name, username: handle, avatarUri });
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't save your profile — try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer keyboard>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>So friends recognise you</Text>

        <Pressable onPress={choosePhoto} style={styles.photoCircle}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoLabel}>+ Photo</Text>
          )}
        </Pressable>

        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Marianito Txiki"
          containerStyle={styles.field}
        />
        <TextField
          label="Username"
          prefix="@"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="marianito"
          containerStyle={styles.field}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Continue" onPress={submit} loading={busy} style={styles.cta} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: theme.space.xl, justifyContent: 'center' },
  title: {
    fontSize: theme.type.size.xl,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.space.sm,
    marginBottom: theme.space.xl,
  },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.xxl,
    overflow: 'hidden',
  },
  photo: { width: 96, height: 96 },
  photoLabel: { color: theme.colors.textSecondary, fontSize: theme.type.size.sm },
  field: { marginBottom: theme.space.lg },
  error: { color: theme.colors.danger, fontSize: theme.type.size.sm, marginBottom: theme.space.md },
  cta: { marginTop: theme.space.xl },
});
