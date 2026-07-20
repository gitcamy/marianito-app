import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { BottomBar } from '@/components/BottomBar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { JournalView } from '@/screens/JournalView';
import { useAuthStore } from '@/stores/useAuthStore';
import { useFriendStore } from '@/stores/useFriendStore';
import { useHomeStore } from '@/stores/useHomeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTableStore } from '@/stores/useTableStore';
import { theme } from '@/theme';

/** 03/04/08 — Home: "Set the Table" action view + Journal view behind a toggle (F1). */
export function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const view = useHomeStore((s) => s.view);
  const setView = useHomeStore((s) => s.setView);
  const friends = useFriendStore((s) => s.friends);
  const refreshFriends = useFriendStore((s) => s.refresh);
  const discoverable = useSettingsStore((s) => s.settings.discoverablePresence);
  const openTable = useTableStore((s) => s.open);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  useFocusEffect(
    useCallback(() => {
      refreshFriends();
    }, [refreshFriends]),
  );

  const startTable = (openedAtOverride?: string) => {
    openTable(openedAtOverride);
    router.push('/table/who');
  };

  // __DEV__ helper: long-press the wordmark to open a table at 13:30 (E2 demo).
  const devMarianitoTable = __DEV__
    ? () => {
        const d = new Date();
        d.setHours(13, 30, 0, 0);
        startTable(d.toISOString());
      }
    : undefined;

  const nearby = discoverable ? friends.filter((f) => f.isNearby) : [];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onLongPress={devMarianitoTable}>
          <Text style={styles.headerTitle}>{view === 'table' ? 'Set the Table' : 'Journal'}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Avatar name={user?.displayName ?? '?'} uri={user?.avatarUri} size={32} />
        </Pressable>
      </View>

      <View style={styles.toggleWrap}>
        <SegmentedToggle
          options={[
            { value: 'table', label: 'Table' },
            { value: 'journal', label: 'Journal' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {view === 'table' ? (
        <ScrollView contentContainerStyle={styles.tableScroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Who's at the table?</Text>
            <Text style={styles.cardSubtitle}>Start today's moment</Text>
            <Pressable onPress={() => startTable()} style={styles.openBtn}>
              <Text style={styles.openBtnLabel}>+ Open a table</Text>
            </Pressable>
          </View>

          {nearby.length > 0 ? (
            <View style={styles.nearbySection}>
              <Text style={styles.sectionLabel}>Nearby right now</Text>
              <View style={styles.nearbyRow}>
                {nearby.map((f) => (
                  <View key={f.id} style={styles.nearbyPerson}>
                    <Avatar name={f.displayName} uri={f.avatarUri} showNearbyDot />
                    <Text style={styles.nearbyName} numberOfLines={1}>
                      {f.displayName.split(' ')[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <JournalView onSetTable={() => setView('table')} />
      )}

      <BottomBar
        active={view}
        onTable={() => setView('table')}
        onJournal={() => setView('journal')}
        onSettings={() => router.push('/settings')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
  },
  headerTitle: {
    fontSize: theme.type.size.xl,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
  },
  toggleWrap: { paddingHorizontal: theme.space.xl, marginTop: theme.space.lg },
  tableScroll: { padding: theme.space.xl },
  card: {
    backgroundColor: theme.colors.cardTint,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    paddingVertical: theme.space.xxl,
    paddingHorizontal: theme.space.xl,
  },
  cardTitle: {
    fontSize: theme.type.size.lg,
    fontFamily: theme.type.display,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xs,
    marginBottom: theme.space.xl,
  },
  openBtn: {
    backgroundColor: theme.colors.cta,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.xl,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtnLabel: { color: theme.colors.ctaText, fontSize: theme.type.size.md, fontWeight: '600' },
  nearbySection: { marginTop: theme.space.xxl },
  sectionLabel: {
    fontSize: theme.type.size.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.space.md,
  },
  nearbyRow: { flexDirection: 'row', gap: theme.space.lg },
  nearbyPerson: { alignItems: 'center', width: 56 },
  nearbyName: {
    fontSize: theme.type.size.xs,
    color: theme.colors.textPrimary,
    marginTop: theme.space.xs,
  },
});
