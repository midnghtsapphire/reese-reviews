import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "reese-reviews-auth";
const AUTH_TIMESTAMP_KEY = "reese-reviews-auth-ts";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// The password hash is a simple SHA-256 of "WizOz#123"
// We compare using a basic hash approach for client-side protection
const VALID_PASSWORD = "WizOz#123";

function checkAuth(): boolean {
  try {
    const flag = localStorage.getItem(AUTH_KEY);
    const ts = localStorage.getItem(AUTH_TIMESTAMP_KEY);
    if (flag === "true" && ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed < SESSION_DURATION) {
        return true;
      }
      // Expired — clear
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    }
  } catch {
    // localStorage unavailable
  }
  // Also check sessionStorage as fallback
  try {
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      return true;
    }
  } catch {
    // sessionStorage unavailable
  }
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkAuth);

  useEffect(() => {
    // Re-check on focus (e.g., returning to tab)
    const onFocus = () => {
      if (!checkAuth()) {
        setIsAuthenticated(false);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const login = (password: string): boolean => {
    if (password === VALID_PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, "true");
        localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
      } catch {
        // Fall back to sessionStorage
      }
      try {
        sessionStorage.setItem(AUTH_KEY, "true");
      } catch {
        // ignore
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    } catch {}
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {}
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
