import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { supabase } from './client';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i + 3 < clean.length || (i < clean.length && p < len); i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((B64.indexOf(clean[i + 2]) & 63) << 6) |
      (B64.indexOf(clean[i + 3]) & 63);
    if (p < len) bytes[p++] = (n >> 16) & 255;
    if (p < len && clean[i + 2] !== undefined) bytes[p++] = (n >> 8) & 255;
    if (p < len && clean[i + 3] !== undefined) bytes[p++] = n & 255;
  }
  return bytes;
}

/**
 * Upload a local photo (file:// on native, data:/blob: on web) to the public
 * `photos` bucket under the user's folder. Returns the public URL.
 */
export async function uploadPhoto(localUri: string, userId: string): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  let body: Blob | ArrayBuffer;
  let contentType = 'image/jpeg';

  if (Platform.OS === 'web') {
    const res = await fetch(localUri); // fetch handles data: and blob: URIs on web
    body = await res.blob();
    contentType = (body as Blob).type || contentType;
  } else if (localUri.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.*)$/.exec(localUri);
    if (!match) throw new Error('Unsupported photo format');
    contentType = match[1];
    body = base64ToBytes(match[2]).buffer as ArrayBuffer;
  } else {
    const b64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = base64ToBytes(b64).buffer as ArrayBuffer;
  }

  const { error } = await supabase.storage.from('photos').upload(path, body, { contentType });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
