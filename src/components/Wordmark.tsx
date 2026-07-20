import { StyleSheet, Text } from 'react-native';
import { theme } from '@/theme';

export function Wordmark({ size = 28 }: { size?: number }) {
  return <Text style={[styles.mark, { fontSize: size }]}>marianito</Text>;
}

const styles = StyleSheet.create({
  mark: {
    fontFamily: theme.type.display,
    color: theme.colors.ink,
    letterSpacing: 0.5,
  },
});
