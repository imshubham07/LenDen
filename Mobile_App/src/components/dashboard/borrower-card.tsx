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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shadowCard, pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarShadow, isDue ? styles.activeAvatarShadow : styles.inactiveAvatarShadow]} />
              <View style={[styles.avatar, isDue ? styles.activeAvatar : styles.inactiveAvatar]}>
                <Text style={[styles.avatarText, isDue ? styles.activeAvatarText : styles.inactiveAvatarText]}>
                  {borrower.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {borrower.name}
              </Text>
              <Text style={styles.village} numberOfLines={1}>
                {borrower.village}
              </Text>
            </View>
          </View>

          <View style={[styles.statusPill, isDue ? styles.statusDue : styles.statusPaid]}>
            <View style={[styles.statusDot, isDue ? styles.statusDueDot : styles.statusPaidDot]} />
            <Text style={[styles.statusText, isDue ? styles.statusDueText : styles.statusPaidText]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowCard: {
    minHeight: 132,
    borderRadius: 12,
    backgroundColor: '#DCE8E1',
    shadowColor: '#061B35',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
    marginVertical: 4,
  },
  card: {
    flex: 1,
    minHeight: 132,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B9CAC1',
    backgroundColor: '#EEF5F0',
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.82,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatarWrap: {
    width: 66,
    height: 66,
  },
  avatarShadow: {
    position: 'absolute',
    left: 6,
    top: 9,
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  activeAvatarShadow: {
    backgroundColor: '#061B35',
  },
  inactiveAvatarShadow: {
    backgroundColor: '#A6A6A6',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAvatar: {
    backgroundColor: '#CDE8DF',
  },
  inactiveAvatar: {
    backgroundColor: '#D1DAD5',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
  },
  activeAvatarText: {
    color: '#071D36',
  },
  inactiveAvatarText: {
    color: '#777777',
  },
  name: {
    color: '#061B35',
    fontSize: 22,
    fontWeight: '800',
  },
  village: {
    color: '#40534D',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 5,
  },
  statusPill: {
    minHeight: 34,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    gap: 8,
    borderWidth: 1,
  },
  statusDue: {
    backgroundColor: '#D1EAD8',
    borderColor: '#B7DCC1',
  },
  statusPaid: {
    backgroundColor: '#D8E0DB',
    borderColor: '#C6D1CB',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDueDot: {
    backgroundColor: '#35D35C',
  },
  statusPaidDot: {
    backgroundColor: '#9B9B9B',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusDueText: {
    color: '#26733F',
  },
  statusPaidText: {
    color: '#555555',
  },
});
