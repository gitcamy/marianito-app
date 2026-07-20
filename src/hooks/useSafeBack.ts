import { useRouter } from 'expo-router';

/**
 * Back that never dead-ends: pops history when there is any, otherwise
 * replaces with the given fallback route (covers refreshes and deep links,
 * where the screen is the first thing in the navigator).
 */
export function useSafeBack(fallback: string = '/') {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else router.replace(fallback as any);
  };
}
