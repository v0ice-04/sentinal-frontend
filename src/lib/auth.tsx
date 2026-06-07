import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const AUTH_KEY = "sentinel_auth";
const USER_KEY = "sentinel_user";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function readState(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage.getItem(AUTH_KEY) !== "true") return null;
    const name = window.localStorage.getItem(USER_KEY) || "User";
    return { name, email: "" };
  } catch {
    return null;
  }
}

function writeState(u: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (u) {
    window.localStorage.setItem(AUTH_KEY, "true");
    window.localStorage.setItem(USER_KEY, u.name);
  } else {
    window.localStorage.removeItem(AUTH_KEY);
    window.localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(readState());
    setHydrated(true);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    const name = email.split("@")[0] || "User";
    const u: AuthUser = { name, email };
    writeState(u);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    const u: AuthUser = { name, email };
    writeState(u);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(() => {
    writeState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, signIn, signUp, signOut }),
    [user, signIn, signUp, signOut],
  );

  if (!hydrated) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Routes that don't require auth (rendered without sidebar/topbar chrome)
export const PUBLIC_ROUTES = new Set<string>(["/", "/signin", "/signup", "/forgot-password"]);
