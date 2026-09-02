import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DashboardScreen } from '@/screens/dashboard-screen';
import { LoginScreen } from '@/screens/login-screen';
import { useAuth } from '@/context/auth-context';
import { WelcomeScreen } from '@/screens/welcome-screen';

const ONBOARDING_STORAGE_KEY = 'lenden:onboarding-complete:v2';

export default function HomeScreen() {
  const { isLoggedIn } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((value) => {
        setHasSeenOnboarding(value === 'true');
      })
      .catch(() => {
        setHasSeenOnboarding(false);
      })
      .finally(() => {
        setIsCheckingOnboarding(false);
      });
  }, []);

  async function completeOnboarding() {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').catch(() => null);
  }

  if (isCheckingOnboarding) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#78EC34" />
      </View>
    );
  }

  if (!hasSeenOnboarding) {
    return <WelcomeScreen onDone={completeOnboarding} />;
  }

  return isLoggedIn ? <DashboardScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#001234',
  },
});
