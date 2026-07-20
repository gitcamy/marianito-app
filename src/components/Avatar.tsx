import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

const PALETTE = [theme.colors.olive, theme.colors.maroon, '#8A7B4F', '#3E5C76', '#7A4E2D'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

function colorFor(seedText: string): string {
  let h = 0;
  for (const c of seedText) h = (h * 31 + c.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
  /** Small olive-green presence dot (nearby). */
  showNearbyDot?: boolean;
}

export function Avatar({ name, uri, size = 36, showNearbyDot }: Props) {
  const r = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: r }} />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: r, backgroundColor: colorFor(name) },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name || '?')}</Text>
        </View>
      )}
      {showNearbyDot ? (
        <View style={[styles.dot, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: theme.colors.cream, fontWeight: '600' },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    backgroundColor: '#5F7A2E',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
