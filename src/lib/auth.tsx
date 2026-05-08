import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type Role, type SessionUser } from "@/services/authService";

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "sfa_session_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const login = async (username: string, password: string) => {
    const session = await authService.login(username, password);
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type { Role, SessionUser };
