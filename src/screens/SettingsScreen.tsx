import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SettingLinkRow, SettingToggleRow } from '@/components/SettingRow';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Settings } from '@/types/models';
import { theme } from '@/theme';
import { confirmAction } from '@/utils/confirm';
import { friendlyMessage } from '@/utils/errors';
import { pickPhoto } from '@/utils/pickPhoto';
import { useSafeBack } from '@/hooks/useSafeBack';

/** 09 — Settings & Privacy (G1–G4). */
export function SettingsScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/');
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const refresh = useSettingsStore((s) => s.refresh);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUri ?? null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Keep form in sync if the session user changes (e.g. after restore).
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setUsername(user.username);
    setAvatarUri(user.avatarUri);
  }, [user]);

  const profileDirty =
    !!user &&
    (displayName.trim() !== user.displayName ||
      username.trim().toLowerCase().replace(/^@/, '') !== user.username ||
      avatarUri !== user.avatarUri);

  // A failed save must be visible AND the switch must snap back to the truth.
  const change = async (patch: Partial<Settings>) => {
    setError(null);
    try {
      await update(patch);
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't save that setting — try again."));
      refresh();
    }
  };

  const choosePhoto = async () => {
    const uri = await pickPhoto({ allowsEditing: true, aspect: [1, 1] });
    if (uri) {
      setAvatarUri(uri);
      setError(null);
    }
  };

  const saveProfile = async () => {
    const name = displayName.trim();
    const handle = username.trim().toLowerCase().replace(/^@/, '');
    if (!name) return setError('Add a display name.');
    if (!/^[a-z0-9_]{2,20}$/.test(handle)) {
      return setError('Username: 2–20 letters, numbers or underscores.');
    }
    setError(null);
    setSavingProfile(true);
    try {
      await updateProfile({ displayName: name, username: handle, avatarUri });
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't save your profile — try again."));
    } finally {
      setSavingProfile(false);
    }
  };

  const confirmSignOut = () =>
    confirmAction('Sign out', 'You can sign back in any time.', 'Sign out', () => signOut());

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>ACCOUNT</Text>
        <View style={styles.accountCard}>
          <Pressable onPress={choosePhoto} style={styles.photoWrap} accessibilityLabel="Change photo">
            <Avatar name={displayName || user?.email || '?'} uri={avatarUri} size={72} />
            <Text style={styles.photoHint}>Change photo</Text>
          </Pressable>

          {user?.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}

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

          {profileDirty ? (
            <PrimaryButton
              title="Save profile"
              onPress={saveProfile}
              loading={savingProfile}
              style={styles.saveBtn}
            />
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <SettingToggleRow
          label="Discoverable to everyone"
          value={settings.discoverableToAll}
          onValueChange={(v) => change({ discoverableToAll: v })}
        />
        <SettingToggleRow
          label="Discoverable presence"
          value={settings.discoverablePresence}
          onValueChange={(v) => change({ discoverablePresence: v })}
        />
        <SettingToggleRow
          label="Location consent"
          value={settings.locationConsent}
          onValueChange={(v) => change({ locationConsent: v })}
        />
        <SettingToggleRow
          label="Notifications"
          value={settings.notificationsEnabled}
          onValueChange={(v) => change({ notificationsEnabled: v })}
        />

        <Text style={styles.sectionLabel}>SAFETY</Text>
        <SettingLinkRow label="Blocked accounts" onPress={() => router.push('/settings/blocked')} />
        <SettingLinkRow label="Report a problem" onPress={() => router.push('/settings/report')} />

        <View style={styles.footer}>
          <PrimaryButton title="Sign out" variant="secondary" onPress={confirmSignOut} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: theme.space.xl },
  back: { fontSize: theme.type.size.md, color: theme.colors.link, marginBottom: theme.space.lg },
  title: {
    fontSize: theme.type.size.xl,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
    marginBottom: theme.space.lg,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.type.size.sm,
    marginBottom: theme.space.lg,
  },
  sectionLabel: {
    fontSize: theme.type.size.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: theme.space.xxl,
    marginBottom: theme.space.sm,
  },
  sectionLabelFirst: { marginTop: theme.space.md },
  accountCard: {
    marginTop: theme.space.xs,
  },
  photoWrap: {
    alignItems: 'center',
    marginBottom: theme.space.lg,
  },
  photoHint: {
    marginTop: theme.space.sm,
    fontSize: theme.type.size.sm,
    color: theme.colors.link,
  },
  email: {
    textAlign: 'center',
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.space.lg,
  },
  field: { marginBottom: theme.space.lg },
  saveBtn: { marginTop: theme.space.sm },
  footer: { flex: 1, justifyContent: 'flex-end', marginTop: theme.space.xxl },
});
