import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuthStore } from '@/stores/useAuthStore';
import { theme } from '@/theme';
import { notify } from '@/utils/confirm';
import { friendlyMessage } from '@/utils/errors';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/** 01 — Sign in / sign up (A1): magic-link email code, one flow for both. */
export function SignUpScreen() {
  const requestCode = useAuthStore((s) => s.requestCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);

  const [phase, setPhase] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async (isResend = false) => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await requestCode(email);
      setPhase('code');
      setCode('');
      if (isResend) setInfo('New code sent — check your email.');
    } catch (e) {
      setError(friendlyMessage(e, "Couldn't send the code — try again in a moment."));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (code.trim().length < 4) {
      setError('Enter the code from your email.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await verifyCode(email, code); // root layout redirects on success
    } catch (e) {
      setError(friendlyMessage(e, "That code didn't work — try again or resend."));
    } finally {
      setBusy(false);
    }
  };

  const comingSoon = () =>
    notify('Coming soon', 'Apple and Google sign-in are on the way.');

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

        {phase === 'email' ? (
          <>
            <TextField
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Email"
              containerStyle={styles.field}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton title="Send me a code" onPress={() => sendCode()} loading={busy} style={styles.cta} />
            <Text style={styles.hint}>
              New or returning — we email you a one-time code. No password.
            </Text>

            <View style={styles.divider} />
            <Text style={styles.or}>or continue with</Text>
            <PrimaryButton title="Apple · Google" variant="soft" onPress={comingSoon} />
          </>
        ) : (
          <>
            <Text style={styles.codeIntro}>
              We sent a code to{'\n'}
              <Text style={styles.codeEmail}>{email.trim()}</Text>
            </Text>
            <TextField
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              placeholder="Code from your email"
              containerStyle={styles.field}
              style={styles.codeInput}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <PrimaryButton title="Sign in" onPress={submitCode} loading={busy} style={styles.cta} />
            <Pressable onPress={() => sendCode(true)} disabled={busy}>
              <Text style={styles.link}>Resend code</Text>
            </Pressable>
            <Pressable
              onPress={() => { setPhase('email'); setError(null); setInfo(null); }}
              disabled={busy}
            >
              <Text style={styles.link}>Use a different email</Text>
            </Pressable>
          </>
        )}
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
  field: { marginBottom: theme.space.lg },
  error: { color: theme.colors.danger, fontSize: theme.type.size.sm, marginBottom: theme.space.md },
  info: { color: theme.colors.olive, fontSize: theme.type.size.sm, marginBottom: theme.space.md, textAlign: 'center' },
  cta: { marginTop: theme.space.sm },
  hint: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.type.size.xs,
    marginTop: theme.space.md,
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginTop: theme.space.xl,
  },
  or: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.type.size.sm,
    marginVertical: theme.space.lg,
  },
  codeIntro: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.type.size.sm,
    lineHeight: 21,
    marginBottom: theme.space.xl,
  },
  codeEmail: { color: theme.colors.textPrimary, fontWeight: '600' },
  codeInput: { textAlign: 'center', fontSize: theme.type.size.lg, letterSpacing: 4 },
  link: {
    textAlign: 'center',
    color: theme.colors.link,
    fontSize: theme.type.size.sm,
    fontWeight: '600',
    marginTop: theme.space.xl,
  },
});
