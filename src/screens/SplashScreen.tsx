
import { useEffect } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/images/f_ScreenBG.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <BlurView intensity={45} tint="dark" style={styles.card}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>R</Text>
          </View>

          <Text style={styles.title}>RideIT</Text>
          <Text style={styles.subtitle}>
            Your ride. Your time. Your journey.
          </Text>

          <ActivityIndicator
            size="small"
            color="#ccc9ce"
            style={styles.loader}
          />

          <Text style={styles.loadingText}>Preparing your journey...</Text>
        </BlurView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(196,164,218,0.2)',
    borderWidth: 1,
    borderColor: '#ccc9ce',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 18,
  },
  subtitle: {
    color: '#ccc9ce',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  loader: {
    marginTop: 32,
  },
  loadingText: {
    color: '#ccc9ce',
    fontSize: 12,
    marginTop: 12,
  },
});
