import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";
import { clearAuth, getAuth, setAuth, subscribeAuth } from "@/lib/auth-store";
import { loginUser, logoutUser } from "@/api/api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getAuth()?.user ?? null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAuth()?.accessToken ?? null);

  useEffect(() => {
    return subscribeAuth(() => {
      const auth = getAuth();
      setUser(auth?.user ?? null);
      setAccessToken(auth?.accessToken ?? null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginUser({ email, password });
    setAuth(session);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getAuth()?.refreshToken;
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch {
        // ignore network errors — local session must still be cleared
      }
    }
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
