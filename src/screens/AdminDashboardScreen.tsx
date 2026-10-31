import { useEffect, useRef, useState, type ComponentRef } from "react";
import { isAxiosError } from "axios";
import { BlurTargetView, BlurView } from "expo-blur";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../auth/SessionProvider";
import { fetchAdminStats, type AdminStats } from "../services/api";

export default function AdminDashboardScreen() {
  const backgroundRef = useRef<ComponentRef<typeof BlurTargetView> | null>(
    null,
  );
  const glassProps = {
    blurTarget: backgroundRef,
    blurMethod: "dimezisBlurViewSdk31Plus" as const,
    intensity: 45,
    tint: "dark" as const,
  };
  const { session, signOut } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    fetchAdminStats(accessToken, controller.signal)
      .then((counts) => {
        if (!controller.signal.aborted) setStats(counts);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (isAxiosError(failure)) {
          const status = failure.response?.status;
          if (status === 401 || status === 403) {
            setStats(null);
            signOut(
              status === 403
                ? "Your account no longer has admin access. Please sign in again."
                : "Your session expired. Please sign in again.",
            );
            return;
          }
          setError(
            failure.code === "ECONNABORTED"
              ? "Loading counts timed out. Please try again."
              : "Unable to load dashboard counts. Check your connection and try again.",
          );
        } else {
          setError("Dashboard counts are unavailable. Please try again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, attempt, signOut]);

  const summaries = [
    { label: "Total users", value: stats?.total_users },
    { label: "Commuters", value: stats?.commuters },
    { label: "Drivers", value: stats?.drivers },
    { label: "Stations", value: stats?.stations },
  ];

  return (
    <View style={styles.background}>
      <BlurTargetView
        ref={backgroundRef}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <ImageBackground
          source={require("../../assets/images/f_ScreenBG.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </BlurTargetView>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.brand}>RideIT</Text>
          <Text style={styles.subtitle}>ADMIN PORTAL</Text>

          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                error
                  ? "Retry loading dashboard counts"
                  : "Refresh dashboard counts"
              }
              accessibilityState={{ disabled: loading, busy: loading }}
              disabled={loading}
              onPress={() => {
                setLoading(true);
                setError("");
                setAttempt((value) => value + 1);
              }}
              style={({ pressed }) => [
                styles.refreshButton,
                (pressed || loading) && styles.dimmed,
              ]}
            >
              <Text style={styles.buttonText}>
                {error ? "Retry" : "Refresh"}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingRow} accessibilityLiveRegion="polite">
              <ActivityIndicator color="#ccc9ce" />
              <Text style={styles.description}>
                {stats ? "Refreshing counts…" : "Loading counts…"}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorMessage}>
              <Text accessibilityRole="alert" style={styles.errorText}>
                {error}
              </Text>
              {stats ? (
                <Text style={styles.hint}>Showing the last loaded counts.</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.summaryGrid}>
            {summaries.map((item) => (
              <BlurView
                key={item.label}
                {...glassProps}
                style={[styles.glass, styles.summaryCard]}
              >
                <Text style={styles.summaryValue}>
                  {item.value?.toLocaleString() ?? "—"}
                </Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </BlurView>
            ))}
          </View>

          {stats ? (
            <Text style={styles.hint}>
              Total users includes admin accounts.
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Management</Text>

          <BlurView
            {...glassProps}
            style={[styles.glass, styles.managementRow]}
          >
            <Text style={styles.rowTitle}>Users</Text>
            <Text style={styles.description}>
              View commuter and driver accounts.
            </Text>
            <Text style={styles.hint}>Coming next</Text>
          </BlurView>

          <BlurView
            {...glassProps}
            style={[styles.glass, styles.managementRow]}
          >
            <Text style={styles.rowTitle}>Stations</Text>
            <Text style={styles.description}>
              Review and update EDSA Carousel stations.
            </Text>
            <Text style={styles.hint}>Coming next</Text>
          </BlurView>

          <Pressable
            accessibilityRole="button"
            onPress={() => signOut()}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.dimmed,
            ]}
          >
            <Text style={styles.buttonText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 28,
    marginBottom: 16,
  },
  overviewTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  refreshButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  logoutButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  dimmed: { opacity: 0.6 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  errorMessage: { marginBottom: 18 },
  errorText: { color: "#FFD5CD", fontSize: 15, lineHeight: 23 },
  background: {
    flex: 1,
    backgroundColor: "#160F2D",
  },
  overlay: { flex: 1, backgroundColor: "rgba(90, 90, 92, 0.38)" },
  safeArea: { flex: 1 },
  glass: {
    backgroundColor: "rgba(90, 90, 92, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
    borderRadius: 19,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 30,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 23,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 32,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexBasis: "45%",
    flexGrow: 1,
    padding: 18,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: 8,
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 3,
  },
  summaryLabel: {
    color: "#ffffff",
    fontSize: 14,
  },
  hint: {
    color: "#ffffff",
    fontSize: 13,
    marginTop: 10,
  },
  managementRow: {
    padding: 16,
    marginBottom: 13,
  },
  rowTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
});
