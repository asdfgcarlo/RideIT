import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { leafletDocument, type LeafletMapProps } from './leafletDocument';

const source = { html: leafletDocument, baseUrl: 'https://rideit.local/' };

export default function LeafletMap({ position, recenter }: LeafletMapProps) {
  const webView = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (ready) webView.current?.injectJavaScript(
      `window.updateRideITLocation(${JSON.stringify({ position, recenter })}); true;`,
    );
  }, [position, recenter, ready]);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [ready, generation]);

  return (
    <View style={styles.container}>
      <WebView<object>
        key={generation}
        ref={webView}
        source={source}
        originWhitelist={['*']}
        style={styles.container}
        scrollEnabled={false}
        geolocationEnabled={false}
        onMessage={({ nativeEvent }) => {
          if (nativeEvent.data === 'ready') { setReady(true); setFailed(false); }
          if (nativeEvent.data === 'error') setFailed(true);
        }}
        onError={() => { setReady(false); setFailed(true); }}
        onContentProcessDidTerminate={() => { setReady(false); setFailed(true); }}
        onShouldStartLoadWithRequest={({ url }) => url === 'about:blank' || url === source.baseUrl}
      />
      {!ready && !failed && <View style={styles.overlay}><ActivityIndicator color="#160F2D" /><Text>Loading map…</Text></View>}
      {failed && <View style={styles.overlay}>
        <Text>Map unavailable. Check your internet connection.</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => { setReady(false); setFailed(false); setGeneration(value => value + 1); }}>
          <Text style={styles.retry}>Reload map</Text>
        </TouchableOpacity>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8e5ed' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12, backgroundColor: '#e8e5ed' },
  retry: { color: '#2563eb', padding: 12, fontWeight: '700' },
});
