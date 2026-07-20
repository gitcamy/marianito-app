import { Image, ImageStyle } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '@/theme';

/** Seed entries use `seed:<tone>` URIs so the demo works fully offline. */
const SEED_TONES: Record<string, { bg: string; fg: string }> = {
  'seed:olive': { bg: '#5C6532', fg: '#E4E9B2' },
  'seed:maroon': { bg: '#6B0F1A', fg: '#EDD7C2' },
  'seed:paleGreen': { bg: '#D9DFA5', fg: '#4A5320' },
};

interface Props {
  uri: string;
  style?: ViewStyle;
  radius?: number;
}

export function EntryPhoto({ uri, style, radius = theme.radius.md }: Props) {
  const [failed, setFailed] = useState(false);
  // Unloadable photos (e.g. expired blob: URLs from old entries) fall back to a placeholder tile.
  const tone = SEED_TONES[uri] ?? (failed ? SEED_TONES['seed:olive'] : undefined);
  if (tone) {
    // Tile-flower motif placeholder in brand tones.
    return (
      <View style={[styles.seed, { backgroundColor: tone.bg, borderRadius: radius }, style]}>
        <View style={styles.petals}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.petal,
                { backgroundColor: tone.fg, transform: [{ rotate: `${i * 45}deg` }] },
              ]}
            />
          ))}
          <View style={[styles.center, { backgroundColor: tone.bg, borderColor: tone.fg }]} />
        </View>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[{ borderRadius: radius }, styles.img, style as ImageStyle]}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  img: { width: '100%' },
  seed: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  petals: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  petal: {
    position: 'absolute',
    width: 56,
    height: 20,
    borderRadius: 10,
    opacity: 0.85,
  },
  center: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
});
