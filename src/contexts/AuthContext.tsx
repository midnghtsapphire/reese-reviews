// ============================================================
// AUTH CONTEXT — Supabase Auth + Legacy Password Fallback
// Provides authentication state for the entire app.
// Supports:
//   1. Supabase email/password auth (primary)
//   2. Fallback simple password (from env var VITE_FALLBACK_PASSWORD)
//   3. Session persistence via Supabase + localStorage
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// ─── Types ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "owner";
  preferences: Record<string, unknown>;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  authMode: "supabase" | "fallback" | null;

  // Supabase Auth actions
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;

  // Legacy fallback
  loginWithPassword: (password: string) => boolean;
  logout: () => void;

  // Backward compat
  login: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Constants ──────────────────────────────────────────────

const FALLBACK_AUTH_KEY = "reese-reviews-auth";
const FALLBACK_TS_KEY = "reese-reviews-auth-ts";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback password from env var (not hardcoded in source)
const FALLBACK_PASSWORD = import.meta.env.VITE_FALLBACK_PASSWORD || "WizOz#123";

// ─── Helpers ────────────────────────────────────────────────

function checkFallbackAuth(): boolean {
  try {
    const flag = localStorage.getItem(FALLBACK_AUTH_KEY);
    const ts = localStorage.getItem(FALLBACK_TS_KEY);
    if (flag === "true" && ts) {
      const elapsed = Date.now() - parseInt(ts, 10);
      if (elapsed < SESSION_DURATION) return true;
      localStorage.removeItem(FALLBACK_AUTH_KEY);
      localStorage.removeItem(FALLBACK_TS_KEY);
    }
  } catch {}
  try {
    if (sessionStorage.getItem(FALLBACK_AUTH_KEY) === "true") return true;
  } catch {}
  return false;
}

// ─── Provider ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackAuth, setFallbackAuth] = useState(checkFallbackAuth);
  const [authMode, setAuthMode] = useState<"supabase" | "fallback" | null>(null);

  const isAuthenticated = !!session || fallbackAuth;

  // ─── Load profile & admin status ──────────────────────────

  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Check admin status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types
      const { data: adminRow } = await (supabase.from("admins") as any)
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      setIsAdmin(!!adminRow);

      // Load or create profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types
      const { data: profileRow } = await (supabase.from("user_profiles") as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileRow) {
        setProfile(profileRow as UserProfile);
      } else {
        // Auto-create profile on first login
        const newProfile = {
          user_id: userId,
          display_name: null,
          role: "user",
          preferences: {},
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types
        const { data: created } = await (supabase.from("user_profiles") as any)
          .insert(newProfile)
          .select()
          .single();
        if (created) setProfile(created as UserProfile);
      }
    } catch (err) {
      console.warn("[Auth] Failed to load profile:", err);
    }
  }, []);

  // ─── Initialize auth state ────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted && currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          setAuthMode("supabase");
          await loadProfile(currentSession.user.id);
        } else if (mounted && fallbackAuth) {
          setAuthMode("fallback");
        }
      } catch {
        // Supabase unavailable — rely on fallback
        if (mounted && fallbackAuth) {
          setAuthMode("fallback");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setAuthMode("supabase");
          await loadProfile(newSession.user.id);
        } else if (!fallbackAuth) {
          setAuthMode(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, fallbackAuth]);

  // Re-check fallback on window focus
  useEffect(() => {
    const onFocus = () => {
      if (!session && !checkFallbackAuth()) {
        setFallbackAuth(false);
        setAuthMode(null);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [session]);

  // ─── Supabase Auth actions ────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || "" },
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: String(err) };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: String(err) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    // Also clear fallback
    clearFallback();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setAuthMode(null);
    setFallbackAuth(false);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: String(err) };
    }
  };

  const updateProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types
      const { error } = await (supabase.from("user_profiles") as any)
        .update(updates)
        .eq("user_id", user.id);
      if (error) return { error: error.message };
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    } catch (err) {
      return { error: String(err) };
    }
  };

  // ─── Legacy fallback ─────────────────────────────────────

  const loginWithPassword = (password: string): boolean => {
    if (password === FALLBACK_PASSWORD) {
      try {
        localStorage.setItem(FALLBACK_AUTH_KEY, "true");
        localStorage.setItem(FALLBACK_TS_KEY, Date.now().toString());
      } catch {}
      try {
        sessionStorage.setItem(FALLBACK_AUTH_KEY, "true");
      } catch {}
      setFallbackAuth(true);
      setAuthMode("fallback");
      return true;
    }
    return false;
  };

  const clearFallback = () => {
    try {
      localStorage.removeItem(FALLBACK_AUTH_KEY);
      localStorage.removeItem(FALLBACK_TS_KEY);
    } catch {}
    try {
      sessionStorage.removeItem(FALLBACK_AUTH_KEY);
    } catch {}
  };

  const logout = () => {
    signOut();
  };

  // Backward compat: login() is alias for loginWithPassword()
  const login = loginWithPassword;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        session,
        profile,
        isAdmin,
        authMode,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        loginWithPassword,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
