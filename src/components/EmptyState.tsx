import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  title: string;
  message: string;
  ctaTitle?: string;
  onCta?: () => void;
}

export function EmptyState({ title, message, ctaTitle, onCta }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.tile}>
        <View style={styles.tileInner} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {ctaTitle && onCta ? (
        <PrimaryButton title={ctaTitle} onPress={onCta} style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.space.xxl },
  tile: {
    width: 110,
    height: 110,
    borderRadius: theme.radius.lg,
    backgroundColor: '#E2DECF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.xl,
  },
  tileInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.maroon,
    opacity: 0.5,
  },
  title: {
    fontSize: theme.type.size.lg,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
    marginBottom: theme.space.sm,
  },
  message: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.space.xl,
  },
  cta: { alignSelf: 'stretch', marginHorizontal: theme.space.xl },
});
