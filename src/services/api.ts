import { create } from "axios";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "https://rideit-8cl7.onrender.com"
).replace(/\/+$/, "");

export const api = create({ baseURL: API_URL, timeout: 30000 });

export type AccountType = "Admin" | "Commuter" | "Driver";
export type User = {
  id: number;
  full_name: string;
  email: string;
  account_type: AccountType;
};
export type Session = { user: User; accessToken: string; expiresAt: number };
export type AdminStats = {
  total_users: number;
  commuters: number;
  drivers: number;
  stations: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export async function authenticate(email: string, password: string): Promise<Session> {
  const { data } = await api.post<unknown>("/api/login", { email, password });
  if (!isRecord(data) || data.success !== true) {
    throw new Error("Unable to sign in. Please try again.");
  }
  const user = data.user;
  if (
    !isRecord(user) || !Number.isSafeInteger(user.id) ||
    typeof user.full_name !== "string" || typeof user.email !== "string" ||
    !["Admin", "Commuter", "Driver"].includes(String(user.account_type)) ||
    typeof data.access_token !== "string" || !data.access_token ||
    typeof data.expires_in !== "number" || !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0 || data.expires_in > 86400
  ) {
    throw new Error("The server could not start your session. Please try again later.");
  }
  return {
    user: user as User,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function fetchAdminStats(accessToken: string, signal: AbortSignal) {
  const { data } = await api.get<unknown>("/api/admin/stats", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });
  const stats = isRecord(data) ? data.stats : null;
  if (
    !isRecord(data) || data.success !== true || !isRecord(stats) ||
    !["total_users", "commuters", "drivers", "stations"].every(
      (key) => Number.isSafeInteger(stats[key]) && (stats[key] as number) >= 0,
    )
  ) {
    throw new Error("Dashboard counts are unavailable. Please try again.");
  }
  return stats as AdminStats;
}
