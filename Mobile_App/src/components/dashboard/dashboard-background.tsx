import { StyleSheet, View } from 'react-native';

export function DashboardBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.topGlow} />
      <View style={styles.sideGlow} />
      <View style={styles.bottomWash} />
      <View style={styles.softPanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E6EEE8',
  },
  topGlow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#BDDDB2',
    opacity: 0.48,
  },
  sideGlow: {
    position: 'absolute',
    top: 90,
    right: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#A9D2C8',
    opacity: 0.44,
  },
  bottomWash: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -80,
    height: 260,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#CADCCE',
    opacity: 0.5,
  },
  softPanel: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    height: 156,
    borderRadius: 28,
    backgroundColor: '#061B35',
    opacity: 0.06,
  },
});
