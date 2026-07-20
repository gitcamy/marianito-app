import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'soft' | 'ghost';
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, disabled, loading, variant = 'primary', style }: Props) {
  const isPrimary = variant === 'primary';
  const isSoft = variant === 'soft';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isSoft && styles.soft,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.ctaText : theme.colors.accent} />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            isSoft && styles.labelSoft,
            (variant === 'secondary' || variant === 'ghost') && styles.labelSecondary,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
  },
  primary: { backgroundColor: theme.colors.cta },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  soft: { backgroundColor: theme.colors.surface },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  label: { fontSize: theme.type.size.md, fontWeight: '600' },
  labelPrimary: { color: theme.colors.ctaText },
  labelSoft: { color: theme.colors.textPrimary },
  labelSecondary: { color: theme.colors.accent },
});
