
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CommuterDashboardScreen from '../screens/CommuterDashboardScreen';
import DriverDashboardScreen from '../screens/DriverDashboardScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  CommuterDashboard: { name: string; userId: number };
  DriverDashboard: { name: string; userId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#160F2D' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="CommuterDashboard"
        component={CommuterDashboardScreen}
      />
      <Stack.Screen
        name="DriverDashboard"
        component={DriverDashboardScreen}
      />
    </Stack.Navigator>
  );
}
