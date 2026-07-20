import { Fraunces_400Regular, Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { theme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_400Regular, Fraunces_600SemiBold });
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);
  const refreshSettings = useSettingsStore((s) => s.refresh);

  useEffect(() => {
    restore(); // A2/A4: session persists across launches
    refreshSettings();
  }, [restore, refreshSettings]);

  useEffect(() => {
    if (fontsLoaded && status !== 'loading') SplashScreen.hideAsync();
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === 'loading') return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)/sign-up" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'needsProfile'}>
          <Stack.Screen name="(auth)/profile-setup" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="table" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
