import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../auth/SessionProvider";

function Routes() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: "fade",
      contentStyle: { backgroundColor: "#160F2D" },
    }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={session?.user.account_type === "Admin"}>
        <Stack.Screen name="admin/index" />
      </Stack.Protected>
      <Stack.Protected guard={session?.user.account_type === "Commuter"}>
        <Stack.Screen name="commuter" />
      </Stack.Protected>
      <Stack.Protected guard={session?.user.account_type === "Driver"}>
        <Stack.Screen name="driver" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Routes />
      </SafeAreaProvider>
    </SessionProvider>
  );
}
