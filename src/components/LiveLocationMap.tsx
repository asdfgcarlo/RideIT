import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useIsFocused } from "expo-router";
import * as Location from "expo-location";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import LeafletMap from "./LeafletMap";
import type { MapPosition, RouteDirection } from "./leafletDocument";
import { carouselRoutes } from "../data/carouselRoutes";
import { distanceInMetres } from "../utils/arrivalDistance";
import {
  enableArrivalNotifications,
  showArrivalNotification,
} from "../services/arrivalNotifications";

const stationKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/\bstation\b/g, "")
    .replace(/\bavenue\b/g, "ave")
    .replace(/[^a-z0-9]/g, "");

export default function LiveLocationMap({
  destinationName = null,
  tripId = 0,
  onArrival,
}: {
  destinationName?: string | null;
  tripId?: number;
  onArrival?: (station: string) => void;
}) {
  const focused = useIsFocused();
  const arrivalBeep = useAudioPlayer(
    require("../../assets/sounds/arrival-beep.wav"),
  );
  const mounted = useRef(true);
  const requestingLocation = useRef(false);
  const alertSession = useRef({ active: false });
  const notifiedTrips = useRef(new Set<string>());
  const fixTime = useRef(0);
  const [appActive, setAppActive] = useState(
    AppState.currentState === "active",
  );
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [settingsNeeded, setSettingsNeeded] = useState(false);
  const [position, setPosition] = useState<MapPosition | null>(null);
  const [message, setMessage] = useState(
    "Enable location to see where you are on the map.",
  );
  const [recenter, setRecenter] = useState(0);
  const [overview, setOverview] = useState(0);
  const [direction, setDirection] = useState<RouteDirection>("northbound");
  const [directionOpen, setDirectionOpen] = useState(false);
  const tripKey = `${tripId}:${stationKey(destinationName || "")}`;
  const tracking = enabled && focused && appActive;
  const destination = destinationName
    ? (carouselRoutes[direction].stations.find(
        (station) => stationKey(station.name) === stationKey(destinationName),
      ) ?? null)
    : null;

  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener("change", (state) =>
      setAppActive(state === "active"),
    );
    return () => {
      mounted.current = false;
      listener.remove();
    };
  }, []);

  useEffect(() => {
    const session = { active: tracking };
    alertSession.current = session;
    return () => {
      // Cancel any pending beep or dialog when this trip is no longer visible.
      session.active = false;
    };
  }, [tracking, tripKey, direction]);

  const enableLocation = async () => {
    if (requestingLocation.current) return;
    requestingLocation.current = true;
    setRequesting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      setSettingsNeeded(!permission.granted && !permission.canAskAgain);
      if (!permission.granted) {
        setMessage(
          "Location permission was denied. Allow location access to show your position.",
        );
        return;
      }
      setEnabled(true);
      // Denial keeps in-app alerts available.
      void enableArrivalNotifications().catch(() => false);
    } catch {
      if (mounted.current)
        setMessage(
          "Could not request location. Check your device settings and try again.",
        );
    } finally {
      requestingLocation.current = false;
      if (mounted.current) setRequesting(false);
    }
  };

  useEffect(() => {
    if (!tracking) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    const fail = (text: string) => {
      if (cancelled) return;
      setMessage(text);
      setPosition(null);
      setEnabled(false);
    };
    const start = async () => {
      // A resumed screen must receive a fresh fix before it can alert again.
      fixTime.current = 0;
      setPosition(null);
      setMessage("Finding your location… This may take a moment outdoors.");
      try {
        if (!(await Location.hasServicesEnabledAsync())) {
          fail("Device location is turned off. Turn it on and try again.");
          return;
        }
        if (cancelled) return;
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setSettingsNeeded(!permission.canAskAgain);
          fail("Location access is disabled. Allow access to resume tracking.");
          return;
        }
        setSettingsNeeded(false);
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 2000,
          },
          (location) => {
            if (cancelled) return;
            if (
              !Number.isFinite(location.timestamp) ||
              !Number.isFinite(location.coords.latitude) ||
              !Number.isFinite(location.coords.longitude) ||
              Math.abs(location.coords.latitude) > 90 ||
              Math.abs(location.coords.longitude) > 180
            )
              return;
            fixTime.current = location.timestamp;
            const accuracy = location.coords.accuracy;
            const validAccuracy =
              accuracy != null && Number.isFinite(accuracy) && accuracy >= 0
                ? accuracy
                : null;
            setPosition({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: validAccuracy,
            });
            setMessage(
              validAccuracy == null
                ? "Live location · accuracy unavailable"
                : `Live location · accuracy about ${Math.round(validAccuracy)} m`,
            );
          },
          () =>
            fail(
              "Location updates stopped. Check GPS and permissions, then try again.",
            ),
        );
        // The screen can close while the native subscription is being created.
        if (cancelled) subscription.remove();
      } catch {
        fail(
          "Could not access GPS. Check device location settings and try again.",
        );
      }
    };
    void start();
    return () => {
      cancelled = true;
      fixTime.current = 0;
      subscription?.remove();
    };
  }, [tracking]);

  useEffect(() => {
    const key = tripKey;
    const session = alertSession.current;
    const canAlert = () =>
      mounted.current && session.active && AppState.currentState === "active";
    if (
      !tracking ||
      !canAlert() ||
      !destination ||
      !position ||
      notifiedTrips.current.has(key)
    )
      return;
    // Ignore stale or imprecise fixes so GPS drift does not trigger an arrival.
    const fixAge = Date.now() - fixTime.current;
    if (
      !Number.isFinite(fixAge) ||
      fixAge < 0 ||
      fixAge > 15000 ||
      position.accuracy == null ||
      position.accuracy > 100
    )
      return;
    const distance = distanceInMetres(
      position.latitude,
      position.longitude,
      destination.lat,
      destination.lng,
    );
    if (!Number.isFinite(distance) || distance > 200) return;
    notifiedTrips.current.add(key);
    if (Platform.OS !== "web") {
      Vibration.vibrate(
        Platform.OS === "ios" ? [0, 200, 200] : [0, 150, 200, 150, 200, 150],
        false,
      );
    }
    void (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });
        if (!canAlert()) return;
        await arrivalBeep.seekTo(0);
        if (canAlert()) arrivalBeep.play();
      } catch {
        if (canAlert())
          setMessage(
            "Arrival alert sent. Beep could not play; check your media volume and audio output.",
          );
      }
    })();
    onArrival?.(destination.name);
    void showArrivalNotification(destination.name)
      .catch(() => false)
      .then((shown) => {
        if (!shown && canAlert()) {
          Alert.alert(
            `Arriving at ${destination.name}`,
            `You are arriving at ${destination.name}. \nPrepare to get off at your destination.`,
          );
        }
      });
  }, [position, destination, tripKey, tracking, onArrival, arrivalBeep]);

  return (
    <View style={styles.card}>
      <View style={styles.map}>
        <LeafletMap
          position={tracking ? position : null}
          recenter={recenter}
          direction={direction}
          overview={overview}
          destination={destination}
        />
      </View>
      <View style={styles.controls}>
        {destinationName && (
          <Text style={styles.message}>
            {destination
              ? `Trip endpoint: ${destination.name} (yellow marker)`
              : `Coordinates unavailable for ${destinationName}.`}
          </Text>
        )}
        {destination && (
          <Text style={styles.hint}>
            Arrival alert within 200 m while this dashboard is open. Enable
            location to start.
          </Text>
        )}
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {enabled && !appActive
            ? "Location paused while the app is in the background."
            : message}
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: requesting, busy: requesting }}
            disabled={requesting}
            style={[styles.button, requesting && styles.disabledButton]}
            onPress={() => {
              if (enabled) {
                setEnabled(false);
                setPosition(null);
                setMessage("Location tracking stopped.");
              } else void enableLocation();
            }}
          >
            <Text style={styles.buttonText}>
              {requesting
                ? "Requesting…"
                : enabled
                  ? "Stop location"
                  : "Enable My Location"}
            </Text>
          </TouchableOpacity>
          {settingsNeeded && Platform.OS !== "web" && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                void Linking.openSettings().catch(() =>
                  setMessage(
                    "Open your device settings to allow location access.",
                  ),
                );
              }}
            >
              <Text style={styles.buttonText}>Open settings</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !tracking || !position }}
            disabled={!tracking || !position}
            style={[
              styles.button,
              (!tracking || !position) && styles.disabledButton,
            ]}
            onPress={() => setRecenter((value) => value + 1)}
          >
            <Text style={styles.buttonText}>Re-center</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Route direction"
            accessibilityState={{ expanded: directionOpen }}
            style={styles.button}
            onPress={() => setDirectionOpen((value) => !value)}
          >
            <Text style={styles.buttonText}>
              {direction === "northbound" ? "Northbound" : "Southbound"}{" "}
              {directionOpen ? "▴" : "▾"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.button}
            onPress={() => setOverview((value) => value + 1)}
          >
            <Text style={styles.buttonText}>Show Full Route</Text>
          </TouchableOpacity>
        </View>
        {directionOpen && (
          <View style={styles.directionMenu}>
            {(["northbound", "southbound"] as const).map((value) => (
              <TouchableOpacity
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: direction === value }}
                style={[
                  styles.button,
                  direction === value && styles.selectedDirection,
                ]}
                onPress={() => {
                  setDirection(value);
                  setDirectionOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    direction === value && styles.selectedDirectionText,
                  ]}
                >
                  {value === "northbound"
                    ? "Northbound: PITX to Monumento"
                    : "Southbound: Monumento to PITX"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.hint}>
          Black Dot: YOUR LOCATION. Circle: GPS accuracy. Drag to explore.
          Re-center to follow again.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 19, overflow: "hidden", backgroundColor: "#7e7e7e" },
  map: { height: 320 },
  controls: { padding: 14, gap: 12 },
  message: { color: "#fff", fontSize: 13, lineHeight: 19 },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  directionMenu: { gap: 6 },
  selectedDirection: { backgroundColor: "#2f2f30" },
  selectedDirectionText: { color: "#FFFFFF" },
  disabledButton: { opacity: 0.5 },
  button: {
    backgroundColor: "#ccc9ce",
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: { color: "#241b38", fontWeight: "700", fontSize: 13 },
  hint: { color: "#ffffff", fontSize: 11, lineHeight: 16 },
});
