
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import LiveLocationMap from '../components/LiveLocationMap';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CommuterDashboard'
>;

export default function CommuterDashboardScreen({
  route,
  navigation,
}: Props) {
  const { name } = route.params;
  const firstName = name.trim().split(' ')[0] || 'Commuter';

  return (
    <ImageBackground
      source={require('../../assets/images/f_ScreenBG.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>RideIT</Text>
              <Text style={styles.subtitle}>COMMUTER PORTAL</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() =>
                Alert.alert('My Profile', `Signed in as ${name}`)
              }
            >
              <Text style={styles.profileIcon}>P</Text>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Hello, {firstName}!</Text>
            <Text style={styles.description}>
              Your next ride starts here.
            </Text>
          </View>

          {/* Main ETA Card */}
          <View style={styles.etaCard}>
            <Text style={styles.cardEyebrow}>YOUR NEXT BUS</Text>
            <Text style={styles.etaNumber}>-- min</Text>
            <Text style={styles.etaDescription}>
              Estimated arrival time
            </Text>

            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                Waiting for bus information
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                Alert.alert(
                  'Bus Arrival',
                  'Live arrival predictions will appear here once the RideIT API is connected.',
                )
              }
            >
              <Text style={styles.primaryButtonText}>
                View Bus Arrivals →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Station Selection */}
          <Text style={styles.sectionTitle}>Your Journey</Text>

          <TouchableOpacity
            style={styles.glassCard}
            onPress={() =>
              Alert.alert(
                'Select Station',
                'Station selection and route information will be connected to the RideIT station database.',
              )
            }
          >
            

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Choose Your Station</Text>
              <Text style={styles.cardDescription}>
                Select your EDSA Carousel boarding point.
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Quick Features */}
          <Text style={styles.sectionTitle}>Quick Access</Text>

          <View style={styles.featureRow}>
            <View
              style={[styles.featureCard, styles.featureCardLeft]}
            >
              <Text style={styles.featureTitle}>Live Map</Text>
              <LiveLocationMap />
            </View>

            <TouchableOpacity
              style={[styles.featureCard, styles.featureCardRight]}
              onPress={() =>
                Alert.alert(
                  'Notifications',
                  'Bus arrival notifications will be available after notification integration.',
                )
              }
            >
              
              <Text style={styles.featureTitle}>Notifications</Text>
              <Text style={styles.featureSmall}>
                Stay updated
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Information */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Travel smarter with RideIT</Text>
            <Text style={styles.infoText}>
              Plan your commute with predicted bus arrival times along
              the EDSA Carousel.
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: () => navigation.replace('Login'),
                },
              ])
            }
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>RideIT • Your journey, predicted.</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#160F2D',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#ccc9ce',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 3,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(90, 90, 92, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 21,
    color: '#ccc9ce',
  },
  greetingSection: {
    marginTop: 34,
    marginBottom: 22,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 7,
  },
  etaCard: {
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(90, 90, 92, 0.38)',
    borderRadius: 25,
    padding: 23,
    marginBottom: 29,
  },
  cardEyebrow: {
    color: '#ccc9ce',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  etaNumber: {
    color: '#FFFFFF',
    fontSize: 43,
    fontWeight: '800',
    marginTop: 12,
  },
  etaDescription: {
    color: '#ccc9ce',
    fontSize: 13,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 21,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc9ce',
    marginRight: 9,
  },
  statusText: {
    color: '#ccc9ce',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#ccc9ce',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(90, 90, 92, 0.38)',
    borderRadius: 19,
    padding: 16,
    marginBottom: 28,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 23,
  },
  cardContent: {
    flex: 1,
    marginLeft: 13,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#ccc9ce',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  chevron: {
    color: '#ccc9ce',
    fontSize: 28,
    marginLeft: 7,
  },
  featureRow: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 24,
  },
  featureCard: {
    minHeight: 145,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(90, 90, 92, 0.38)',
    borderRadius: 20,
    padding: 16,
  },
  featureCardLeft: {
    gap: 12,
  },
  featureCardRight: {
    minHeight: 120,
  },
  featureIconLarge: {
    fontSize: 27,
    marginBottom: 15,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  featureSmall: {
    color: '#ccc9ce',
    fontSize: 11,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderRadius: 18,
    padding: 17,
    borderLeftWidth: 3,
    borderLeftColor: '#ccc9ce',
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#ccc9ce',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 11,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(90, 90, 92, 0.38)',
    borderColor: 'rgba(90, 90, 92, 0.38)',
  },
  logoutText: {
    color: '#ccc9ce',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  },
});
