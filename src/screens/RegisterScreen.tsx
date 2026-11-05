import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import axios, { isAxiosError } from "axios";
import { API_URL } from "../services/api";
type AccountType = "Commuter" | "Driver";

type RegisterResponse = {
  success: boolean;
  message: string;
};

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("Commuter");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Weak Password",
        "Your password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Your passwords do not match.");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await axios.post<RegisterResponse>(
        `${API_URL}/api/register`,
        {
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          account_type: accountType,
        },
        {
          timeout: 15000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        Alert.alert(
          "Registration Successful!",
          "Your RideIT account has been saved. You can now log in.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/login"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Registration Failed",
          response.data.message || "Unable to create your account.",
        );
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        let message =
          serverMessage ||
          "Cannot connect to the RideIT backend. Check your network and API URL.";

        if (status === 409) {
          message = "This email is already registered. Please log in instead.";
        } else if (error.code === "ECONNABORTED") {
          message = "The request timed out. Please try again.";
        }

        Alert.alert("Registration Failed", message);
      } else {
        Alert.alert(
          "Registration Failed",
          "An unexpected error occurred. Please try again.",
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
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.logo}>RideIT</Text>
              <Text style={styles.tagline}>Your journey starts here.</Text>
            </View>

            <BlurView intensity={35} tint="dark" style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join RideIT and travel smarter.
              </Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#ccc9ce"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#ccc9ce"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
              />

              <Text style={styles.label}>Account Type</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownVisible(!dropdownVisible)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.dropdownText}>{accountType}</Text>
                <Text style={styles.arrow}>{dropdownVisible ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {dropdownVisible && (
                <View style={styles.dropdownMenu}>
                  {(["Commuter", "Driver"] as AccountType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.dropdownOption,
                        accountType === type && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setAccountType(type);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{type}</Text>
                      {accountType === type && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#ccc9ce"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#ccc9ce"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  disabled={isLoading}
                >
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 35,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logo: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    color: "#ccc9ce",
    fontSize: 14,
    marginTop: 5,
  },
  card: {
    padding: 24,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#ccc9ce",
    fontSize: 13,
    marginBottom: 22,
  },
  label: {
    color: "#ccc9ce",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 13,
  },
  input: {
    height: 49,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  dropdown: {
    height: 49,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  arrow: {
    color: "#ccc9ce",
    fontSize: 13,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ccc9ce",
    borderWidth: 1,
    borderColor: "rgba(90, 90, 92, 0.38)",
  },
  dropdownOption: {
    minHeight: 48,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedOption: {
    backgroundColor: "rgba(90, 90, 92, 0.38)",
  },
  dropdownOptionText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  checkmark: {
    color: "#ccc9ce",
    fontSize: 18,
    fontWeight: "700",
  },
  registerButton: {
    height: 51,
    borderRadius: 13,
    backgroundColor: "#ccc9ce",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
  },
  disabledButton: {
    opacity: 0.65,
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 22,
  },
  footerText: {
    color: "#ccc9ce",
    fontSize: 13,
  },
  loginLink: {
    color: "#ccc9ce",
    fontSize: 13,
    fontWeight: "700",
  },
});
