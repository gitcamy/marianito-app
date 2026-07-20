import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  /** Wrap content in KeyboardAvoidingView (screens with inputs). */
  keyboard?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({ children, style, keyboard, edges = ['top', 'left', 'right'] }: Props) {
  const inner = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
});
