import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { EntryPhoto } from '@/components/EntryPhoto';
import { MonthChips } from '@/components/MonthChips';
import { useEntryStore } from '@/stores/useEntryStore';
import { theme } from '@/theme';
import { monthKeyOf, monthKeys } from '@/utils/dates';

/** 04/08 — Journal face of home: empty state (F2/D2) or month-filtered grid (D3–D5). */
export function JournalView({ onSetTable }: { onSetTable: () => void }) {
  const router = useRouter();
  const entries = useEntryStore((s) => s.entries);
  const loaded = useEntryStore((s) => s.loaded);
  const refresh = useEntryStore((s) => s.refresh);
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const months = useMemo(() => monthKeys(entries.map((e) => e.createdAt)), [entries]);

  // Wireframe 08: the most recent month chip starts active.
  useEffect(() => {
    if (month === null && months.length > 0) setMonth(months[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.length]);
  const filtered = useMemo(
    () => (month ? entries.filter((e) => monthKeyOf(e.createdAt) === month) : entries),
    [entries, month],
  );

  if (!loaded) return <View style={styles.flex} />;

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No moments yet"
        message={'Set your first table to start\nyour shared journal.'}
        ctaTitle="Set the table"
        onCta={onSetTable}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.chips}>
        <MonthChips months={months} value={month} onChange={setMonth} />
      </View>
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(e) => e.id}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/entry/[id]', params: { id: item.id } })}
            style={styles.tile}
          >
            <EntryPhoto uri={item.photoUri} style={styles.tilePhoto} />
            {item.isMarianitoHour ? <View style={styles.mhDot} /> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { paddingLeft: theme.space.xl, marginTop: theme.space.lg },
  grid: { padding: theme.space.xl, paddingTop: theme.space.lg },
  gridRow: { gap: theme.space.md },
  tile: {
    flex: 1,
    // odd last row: don't stretch past half the row
    maxWidth: '48.5%',
    aspectRatio: 1,
    marginBottom: theme.space.md,
  },
  tilePhoto: { width: '100%', height: '100%' },
  mhDot: {
    position: 'absolute',
    top: theme.space.sm,
    right: theme.space.sm,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
});
