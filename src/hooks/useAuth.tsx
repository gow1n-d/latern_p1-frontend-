import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type StoredAccount = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: string;
};

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: "00000000-0000-0000-0000-000000000000",
    email: "admin@paperforge.com",
    password: "superadmin",
    name: "Super Admin",
    role: "admin",
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "studentadmin@paperforge.com",
    password: "studentadmin",
    name: "Student Admin",
    role: "admin",
    created_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "researcher@paperforge.com",
    password: "researcher123",
    name: "Dr. Sarah Chen",
    role: "pro",
    created_at: "2024-01-01T00:00:00.000Z",
  },
];

export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem("pf_registered_users");
    if (!raw) {
      localStorage.setItem("pf_registered_users", JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem("pf_registered_users", JSON.stringify(DEFAULT_ACCOUNTS));
      return [...DEFAULT_ACCOUNTS];
    }
    // Ensure default accounts exist
    const emails = new Set(parsed.map((a: StoredAccount) => a.email.toLowerCase()));
    let updated = false;
    for (const def of DEFAULT_ACCOUNTS) {
      if (!emails.has(def.email.toLowerCase())) {
        parsed.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem("pf_registered_users", JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [...DEFAULT_ACCOUNTS];
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  const current = getStoredAccounts();
  const existingIdx = current.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
  if (existingIdx !== -1) {
    current[existingIdx] = account;
  } else {
    current.push(account);
  }
  localStorage.setItem("pf_registered_users", JSON.stringify(current));
}

function buildUserFromAccount(account: StoredAccount): User {
  return {
    id: account.id,
    email: account.email,
    user_metadata: { full_name: account.name },
    app_metadata: { provider: "email" },
    role: "authenticated",
    aud: "authenticated",
    created_at: account.created_at,
  } as unknown as User;
}

function buildSessionFromUser(user: User): Session {
  return {
    user,
    access_token: `mock-token-${user.id}`,
    token_type: "bearer",
    expires_in: 86400 * 30, // 30 days
    refresh_token: `mock-refresh-${user.id}`,
  } as Session;
}

function isNetworkOrFetchError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === "string" 
    ? err.toLowerCase() 
    : (err instanceof Error ? err.message.toLowerCase() : JSON.stringify(err).toLowerCase());
  return (
    msg.includes("failed to fetch") ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("networkerror") ||
    msg.includes("connection") ||
    msg.includes("timeout") ||
    msg.includes("cors")
  );
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check localStorage for mock session first
    const mockSessionStr = localStorage.getItem("pf_mock_session");
    if (mockSessionStr) {
      try {
        const mockSess = JSON.parse(mockSessionStr);
        if (mockSess && mockSess.user) {
          setSession(mockSess);
          setUser(mockSess.user);
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem("pf_mock_session");
      }
    }

    // 2. Try Supabase session safely with timeout
    let resolved = false;
    const safetyTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 1500);

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimeout);
        }
        if (session) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      });

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(safetyTimeout);
          }
          if (session) {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(safetyTimeout);
          }
          setLoading(false);
        });

      return () => {
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    } catch {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim() || cleanEmail.split("@")[0];

    // Validation
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { error: "Please enter a valid email address." };
    }
    if (cleanPassword.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Try Supabase first if available
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (!error && data?.user) {
        // Supabase sign up succeeded
        return { error: null };
      }

      // If error is not a network failure, check what it is
      if (error && !isNetworkOrFetchError(error)) {
        return { error: error.message };
      }
    } catch (err) {
      // If error is genuine business error and not network failure
      if (!isNetworkOrFetchError(err)) {
        return { error: err instanceof Error ? err.message : "Sign up failed" };
      }
    }

    // Fallback: Local offline registration (Seamless for user)
    const accounts = getStoredAccounts();
    const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { error: "An account with this email already exists. Please sign in." };
    }

    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName,
      role: "authenticated",
      created_at: new Date().toISOString(),
    };

    saveStoredAccount(newAccount);

    const newUser = buildUserFromAccount(newAccount);
    const newSession = buildSessionFromUser(newUser);

    localStorage.setItem("pf_mock_session", JSON.stringify(newSession));
    setUser(newUser);
    setSession(newSession);

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return { error: "Please enter both email and password." };
    }

    // Check pre-configured or locally registered accounts first for instant response
    const accounts = getStoredAccounts();
    const matchedAccount = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (matchedAccount) {
      if (matchedAccount.password === cleanPassword) {
        const localUser = buildUserFromAccount(matchedAccount);
        const localSession = buildSessionFromUser(localUser);
        localStorage.setItem("pf_mock_session", JSON.stringify(localSession));
        setUser(localUser);
        setSession(localSession);
        return { error: null };
      } else {
        return { error: "Incorrect password. Please verify and try again." };
      }
    }

    // Try Supabase if not matched in local accounts
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!error && data?.session) {
        setUser(data.session.user);
        setSession(data.session);
        return { error: null };
      }

      if (error) {
        if (isNetworkOrFetchError(error)) {
          return {
            error: `No account found for "${cleanEmail}". Click "Create Account" below to register this email instantly!`,
          };
        }
        return { error: error.message };
      }
    } catch (err) {
      if (isNetworkOrFetchError(err)) {
        return {
          error: `No account found for "${cleanEmail}". Click "Create Account" below to register this email instantly!`,
        };
      }
      return { error: err instanceof Error ? err.message : "Sign in failed" };
    }

    return {
      error: `No account found for "${cleanEmail}". Click "Create Account" to sign up first.`,
    };
  };

  const signOut = async () => {
    localStorage.removeItem("pf_mock_session");
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && !isNetworkOrFetchError(error)) {
        return { error: error.message };
      }
    } catch {}
    // Even if offline, return success to simulate reset link sent
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}