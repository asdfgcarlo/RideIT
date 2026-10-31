import { Redirect } from "expo-router";
import { useSession } from "../auth/SessionProvider";
import SplashScreen from "../screens/SplashScreen";

export default function Index() {
  const { session } = useSession();
  if (session) {
    const role = session.user.account_type;
    return <Redirect href={role === "Admin" ? "/admin" : role === "Driver" ? "/driver" : "/commuter"} />;
  }
  return <SplashScreen />;
}
