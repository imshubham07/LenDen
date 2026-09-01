import { DashboardScreen } from '@/screens/dashboard-screen';
import { LoginScreen } from '@/screens/login-screen';
import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
  const { isLoggedIn } = useAuth();

  return isLoggedIn ? <DashboardScreen /> : <LoginScreen />;
}
