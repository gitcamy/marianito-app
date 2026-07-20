import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SettingLinkRow, SettingToggleRow } from '@/components/SettingRow';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { theme } from '@/theme';
import { confirmAction } from '@/utils/confirm';

/** 09 — Settings & Privacy (G1–G4). */
export function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const signOut = useAuthStore((s) => s.signOut);

  const confirmSignOut = () =>
    confirmAction('Sign out', 'You can sign back in any time.', 'Sign out', () => signOut());

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>

        <SettingToggleRow
          label="Discoverable presence"
          value={settings.discoverablePresence}
          onValueChange={(v) => update({ discoverablePresence: v })}
        />
        <SettingToggleRow
          label="Location consent"
          value={settings.locationConsent}
          onValueChange={(v) => update({ locationConsent: v })}
        />
        <SettingToggleRow
          label="Notifications"
          value={settings.notificationsEnabled}
          onValueChange={(v) => update({ notificationsEnabled: v })}
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
    marginBottom: theme.space.xl,
  },
  sectionLabel: {
    fontSize: theme.type.size.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: theme.space.xxl,
    marginBottom: theme.space.sm,
  },
  footer: { flex: 1, justifyContent: 'flex-end', marginTop: theme.space.xxl },
});
