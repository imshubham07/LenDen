import { Pressable, StyleSheet, Text, View } from 'react-native';

import { User } from '@/lib/api';

type ProfileSheetProps = {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
};

export function ProfileSheet({ user, onClose, onLogout }: ProfileSheetProps) {
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1).toUpperCase() ?? 'A'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name ?? 'User'}</Text>
            <Text style={styles.mobile}>{user?.mobile ?? 'LenDen account'}</Text>
          </View>
        </View>

        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    zIndex: 20,
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DCE5DF',
    marginBottom: 22,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF8E5',
  },
  avatarText: {
    color: '#0C2A22',
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: '#111C22',
    fontSize: 20,
    fontWeight: '900',
  },
  mobile: {
    color: '#66706A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061B35',
    marginTop: 24,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
