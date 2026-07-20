import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useFriendStore } from '@/stores/useFriendStore';
import { theme } from '@/theme';

/** H2 — Report a problem (stored locally by the mock service this iteration). */
export function ReportScreen() {
  const router = useRouter();
  const report = useFriendStore((s) => s.report);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await report(null, reason.trim());
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer keyboard edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Report a problem</Text>

        {sent ? (
          <View style={styles.done}>
            <Text style={styles.doneTitle}>Thank you</Text>
            <Text style={styles.doneText}>
              Your report has been received. We take safety at the table seriously.
            </Text>
            <PrimaryButton title="Done" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <Text style={styles.hint}>
              Tell us what happened — a person, a moment, or something not working.
            </Text>
            <TextField
              value={reason}
              onChangeText={setReason}
              placeholder="Describe the problem…"
              multiline
              numberOfLines={5}
              style={styles.input}
              containerStyle={styles.field}
            />
            <PrimaryButton
              title="Send report"
              onPress={submit}
              disabled={!reason.trim()}
              loading={busy}
            />
          </>
        )}
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
    marginBottom: theme.space.md,
  },
  hint: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.space.xl,
  },
  input: { minHeight: 120, textAlignVertical: 'top' },
  field: { marginBottom: theme.space.xl },
  done: { alignItems: 'stretch', gap: theme.space.lg, marginTop: theme.space.xxl },
  doneTitle: {
    fontSize: theme.type.size.lg,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  doneText: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
