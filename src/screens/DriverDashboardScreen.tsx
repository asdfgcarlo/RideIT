import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Linking,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "DriverDashboard">;

export default function DriverDashboardScreen({ route, navigation }: Props) {
  const { name } = route.params;
  const firstName = name.trim().split(" ")[0] || "Driver";

  const [isAvailable, setIsAvailable] = useState(false);
  const [isLocationSharing, setIsLocationSharing] = useState(false);

  const handleAvailability = (value: boolean) => {
    setIsAvailable(value);

    Alert.alert(
      "Driver Availability",
      value
        ? "You are now marked as available in this app."
        : "You are now marked as unavailable in this app.",
    );
  };

  const handleLocationSharing = async (value: boolean) => {
    // User turned the switch OFF
    if (!value) {
      setIsLocationSharing(false);

      Alert.alert(
        "Location Sharing",
        "Location sharing has been turned off in RideIT.",
      );
      return;
    }

    try {
      // Check whether the phone's location service is enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Location Is Turned Off",
          "Please turn on Location on your device to use RideIT GPS features.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );

        setIsLocationSharing(false);
        return;
      }

      // Request permission from Android or iOS
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setIsLocationSharing(false);

        Alert.alert(
          "Location Permission Required",
          "RideIT needs access to your location to support GPS-based bus tracking.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );

        return;
      }

      // Permission granted: retrieve the current GPS coordinates
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setIsLocationSharing(true);

      Alert.alert(
        "Location Enabled",
        `Your current location was accessed successfully.\n\nLatitude: ${position.coords.latitude.toFixed(6)}\nLongitude: ${position.coords.longitude.toFixed(6)}`,
      );
    } catch (error) {
      setIsLocationSharing(false);

      Alert.alert(
        "Location Error",
        "RideIT could not retrieve your location. Please check your device settings and try again.",
      );
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/f_ScreenBG.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>RideIT</Text>
              <Text style={styles.subtitle}>DRIVER PORTAL</Text>
            </View>

            <View style={styles.driverBadge}>
              <Text style={styles.driverBadgeText}>DRIVER</Text>
            </View>
          </View>

          {/* Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Welcome, {firstName}!</Text>
            <Text style={styles.description}>
              Manage your availability and trip information.
            </Text>
          </View>

          {/* Driver Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTextContainer}>
                <Text style={styles.cardEyebrow}>YOUR STATUS</Text>
                <Text style={styles.statusTitle}>
                  {isAvailable ? "Available" : "Unavailable"}
                </Text>
                <Text style={styles.statusDescription}>
                  {isAvailable
                    ? "You are marked as ready to drive."
                    : "Turn on availability when you are ready."}
                </Text>
              </View>

              <View
                style={[
                  styles.statusIndicator,
                  isAvailable
                    ? styles.statusIndicatorOn
                    : styles.statusIndicatorOff,
                ]}
              >
                <Text style={styles.statusEmoji}>
                  {isAvailable ? "/" : "-"}
                </Text>
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Available for trips</Text>
              <Switch
                value={isAvailable}
                onValueChange={handleAvailability}
                trackColor={{
                  false: "#d9d6db",
                  true: "#b7b5b8",
                }}
                thumbColor={isAvailable ? "#FFFFFF" : "#ccc9ce"}
              />
            </View>
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location Services</Text>

          <View style={styles.glassCard}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>GPS Location Sharing</Text>
              <Text style={styles.cardDescription}>
                {isLocationSharing
                  ? "Enabled in the interface; GPS integration is pending."
                  : "Allow RideIT to share your bus location once GPS is connected."}
              </Text>
            </View>
          </View>

          <View style={styles.switchCard}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}> Share my location</Text>
              <Text style={styles.switchHint}>
                {isLocationSharing ? "       Enabled" : "       Disabled"}
              </Text>
            </View>

            <Switch
              value={isLocationSharing}
              onValueChange={handleLocationSharing}
              trackColor={{
                false: "#d9d6db",
                true: "#b7b5b8",
              }}
              thumbColor={isLocationSharing ? "#FFFFFF" : "#ccc9ce"}
            />
          </View>

          {/* Trip Information */}
          <Text style={styles.sectionTitle}>Trip Management</Text>

          <TouchableOpacity
            style={styles.glassCard}
            onPress={() =>
              Alert.alert(
                "Current Trip",
                "trip assignments and route information will appear here after backend integration",
              )
            }
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Current Trip</Text>
              <Text style={styles.cardDescription}>
                View your assigned route and trip details.
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.glassCard}
            onPress={() =>
              Alert.alert(
                "Route Information",
                "northbound and southbound EDSA Carousel routes will be displayed here",
              )
            }
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Bus Route</Text>
              <Text style={styles.cardDescription}>
                Review EDSA Carousel stations and route directions.
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Driver Reminder */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Drive safely!</Text>
            <Text style={styles.infoText}>
              Keep your trip information updated. Real-time location updates and
              arrival predictions will be connected in a later development step.
            </Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert("Log Out", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Log Out",
                  style: "destructive",
                  onPress: () => navigation.replace("Login"),
                },
              ])
            }
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>RideIT • Every journey matters.</Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#160F2D",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#ccc9ce",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 3,
  },
  driverBadge: {
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  driverBadgeText: {
    color: "#ccc9ce",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  greetingSection: {
    marginTop: 34,
    marginBottom: 22,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  description: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  statusCard: {
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 29,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardEyebrow: {
    color: "#ccc9ce",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  statusTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 9,
  },
  statusDescription: {
    color: "#ccc9ce",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  statusIndicator: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIndicatorOn: {
    backgroundColor: "rgba(109,205,153,0.22)",
    borderWidth: 1,
    borderColor: "rgba(109,205,153,0.55)",
  },
  statusIndicatorOff: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statusEmoji: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.13)",
    marginTop: 20,
    paddingTop: 16,
  },
  switchLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
  },
  glassCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
    borderRadius: 19,
    padding: 16,
    marginBottom: 13,
  },

  featureIcon: {
    fontSize: 23,
  },
  cardContent: {
    flex: 1,
    marginLeft: 13,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cardDescription: {
    color: "#ccc9ce",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  chevron: {
    color: "#ccc9ce",
    fontSize: 28,
    marginLeft: 7,
  },
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 29,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  switchHint: {
    color: "#ccc9ce",
    fontSize: 11,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderRadius: 18,
    padding: 17,
    borderLeftWidth: 3,
    borderLeftColor: "#ccc9ce",
    marginTop: 13,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  infoText: {
    color: "#ccc9ce",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  logoutButton: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 11,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderColor: "rgba(90, 90, 92, 0.38)",
  },
  logoutText: {
    color: "#ccc9ce",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    color: "#ffffff",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },
});
