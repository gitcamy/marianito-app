import { StyleSheet, View } from 'react-native';
import { Avatar } from './Avatar';

interface Person {
  id: string;
  displayName: string;
  avatarUri?: string | null;
}

export function AvatarRow({ people, size = 28 }: { people: Person[]; size?: number }) {
  return (
    <View style={styles.row}>
      {people.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.25 }}>
          <Avatar name={p.displayName} uri={p.avatarUri} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
