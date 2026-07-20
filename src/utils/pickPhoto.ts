import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Pick a photo and return a URI that survives app restarts.
 *
 * - Web: the picker hands back a `blob:` URL that dies on reload — return a
 *   base64 `data:` URI instead so entries persist in storage.
 * - Native: the picker returns a file in a temp cache the OS may purge — copy
 *   it into the app's document directory and return that path.
 */
export async function pickPhoto(
  options?: Pick<ImagePicker.ImagePickerOptions, 'allowsEditing' | 'aspect'>,
): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: Platform.OS === 'web' ? 0.5 : 0.7,
    base64: Platform.OS === 'web',
    ...options,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  if (Platform.OS === 'web') {
    if (asset.base64) return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    return asset.uri;
  }

  try {
    const dir = `${FileSystem.documentDirectory}photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const dest = `${dir}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    return dest;
  } catch {
    return asset.uri; // still works for the current session
  }
}
