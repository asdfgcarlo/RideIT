import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "../services/api";

type SessionContextValue = {
  session: Session | null;
  notice: string;
  signIn: (session: Session) => void;
  signOut: (notice?: string) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// Tokens remain in memory. Closing the app requires another sign-in.
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState("");
  const signIn = useCallback((next: Session) => {
    setNotice("");
    setSession(next);
  }, []);
  const signOut = useCallback((message = "") => {
    setSession(null);
    setNotice(message);
  }, []);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => signOut("Your session expired. Please sign in again."),
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, signOut]);

  const value = useMemo(
    () => ({ session, notice, signIn, signOut }),
    [session, notice, signIn, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession requires SessionProvider");
  return value;
}
