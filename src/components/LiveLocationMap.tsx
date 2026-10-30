import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import LeafletMap from './LeafletMap';
import type { MapPosition } from './leafletDocument';

export default function LiveLocationMap() {
  const focused = useIsFocused();
  const mounted = useRef(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [enabled, setEnabled] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [settingsNeeded, setSettingsNeeded] = useState(false);
  const [position, setPosition] = useState<MapPosition | null>(null);
  const [message, setMessage] = useState('Enable location to see where you are on the map.');
  const [recenter, setRecenter] = useState(0);

  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => { mounted.current = false; listener.remove(); };
  }, []);

  const enableLocation = async () => {
    setRequesting(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!mounted.current) return;
      setSettingsNeeded(!permission.granted && !permission.canAskAgain);
      if (!permission.granted) {
        setMessage('Location permission was denied. Allow location access to show your position.');
        return;
      }
      setEnabled(true);
    } catch {
      if (mounted.current) setMessage('Could not request location. Check your device settings and try again.');
    } finally {
      if (mounted.current) setRequesting(false);
    }
  };

  useEffect(() => {
    if (!enabled || !focused || !appActive) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    const fail = (text: string) => {
      if (cancelled) return;
      setMessage(text);
      setPosition(null);
      setEnabled(false);
    };
    const start = async () => {
      setPosition(null);
      setMessage('Finding your location… This may take a moment outdoors.');
      try {
        if (!(await Location.hasServicesEnabledAsync())) {
          fail('Device location is turned off. Turn it on and try again.');
          return;
        }
        if (cancelled) return;
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setSettingsNeeded(!permission.canAskAgain);
          fail('Location access is disabled. Allow access to resume tracking.');
          return;
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
          location => {
            if (cancelled) return;
            setPosition(location.coords);
            setMessage(location.coords.accuracy == null
              ? 'Live location · accuracy unavailable'
              : `Live location · accuracy about ${Math.round(location.coords.accuracy)} m`);
          },
          () => fail('Location updates stopped. Check GPS and permissions, then try again.'),
        );
        // The screen can close while the native subscription is being created.
        if (cancelled) subscription.remove();
      } catch {
        fail('Could not access GPS. Check device location settings and try again.');
      }
    };
    void start();
    return () => { cancelled = true; subscription?.remove(); };
  }, [enabled, focused, appActive]);

  return <View style={styles.card}>
    <View style={styles.map}><LeafletMap position={enabled && focused && appActive ? position : null} recenter={recenter} /></View>
    <View style={styles.controls}>
      <Text accessibilityLiveRegion="polite" style={styles.message}>{enabled && !appActive ? 'Location paused while the app is in the background.' : message}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity accessibilityRole="button" disabled={requesting} style={styles.button} onPress={() => {
          if (enabled) { setEnabled(false); setPosition(null); setMessage('Location tracking stopped.'); }
          else void enableLocation();
        }}><Text style={styles.buttonText}>{requesting ? 'Requesting…' : enabled ? 'Stop location' : 'Enable my location'}</Text></TouchableOpacity>
        {enabled && position && <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setRecenter(value => value + 1)}><Text style={styles.buttonText}>Recenter</Text></TouchableOpacity>}
        {settingsNeeded && Platform.OS !== 'web' && <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => { void Linking.openSettings().catch(() => setMessage('Open your device settings to allow location access.')); }}><Text style={styles.buttonText}>Open settings</Text></TouchableOpacity>}
      </View>
      <Text style={styles.hint}>Blue dot: your location. Circle: GPS accuracy. Drag to explore; Recenter to follow again.</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 19, overflow: 'hidden', backgroundColor: '#ccc9ce' },
  map: { height: 320 },
  controls: { padding: 14, gap: 12 },
  message: { color: '#fff', fontSize: 13, lineHeight: 19 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { backgroundColor: '#ccc9ce', borderRadius: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  hint: { color: '#ffffff', fontSize: 11, lineHeight: 16 },
});
