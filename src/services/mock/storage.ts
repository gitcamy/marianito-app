import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'marianito:';

export async function load<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(PREFIX + key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function save<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(PREFIX + key);
}
