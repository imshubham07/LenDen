import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type BottomNavProps = {
  hindi?: boolean;
  activeTab: string;
  onTabPress: (tab: string) => void;
};

const tabs = [
  { key: 'home', label: 'Home' },
  { key: 'borrowers', label: 'Borrowers' },
  { key: 'profile', label: 'Profile' },
];

function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === 'home') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.2Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === 'borrowers') {
    return (
      <Svg width={24} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx={9} cy={8} r={3.2} stroke={color} strokeWidth={2} />
        <Circle cx={17} cy={9} r={2.5} stroke={color} strokeWidth={2} />
        <Path d="M3.8 19c.8-3.4 2.7-5.1 5.2-5.1s4.4 1.7 5.2 5.1" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M14.6 15.1c2.6.2 4.3 1.5 5.1 3.9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={2} />
      <Path d="M5.5 20c1-3.9 3.2-5.8 6.5-5.8s5.5 1.9 6.5 5.8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function BottomNav({ activeTab, onTabPress, hindi = false }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={[styles.button, active && styles.activeButton]}>
            <TabIcon name={tab.key} color={active ? '#78EC34' : '#AEBBD1'} />
            <Text style={[styles.label, active && styles.activeLabel]}>{hindi ? ({ home: 'होम', borrowers: 'उधारकर्ता', profile: 'प्रोफ़ाइल' }[tab.key]) : tab.label}</Text>
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
  label: {
    color: '#AEBBD1',
    fontSize: 11,
    fontWeight: '800',
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});
