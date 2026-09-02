import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorrowerSummary } from '@/lib/api';

export function BorrowerCard({
  borrower,
  onPress,
}: {
  borrower: BorrowerSummary;
  onPress?: () => void;
}) {
  const isDue = borrower.outstandingPrincipal > 0;
  const status = isDue ? 'Active' : 'Inactive';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.statusRail, isDue ? styles.dueRail : styles.paidRail]} />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{borrower.name.slice(0, 1).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {borrower.name}
        </Text>
        <Text style={styles.village} numberOfLines={1}>
          {borrower.village}
        </Text>
      </View>

      <View style={[styles.statusPill, isDue ? styles.statusDue : styles.statusPaid]}>
        <Text style={[styles.statusText, isDue ? styles.statusDueText : styles.statusPaidText]}>
          {status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1EAE5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#08203A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pressed: {
    opacity: 0.82,
  },
  statusRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  dueRail: {
    backgroundColor: '#FFB84D',
  },
  paidRail: {
    backgroundColor: '#78EC34',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8E5',
  },
  avatarText: {
    color: '#0C2A22',
    fontSize: 18,
    fontWeight: '900',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#111C22',
    fontSize: 17,
    fontWeight: '900',
  },
  village: {
    color: '#66706A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  statusPill: {
    minHeight: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  statusDue: {
    backgroundColor: '#FFF1D8',
  },
  statusPaid: {
    backgroundColor: '#E6F8DD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusDueText: {
    color: '#A86405',
  },
  statusPaidText: {
    color: '#168B52',
  },
});
