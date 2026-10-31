import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { isAxiosError } from "axios";
import { useSession } from "../auth/SessionProvider";
import { authenticate } from "../services/api";

export default function LoginScreen() {
  const { signIn, notice } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const session = await authenticate(email.trim().toLowerCase(), password);
      setPassword("");
      signIn(session);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          (error.code === "ECONNABORTED"
            ? "The request timed out. Please try again."
            : "Cannot connect to the RideIT server. Check your connection and API URL.");

        Alert.alert("Login Failed", message);
      } else {
        Alert.alert(
          "Login Failed",
          error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("../../assets/images/f_ScreenBG.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brand}>
              <Text style={styles.brandTitle}>RideIT</Text>
              <Text style={styles.brandSubtitle}>
                Smarter journeys start here.
              </Text>
            </View>

            <BlurView intensity={50} tint="dark" style={styles.card}>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.description}>
                Sign in to continue your journey.
              </Text>
              {notice ? (
                <Text accessibilityRole="alert" style={styles.sessionNotice}>{notice}</Text>
              ) : null}

              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                placeholder="JuanDelaCruz@dmcfi.edu.ph"
                placeholderTextColor="#ccc9ce"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#ccc9ce"
                secureTextEntry
                autoComplete="current-password"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isLoading && styles.pressed,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <Pressable
                  disabled={isLoading}
                  onPress={() => router.push("/register")}
                >
                  <Text style={styles.link}>Register</Text>
                </Pressable>
              </View>
            </BlurView>

            <Text style={styles.bottomText}>Your EDSA Carousel companion</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  sessionNotice: {
    color: "#FFDFAC",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: "#160F2D",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#FFFFFF",
  },
  brandSubtitle: {
    fontSize: 13,
    color: "#ccc9ce",
    marginTop: 6,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    padding: 24,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  heading: {
    fontSize: 27,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  description: {
    color: "#ccc9ce",
    fontSize: 13,
    marginTop: 7,
    marginBottom: 26,
  },
  label: {
    color: "#ccc9ce",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 19,
  },
  primaryButton: {
    backgroundColor: "#ccc9ce",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    borderRadius: 14,
    marginTop: 7,
  },
  pressed: {
    opacity: 0.78,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  footerText: {
    color: "#ccc9ce",
    fontSize: 13,
  },
  link: {
    color: "#ccc9ce",
    fontWeight: "700",
    fontSize: 13,
  },
  bottomText: {
    color: "#ccc9ce",
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
  },
});
