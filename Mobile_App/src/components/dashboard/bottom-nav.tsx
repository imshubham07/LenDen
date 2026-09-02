import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomNavProps = {
  activeTab: string;
  onProfilePress: () => void;
};

const tabs = [
  { key: 'home', icon: '⌂', label: 'Home' },
  { key: 'borrowers', icon: '◉', label: 'Borrowers' },
  { key: 'payments', icon: '₹', label: 'Payments' },
  { key: 'profile', icon: '◎', label: 'Profile' },
];

export function BottomNav({ activeTab, onProfilePress }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={tab.key === 'profile' ? onProfilePress : undefined}
            style={({ pressed }) => [styles.button, active && styles.activeButton, pressed && styles.pressed]}>
            <Text style={[styles.icon, active && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 12,
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: '#061B35',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeButton: {
    backgroundColor: 'rgba(120, 236, 52, 0.14)',
  },
  pressed: {
    opacity: 0.82,
  },
  icon: {
    color: '#AEBBD1',
    fontSize: 20,
    fontWeight: '900',
  },
  activeIcon: {
    color: '#78EC34',
  },
  label: {
    color: '#AEBBD1',
    fontSize: 11,
    fontWeight: '800',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});
