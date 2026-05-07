import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db, type Role, type User } from "./mock-data";

interface AuthState {
  user: Omit<User, "password"> | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "sfa_session_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
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
    const found = db.users.find(
      (u) => u.username === username && u.password === password && u.active,
    );
    if (!found) throw new Error("Invalid username or password");
    const { password: _pw, ...safe } = found;
    setUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
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
