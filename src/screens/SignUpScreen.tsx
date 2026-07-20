import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/theme';
import { notify } from '@/utils/confirm';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** 01 — Sign Up (A1). Mock auth: any valid-shaped email + password works. */
export function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs at least 6 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signUp(email, password); // root layout redirects to profile setup
    } finally {
      setBusy(false);
    }
  };

  const comingSoon = () =>
    notify('Coming soon', 'Apple and Google sign-in arrive with the Supabase backend.');

  return (
    <ScreenContainer keyboard>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.title}>Marianito</Text>
          <Text style={styles.tagline}>Es la hora de tomar algo</Text>
        </View>

        <TextField
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          containerStyle={styles.field}
        />
        <TextField
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          containerStyle={styles.field}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton title="Create account" onPress={submit} loading={busy} style={styles.cta} />

        <View style={styles.divider} />
        <Text style={styles.or}>or continue with</Text>
        <PrimaryButton title="Apple · Google" variant="soft" onPress={comingSoon} />

        <Text style={styles.footer}>
          Already have an account? <Text style={styles.link} onPress={submit}>Log in</Text>
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: theme.space.xl, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: theme.space.xxl },
  logoRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.cardTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.lg,
  },
  logoDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.accent,
  },
  title: {
    fontSize: theme.type.size.xl,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
  },
  tagline: {
    marginTop: theme.space.sm,
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginTop: theme.space.xl,
  },
  field: { marginBottom: theme.space.lg },
  error: { color: theme.colors.danger, fontSize: theme.type.size.sm, marginBottom: theme.space.md },
  cta: { marginTop: theme.space.sm },
  or: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.type.size.sm,
    marginVertical: theme.space.lg,
  },
  footer: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.type.size.sm,
    marginTop: theme.space.xl,
  },
  link: { color: theme.colors.link, fontWeight: '600' },
});
