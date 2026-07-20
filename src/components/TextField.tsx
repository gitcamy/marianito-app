import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  prefix?: string; // e.g. "@" for username
  containerStyle?: ViewStyle;
}

export function TextField({ label, prefix, containerStyle, style, ...rest }: Props) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.field}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.space.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    minHeight: 46,
  },
  prefix: {
    fontSize: theme.type.size.md,
    color: theme.colors.textSecondary,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: theme.type.size.md,
    color: theme.colors.textPrimary,
    paddingVertical: theme.space.md,
  },
});
