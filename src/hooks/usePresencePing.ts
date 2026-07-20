import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { friends } from '@/services';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

const MIN_PING_INTERVAL_MS = 2 * 60 * 1000; // don't hammer GPS or the backend

/**
 * Foreground-only presence: while signed in AND both privacy toggles are on,
 * ping the user's location on app open/foreground so friends can see them as
 * nearby. No background tracking. Failures (permission denied, no GPS) are
 * silent — nearby simply won't light up.
 */
export function usePresencePing() {
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  const discoverable = useSettingsStore((s) => s.settings.discoverablePresence);
  const locationConsent = useSettingsStore((s) => s.settings.locationConsent);
  const lastPingAt = useRef(0);

  const enabled = signedIn && discoverable && locationConsent;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const ping = async () => {
      if (Date.now() - lastPingAt.current < MIN_PING_INTERVAL_MS) return;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        await friends.updatePresence(pos.coords.latitude, pos.coords.longitude);
        lastPingAt.current = Date.now();
      } catch {
        // Silent: presence is best-effort.
      }
    };

    ping();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') ping();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled]);
}
